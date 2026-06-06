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

type MatchRow = {
  id: number;
  from_user: string;
  to_user: string;
  matched_at: string | null;
  partnerId: string;
  partnerName: string;
  partnerPrefecture: string;
  partnerPhotoUrl: string | null;
  unreadCount: number;
};

type Props = {
  onOpenChat: (partnerId: string, partnerName: string) => void;
};

type ProfileRow = {
  id: string;
  nickname: string | null;
  prefecture: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
};

export function MatchesScreen({ onOpenChat }: Props) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    loadMatches(true);

    const timer = setInterval(() => {
      loadMatches(false);
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const loadMatches = async (showLoading: boolean) => {
    if (showLoading) {
      setIsInitialLoading(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    const { data: likeRows, error: likeError } = await supabase
      .from('likes')
      .select('id, from_user, to_user, matched_at, is_match')
      .eq('is_match', true)
      .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
      .order('matched_at', { ascending: false });

    if (likeError) {
      alert(likeError.message);
      setIsInitialLoading(false);
      return;
    }

    const partnerIds = (likeRows || []).map((like) =>
      like.from_user === user.id ? like.to_user : like.from_user
    );

    if (partnerIds.length === 0) {
      setMatches([]);
      setIsInitialLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, prefecture, photo_url, photo_urls')
      .in('id', partnerIds);

    if (profileError) {
      alert(profileError.message);
      setIsInitialLoading(false);
      return;
    }

    const { data: unreadMessages, error: unreadError } = await supabase
      .from('messages')
      .select('id, sender_id')
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (unreadError) {
      alert(unreadError.message);
      setIsInitialLoading(false);
      return;
    }

    const profileMap = new Map<string, ProfileRow>();
    const unreadMap = new Map<string, number>();

    (profiles || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    (unreadMessages || []).forEach((message) => {
      const current = unreadMap.get(message.sender_id) || 0;
      unreadMap.set(message.sender_id, current + 1);
    });

    const displayMatches: MatchRow[] = (likeRows || []).map((like) => {
      const partnerId =
        like.from_user === user.id ? like.to_user : like.from_user;

      const partner = profileMap.get(partnerId);

      const partnerPhotoUrls =
        partner?.photo_urls && partner.photo_urls.length > 0
          ? partner.photo_urls
          : partner?.photo_url
            ? [partner.photo_url]
            : [];

      return {
        ...like,
        partnerId,
        partnerName: partner?.nickname || '未設定',
        partnerPrefecture: partner?.prefecture || '未設定',
        partnerPhotoUrl: partnerPhotoUrls[0] || null,
        unreadCount: unreadMap.get(partnerId) || 0,
      };
    });

    setMatches(displayMatches);
    setIsInitialLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>マッチ</Text>
      <Text style={styles.subtitle}>マッチした相手と会話できます</Text>

      {isInitialLoading && <Text style={styles.infoText}>読み込み中...</Text>}

      {!isInitialLoading && matches.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>まだマッチしていません</Text>
          <Text style={styles.emptyText}>
            
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {matches.map((match) => (
          <TouchableOpacity
            key={match.id}
            style={styles.matchCard}
            onPress={() => onOpenChat(match.partnerId, match.partnerName)}
          >
            <View style={styles.matchHeader}>
              <View style={styles.userInfoRow}>
                {match.partnerPhotoUrl ? (
                  <Image
                    source={{ uri: match.partnerPhotoUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {match.partnerName.substring(0, 1)}
                    </Text>
                  </View>
                )}

                <View style={styles.userTextArea}>
                  <Text style={styles.matchTitle}>{match.partnerName}</Text>
                  <Text style={styles.matchText}>
                    {match.partnerPrefecture}
                  </Text>
                </View>
              </View>

              {match.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{match.unreadCount}</Text>
                </View>
              )}
            </View>

            <Text style={styles.matchDate}>
              {match.matched_at
                ? new Date(match.matched_at).toLocaleString()
                : ''}
            </Text>

            <Text style={styles.chatHint}>タップしてチャットを開始</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  red: '#e53935',
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
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  userTextArea: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  matchText: {
    fontSize: 14,
    color: colors.subText,
  },
  matchDate: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 12,
  },
  chatHint: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 10,
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});