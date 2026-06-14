import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import type { User } from '../../App';
import { supabase } from '../lib/supabase';
import { prefectures } from '../constants/prefectures';

type Props = {
  onSelectUser: (user: User) => void;
};

type DropdownType = 'prefecture' | 'minAge' | 'maxAge' | null;

type ProfileRow = {
  id: string;
  nickname: string | null;
  gender: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  prefecture: string | null;
  profile: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
  hobbies: string | null;
  holiday: string | null;
  job: string | null;
  bust_size: string | null;
};

const DAILY_LIKE_LIMIT = 10;
const AGE_OPTIONS = Array.from({ length: 63 }, (_, index) => String(index + 18));

export function MatchListScreen({ onSelectUser }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [likedUserIds, setLikedUserIds] = useState<string[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [todayLikeCount, setTodayLikeCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [prefectureFilter, setPrefectureFilter] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const getTodayStartIso = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  };

  const calculateAge = (
    birthYear: number | null,
    birthMonth: number | null,
    birthDay: number | null
  ) => {
    if (!birthYear || !birthMonth || !birthDay) return 0;

    const today = new Date();
    const birthday = new Date(birthYear, birthMonth - 1, birthDay);

    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age -= 1;
    }

    return age;
  };

  const convertProfileToUser = (profile: ProfileRow): User => {
    const photoUrls =
      profile.photo_urls && profile.photo_urls.length > 0
        ? profile.photo_urls
        : profile.photo_url
          ? [profile.photo_url]
          : [];

    return {
      id: profile.id,
      name: profile.nickname || '未設定',
      gender: profile.gender || '未設定',
      age: calculateAge(profile.birth_year, profile.birth_month, profile.birth_day),
      prefecture: profile.prefecture || '未設定',
      profile: profile.profile || '自己紹介はまだありません。',
      photoUrl: photoUrls[0] || null,
      photoUrls,
      hobbies: profile.hobbies ? profile.hobbies.split(',') : [],
      holiday: profile.holiday || '未設定',
      job: profile.job || '未設定',
      bustSize: profile.bust_size || undefined,
    };
  };

  const loadTodayLikeCount = async (userId: string) => {
    const { count, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('from_user', userId)
      .gte('created_at', getTodayStartIso());

    if (error) {
      alert(error.message);
      return;
    }

    setTodayLikeCount(count || 0);
  };

  const loadUsers = async () => {
    setIsInitialLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    setMyUserId(user.id);
    await loadTodayLikeCount(user.id);

    const { data: myProfile, error: myProfileError } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', user.id)
      .single();

    if (myProfileError || !myProfile?.gender) {
      alert('自分のプロフィール情報を取得できませんでした。');
      setIsInitialLoading(false);
      return;
    }

    const visibleGenders =
      myProfile.gender === '男性'
        ? ['女性']
        : ['男性', '女性'];

    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('from_user, to_user')
      .or(`from_user.eq.${user.id},to_user.eq.${user.id}`);

    if (blocksError) {
      alert(blocksError.message);
      setIsInitialLoading(false);
      return;
    }

    const blockedUserIds = new Set<string>();

    (blocks || []).forEach((block) => {
      if (block.from_user === user.id) blockedUserIds.add(block.to_user);
      if (block.to_user === user.id) blockedUserIds.add(block.from_user);
    });

    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('from_user, to_user, is_match')
      .or(`from_user.eq.${user.id},to_user.eq.${user.id}`);

    if (likesError) {
      alert(likesError.message);
      setIsInitialLoading(false);
      return;
    }

    const myLikedIds = new Set<string>();
    const matchedUserIds = new Set<string>();

    (likes || []).forEach((like) => {
      if (like.from_user === user.id) {
        myLikedIds.add(like.to_user);
      }

      if (like.is_match) {
        matchedUserIds.add(
          like.from_user === user.id ? like.to_user : like.from_user
        );
      }
    });

    setLikedUserIds(Array.from(myLikedIds));

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('is_banned', false)
      .in('gender', visibleGenders)
      .order('created_at', { ascending: false });

    if (profilesError) {
      alert(profilesError.message);
      setIsInitialLoading(false);
      return;
    }

    const displayUsers = (profiles || [])
      .filter((profile) => !blockedUserIds.has(profile.id))
      .filter((profile) => !matchedUserIds.has(profile.id))
      .map(convertProfileToUser);

    setUsers(displayUsers);
    setIsInitialLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (prefectureFilter && user.prefecture !== prefectureFilter) return false;
      if (minAge && user.age < Number(minAge)) return false;
      if (maxAge && user.age > Number(maxAge)) return false;
      return true;
    });
  }, [users, prefectureFilter, minAge, maxAge]);

  const filterSummary = useMemo(() => {
    const conditions: string[] = [];

    if (minAge || maxAge) {
      conditions.push(`${minAge || '18'}〜${maxAge || '80'}歳`);
    }

    if (prefectureFilter) {
      conditions.push(prefectureFilter);
    }

    return conditions.length > 0 ? conditions.join(' / ') : '指定なし';
  }, [minAge, maxAge, prefectureFilter]);

  const sendLike = async (toUserId: string) => {
    if (!myUserId) {
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    if (likedUserIds.includes(toUserId)) return;

    if (todayLikeCount >= DAILY_LIKE_LIMIT) {
      alert('本日のいいね上限に達しました。いいねは1日10回までです。');
      return;
    }

    const { data: block } = await supabase
      .from('blocks')
      .select('id')
      .or(
        `and(from_user.eq.${myUserId},to_user.eq.${toUserId}),and(from_user.eq.${toUserId},to_user.eq.${myUserId})`
      )
      .maybeSingle();

    if (block) {
      alert('このユーザーにはいいねできません。');
      return;
    }

    const { error } = await supabase.from('likes').insert({
      from_user: myUserId,
      to_user: toUserId,
      status: 'pending',
    });

    if (error) {
      alert(error.message);
      return;
    }

    setLikedUserIds([...likedUserIds, toUserId]);
    setTodayLikeCount(todayLikeCount + 1);
  };

  const resetFilters = () => {
    setPrefectureFilter('');
    setMinAge('');
    setMaxAge('');
    setOpenDropdown(null);
  };

  const renderDropdown = (
    type: DropdownType,
    value: string,
    placeholder: string,
    options: string[],
    onSelect: (value: string) => void,
    maxHeight = 190
  ) => {
    const isOpen = openDropdown === type;

    return (
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setOpenDropdown(isOpen ? null : type)}
        >
          <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
          <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isOpen && (
          <ScrollView style={[styles.dropdownList, { maxHeight }]} nestedScrollEnabled>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                onSelect('');
                setOpenDropdown(null);
              }}
            >
              <Text style={styles.dropdownItemText}>指定なし</Text>
            </TouchableOpacity>

            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(option);
                  setOpenDropdown(null);
                }}
              >
                <Text style={styles.dropdownItemText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>おすすめのお相手</Text>
      <Text style={styles.subtitle}>条件に合う相手を探しましょう</Text>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          本日のいいね：{todayLikeCount}/{DAILY_LIKE_LIMIT}
        </Text>
      </View>

      <View style={styles.filterCard}>
        <TouchableOpacity
          style={styles.filterHeader}
          activeOpacity={0.85}
          onPress={() => {
            setIsFilterOpen(!isFilterOpen);
            setOpenDropdown(null);
          }}
        >
          <View style={styles.filterHeaderTextArea}>
            <Text style={styles.filterTitle}>検索条件</Text>
            <Text style={styles.filterSummary}>{filterSummary}</Text>
          </View>

          <Text style={styles.filterToggle}>
            {isFilterOpen ? '閉じる ▲' : '開く ▼'}
          </Text>
        </TouchableOpacity>

        {isFilterOpen && (
          <View style={styles.filterBody}>
            <Text style={styles.filterLabel}>年齢</Text>

            <View style={styles.ageRow}>
              <View style={styles.ageDropdownBox}>
                {renderDropdown('minAge', minAge, '最小', AGE_OPTIONS, setMinAge, 170)}
              </View>

              <Text style={styles.ageSeparator}>〜</Text>

              <View style={styles.ageDropdownBox}>
                {renderDropdown('maxAge', maxAge, '最大', AGE_OPTIONS, setMaxAge, 170)}
              </View>
            </View>

            <Text style={styles.filterLabel}>都道府県</Text>

            {renderDropdown(
              'prefecture',
              prefectureFilter,
              '都道府県を選択',
              prefectures,
              setPrefectureFilter
            )}

            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>条件をリセット</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isInitialLoading && <Text style={styles.infoText}>読み込み中...</Text>}

      {!isInitialLoading && filteredUsers.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>表示できるお相手がいません</Text>
          <Text style={styles.emptyText}>
            条件を変更するか、他のユーザー登録を待ちましょう。
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filteredUsers.map((user) => {
          const isLiked = likedUserIds.includes(user.id);
          const isLimitReached = todayLikeCount >= DAILY_LIKE_LIMIT;

          return (
            <TouchableOpacity
              key={user.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => onSelectUser(user)}
            >
              <View style={styles.cardHeader}>
                {user.photoUrl ? (
                  <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarIcon}>👤</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.name} numberOfLines={1}>
                    {user.name} / {user.age ? `${user.age}` : '年齢未設定'}
                  </Text>

                  <Text style={styles.prefecture} numberOfLines={1}>
                    {user.gender} / {user.prefecture}
                  </Text>

                  <Text style={styles.profile} numberOfLines={2}>
                    {user.profile}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.likeButton,
                  (isLiked || isLimitReached) && styles.likeButtonLiked,
                ]}
                onPress={() => sendLike(user.id)}
                disabled={isLiked || isLimitReached}
              >
                <Text style={styles.likeText}>
                  {isLiked
                    ? '送信済み'
                    : isLimitReached
                      ? '本日の上限に到達'
                      : '♡ いいね'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  likedGray: '#9b9b9b',
  accent: '#f4d4dc',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 6,
    marginBottom: 12,
  },
  limitCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  limitText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  filterCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    zIndex: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  filterHeaderTextArea: {
    flex: 1,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  filterSummary: {
    fontSize: 12,
    color: colors.subText,
    fontWeight: '700',
  },
  filterToggle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  filterBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.subText,
    marginBottom: 6,
    marginTop: 8,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    zIndex: 50,
  },
  ageDropdownBox: {
    flex: 1,
  },
  ageSeparator: {
    color: colors.subText,
    fontWeight: '800',
    paddingTop: 12,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 60,
  },
  dropdownButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  placeholderText: {
    color: colors.subText,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.subText,
  },
  dropdownList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginTop: 6,
    zIndex: 70,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  resetButtonText: {
    color: colors.primary,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 28,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarIcon: {
    fontSize: 28,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  prefecture: {
    fontSize: 13,
    color: colors.subText,
    marginBottom: 5,
  },
  profile: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  likeButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  likeButtonLiked: {
    backgroundColor: colors.likedGray,
  },
  likeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});