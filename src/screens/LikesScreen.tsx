import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';

type ApprovedLike = {
  id: number;
  created_at: string;
  from_user: string;
  to_user: string;
  status: string;
  senderName: string;
  senderAge: number | null;
  senderPrefecture: string;
  senderProfile: string;
  senderPhotoUrl: string | null;
};

type ProfileRow = {
  id: string;
  nickname: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  prefecture: string | null;
  profile: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
};

export function LikesScreen() {
  const [likes, setLikes] = useState<ApprovedLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApprovedLikes();

    const timer = setInterval(() => {
      loadApprovedLikes(false);
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const calculateAge = (
    birthYear: number | null,
    birthMonth: number | null,
    birthDay: number | null
  ) => {
    if (!birthYear || !birthMonth || !birthDay) return null;

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

  const loadApprovedLikes = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: likeRows, error: likeError } = await supabase
      .from('likes')
      .select('id, created_at, from_user, to_user, status')
      .eq('to_user', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (likeError) {
      alert(likeError.message);
      setIsLoading(false);
      return;
    }

    const senderIds = (likeRows || []).map((like) => like.from_user);

    if (senderIds.length === 0) {
      setLikes([]);
      setIsLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, nickname, birth_year, birth_month, birth_day, prefecture, profile, photo_url, photo_urls'
      )
      .in('id', senderIds);

    if (profileError) {
      alert(profileError.message);
      setIsLoading(false);
      return;
    }

    const profileMap = new Map<string, ProfileRow>();

    (profiles || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    const displayLikes: ApprovedLike[] = (likeRows || []).map((like) => {
      const sender = profileMap.get(like.from_user);

      const senderPhotoUrls =
        sender?.photo_urls && sender.photo_urls.length > 0
          ? sender.photo_urls
          : sender?.photo_url
            ? [sender.photo_url]
            : [];

      return {
        ...like,
        senderName: sender?.nickname || '未設定',
        senderAge: sender
          ? calculateAge(
              sender.birth_year,
              sender.birth_month,
              sender.birth_day
            )
          : null,
        senderPrefecture: sender?.prefecture || '未設定',
        senderProfile: sender?.profile || '自己紹介はまだありません。',
        senderPhotoUrl: senderPhotoUrls[0] || null,
      };
    });

    setLikes(displayLikes);
    setIsLoading(false);
  };

  const acceptLike = async (likeId: number) => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('likes')
      .update({
        status: 'accepted',
        is_match: true,
        receiver_accepted_at: now,
        accepted_at: now,
        matched_at: now,
      })
      .eq('id', likeId)
      .select('id, status, is_match, matched_at')
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    if (!data?.is_match) {
      alert('マッチ更新に失敗しました。');
      return;
    }

    alert('いいねを承認しました。マッチ成立です。');
    loadApprovedLikes();
  };

  const rejectLike = async (likeId: number) => {
    const { error } = await supabase
      .from('likes')
      .update({
        status: 'receiver_rejected',
        rejected_by_receiver_at: new Date().toISOString(),
      })
      .eq('id', likeId)
      .eq('status', 'approved');

    if (error) {
      alert(error.message);
      return;
    }

    alert('いいねを却下しました。');
    loadApprovedLikes();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>いいね</Text>
      <Text style={styles.subtitle}>
        
      </Text>

      {isLoading && <Text style={styles.infoText}>読み込み中...</Text>}

      {!isLoading && likes.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>まだいいねはありません</Text>
          <Text style={styles.emptyText}>
            
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {likes.map((like) => (
          <View key={like.id} style={styles.likeCard}>
            {like.senderPhotoUrl ? (
              <Image
                source={{ uri: like.senderPhotoUrl }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {like.senderName.substring(0, 1)}
                </Text>
              </View>
            )}

            <Text style={styles.likeTitle}>
              {like.senderName} さんからいいねが届きました
            </Text>

            <Text style={styles.likeText}>
              {like.senderAge ? `${like.senderAge}歳 / ` : ''}
              {like.senderPrefecture}
            </Text>

            <View style={styles.profileBox}>
              <Text style={styles.profileTitle}>自己紹介</Text>
              <Text style={styles.profileText}>{like.senderProfile}</Text>
            </View>

            <Text style={styles.likeDate}>
              {new Date(like.created_at).toLocaleString()}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => acceptLike(like.id)}
              >
                <Text style={styles.buttonText}>承認してマッチ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => rejectLike(like.id)}
              >
                <Text style={styles.buttonText}>却下</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  reject: '#8a8a8a',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  accent: '#f4d4dc',
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
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 6,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 20,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: 30,
  },
  emptyIcon: {
    fontSize: 42,
    color: colors.primary,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  likeCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 60,
    fontWeight: '800',
    color: colors.primary,
  },
  likeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  likeText: {
    fontSize: 14,
    color: colors.subText,
    lineHeight: 22,
  },
  profileBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  profileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  profileText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  likeDate: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.reject,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});