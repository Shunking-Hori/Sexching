import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import type { User } from '../../App';
import { supabase } from '../lib/supabase';
import { prefectures } from '../constants/prefectures';

type Props = {
  onSelectUser: (user: User) => void;
};

type DropdownType = 'prefecture' | null;

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
};

const DAILY_LIKE_LIMIT = 10;

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

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
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
      age: calculateAge(
        profile.birth_year,
        profile.birth_month,
        profile.birth_day
      ),
      prefecture: profile.prefecture || '未設定',
      profile: profile.profile || '自己紹介はまだありません。',
      photoUrl: photoUrls[0] || null,
      photoUrls,
      hobbies: profile.hobbies ? profile.hobbies.split(',') : [],
      holiday: profile.holiday || '未設定',
      job: profile.job || '未設定',
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

    const oppositeGender = myProfile.gender === '男性' ? '女性' : '男性';

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

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('is_banned', false)
      .eq('gender', oppositeGender)
      .order('created_at', { ascending: false });

    if (profilesError) {
      alert(profilesError.message);
      setIsInitialLoading(false);
      return;
    }

    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('to_user')
      .eq('from_user', user.id);

    if (likesError) {
      alert(likesError.message);
      setIsInitialLoading(false);
      return;
    }

    setLikedUserIds((likes || []).map((like) => like.to_user));

    const displayUsers = (profiles || [])
      .filter((profile) => !blockedUserIds.has(profile.id))
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
    alert('いいねを送信しました。');
  };

  const resetFilters = () => {
    setPrefectureFilter('');
    setMinAge('');
    setMaxAge('');
    setOpenDropdown(null);
  };

  const renderPrefectureDropdown = () => {
    const isOpen = openDropdown === 'prefecture';

    return (
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setOpenDropdown(isOpen ? null : 'prefecture')}
        >
          <Text
            style={[
              styles.dropdownText,
              !prefectureFilter && styles.placeholderText,
            ]}
          >
            {prefectureFilter || '都道府県を選択'}
          </Text>
          <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isOpen && (
          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setPrefectureFilter('');
                setOpenDropdown(null);
              }}
            >
              <Text style={styles.dropdownItemText}>指定なし</Text>
            </TouchableOpacity>

            {prefectures.map((prefecture) => (
              <TouchableOpacity
                key={prefecture}
                style={styles.dropdownItem}
                onPress={() => {
                  setPrefectureFilter(prefecture);
                  setOpenDropdown(null);
                }}
              >
                <Text style={styles.dropdownItemText}>{prefecture}</Text>
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
      <Text style={styles.subtitle}>
        
      </Text>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          本日のいいね：{todayLikeCount}/{DAILY_LIKE_LIMIT}
        </Text>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>検索条件</Text>

        <Text style={styles.filterLabel}>年齢</Text>
        <View style={styles.ageRow}>
          <TextInput
            style={styles.ageInput}
            value={minAge}
            onChangeText={setMinAge}
            placeholder="最小"
            keyboardType="numeric"
          />
          <Text style={styles.ageSeparator}>〜</Text>
          <TextInput
            style={styles.ageInput}
            value={maxAge}
            onChangeText={setMaxAge}
            placeholder="最大"
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.filterLabel}>都道府県</Text>
        {renderPrefectureDropdown()}

        <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetButtonText}>条件をリセット</Text>
        </TouchableOpacity>
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

      <ScrollView showsVerticalScrollIndicator={false}>
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
              {user.photoUrl ? (
                <Image
                  source={{ uri: user.photoUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.name.substring(0, 1)}
                  </Text>
                </View>
              )}

              <Text style={styles.name}>
                {user.name} / {user.age ? `${user.age}` : '年齢未設定'}
              </Text>

              <Text style={styles.prefecture}>
                {user.gender} / {user.prefecture}
              </Text>

              <Text style={styles.profile}>{user.profile}</Text>

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
                    ? '承認待ち'
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
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 6,
    marginBottom: 10,
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
  filterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
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
    alignItems: 'center',
    gap: 8,
  },
  ageInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ageSeparator: {
    color: colors.subText,
    fontWeight: '800',
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 30,
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
    maxHeight: 190,
    zIndex: 40,
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
    marginTop: 10,
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
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignSelf: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
  },
  name: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  prefecture: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    marginTop: 5,
  },
  profile: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 14,
  },
  likeButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  likeButtonLiked: {
    backgroundColor: colors.likedGray,
  },
  likeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});