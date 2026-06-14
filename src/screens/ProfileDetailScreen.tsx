import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import type { User } from '../../App';
import { supabase } from '../lib/supabase';

type Props = {
  user: User;
  onBack: () => void;
};

const DAILY_LIKE_LIMIT = 10;

const reportReasons = [
  '不適切なプロフィール',
  '迷惑行為',
  'なりすまし',
  '業者・勧誘',
  'その他',
];

export function ProfileDetailScreen({ user, onBack }: Props) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const photoUrls =
    user.photoUrls && user.photoUrls.length > 0
      ? user.photoUrls
      : user.photoUrl
        ? [user.photoUrl]
        : [];

  const checkIsAdmin = async (userId: string) => {
    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    return Boolean(data);
  };

  const sendLike = async () => {
    if (isLiked || isSending) return;

    setIsSending(true);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      Alert.alert('エラー', 'ログイン情報を取得できませんでした。');
      setIsSending(false);
      return;
    }

    const isAdmin = await checkIsAdmin(currentUser.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('likes')
      .select('id', { count: 'exact', head: true })
      .eq('from_user', currentUser.id)
      .gte('created_at', today.toISOString());

    if (countError) {
      Alert.alert('エラー', countError.message);
      setIsSending(false);
      return;
    }

    if (!isAdmin && (count || 0) >= DAILY_LIKE_LIMIT) {
      Alert.alert('上限に達しました', 'いいねは1日10回までです。');
      setIsSending(false);
      return;
    }

    const { data: block } = await supabase
      .from('blocks')
      .select('id')
      .or(
        `and(from_user.eq.${currentUser.id},to_user.eq.${user.id}),and(from_user.eq.${user.id},to_user.eq.${currentUser.id})`
      )
      .maybeSingle();

    if (block) {
      Alert.alert('エラー', 'このユーザーにはいいねできません。');
      setIsSending(false);
      return;
    }

    const { error } = await supabase.from('likes').insert({
      from_user: currentUser.id,
      to_user: user.id,
      status: 'pending',
    });

    setIsSending(false);

    if (error) {
      Alert.alert('エラー', error.message);
      return;
    }

    setIsLiked(true);
  };

  const blockUser = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      Alert.alert('エラー', 'ログイン情報を取得できませんでした。');
      return;
    }

    Alert.alert('ブロック', 'このユーザーをブロックしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ブロック',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('blocks').insert({
            from_user: currentUser.id,
            to_user: user.id,
          });

          if (error) {
            Alert.alert('エラー', error.message);
            return;
          }

          onBack();
        },
      },
    ]);
  };

  const reportUserWithReason = async (reason: string) => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      Alert.alert('エラー', 'ログイン情報を取得できませんでした。');
      return;
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      target_user_id: user.id,
      reason,
      status: 'open',
    });

    if (error) {
      Alert.alert('エラー', error.message);
      return;
    }

    Alert.alert('通報しました', '内容を確認します。');
  };

  const reportUser = () => {
    Alert.alert('通報理由を選択', '該当する理由を選んでください。', [
      ...reportReasons.map((reason) => ({
        text: reason,
        onPress: () => reportUserWithReason(reason),
      })),
      { text: 'キャンセル', style: 'cancel' as const },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>

          {photoUrls.length > 0 ? (
            <>
              <Image
                source={{ uri: photoUrls[selectedPhotoIndex] }}
                style={styles.photoAreaImage}
              />

              {photoUrls.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailRow}
                >
                  {photoUrls.map((url, index) => (
                    <TouchableOpacity key={url} onPress={() => setSelectedPhotoIndex(index)}>
                      <Image
                        source={{ uri: url }}
                        style={[
                          styles.thumbnailImage,
                          selectedPhotoIndex === index && styles.thumbnailImageActive,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.photoArea}>
              <Text style={styles.photoIcon}>👤</Text>
            </View>
          )}

          <Text style={styles.name}>
            {user.name} / {user.age ? `${user.age}` : '年齢未設定'}
          </Text>

          <Text style={styles.prefecture}>
            {user.gender} / {user.prefecture}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自己紹介</Text>
            <Text style={styles.bodyText}>{user.profile || '自己紹介はまだありません。'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>趣味</Text>
            <View style={styles.tagRow}>
              {user.hobbies.length > 0 ? (
                user.hobbies.map((hobby) => (
                  <View key={hobby} style={styles.tag}>
                    <Text style={styles.tagText}>{hobby}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.bodyText}>未設定</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>休日の過ごし方</Text>
            <Text style={styles.bodyText}>{user.holiday || '未設定'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>仕事</Text>
            <Text style={styles.bodyText}>{user.job || '未設定'}</Text>
          </View>

          {user.gender === '女性' && user.bustSize && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>バストサイズ</Text>
              <Text style={styles.bodyText}>{user.bustSize}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.likeButton, isLiked && styles.likeButtonLiked]}
            onPress={sendLike}
            disabled={isLiked || isSending}
          >
            <Text style={styles.likeButtonText}>
              {isLiked ? '承認待ち' : isSending ? '送信中...' : '♡ いいねする'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.blockButton} onPress={blockUser}>
            <Text style={styles.blockButtonText}>🚫 ブロック</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportButton} onPress={reportUser}>
            <Text style={styles.reportButtonText}>⚠️ 通報</Text>
          </TouchableOpacity>
        </View>
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
  danger: '#c0392b',
  block: '#444444',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 56,
  },
  detailCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  photoArea: {
    width: '100%',
    height: 360,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  photoAreaImage: {
    width: '100%',
    height: 360,
    borderRadius: 28,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  thumbnailRow: {
    marginBottom: 18,
  },
  thumbnailImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 10,
    opacity: 0.55,
  },
  thumbnailImageActive: {
    opacity: 1,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoIcon: {
    fontSize: 96,
  },
  name: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  prefecture: {
    fontSize: 15,
    color: colors.subText,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  tagText: {
    color: colors.primary,
    fontWeight: '700',
  },
  likeButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  likeButtonLiked: {
    backgroundColor: colors.likedGray,
  },
  likeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  blockButton: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: colors.block,
    alignItems: 'center',
    width: '100%',
  },
  blockButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  reportButton: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    width: '100%',
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});