import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Props = {
  onLogout: () => void;
  onEdit: () => void;
  onOpenLegal: (type: 'terms' | 'privacy' | 'contact') => void;
  onOpenInquiry: () => void;
};

type MyProfile = {
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

export function MyPageScreen({ onLogout, onEdit, onOpenLegal, onOpenInquiry }: Props) {
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setMyProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    const firstConfirm = confirm(
      'アカウントを削除しますか？プロフィール、いいね、マッチ、メッセージ等のデータが削除されます。'
    );

    if (!firstConfirm) return;

    const secondConfirm = confirm(
      'この操作は取り消せません。本当に削除しますか？'
    );

    if (!secondConfirm) return;

    setIsDeleting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログイン情報を取得できませんでした。');
      setIsDeleting(false);
      return;
    }

    try {
      await supabase.rpc('delete_current_user');
    } catch {
      await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        email: user.email,
        status: 'requested',
      });
    }

    await supabase.auth.signOut();
    setIsDeleting(false);
    onLogout();
  };


  const calculateAge = () => {
    if (!myProfile?.birth_year || !myProfile.birth_month || !myProfile.birth_day) {
      return '';
    }

    const today = new Date();
    const birthday = new Date(
      myProfile.birth_year,
      myProfile.birth_month - 1,
      myProfile.birth_day
    );

    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age -= 1;
    }

    return String(age);
  };

  const photoUrl =
    myProfile?.photo_urls && myProfile.photo_urls.length > 0
      ? myProfile.photo_urls[0]
      : myProfile?.photo_url || null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>マイページ</Text>
        <Text style={styles.subtitle}>あなたのプロフィール</Text>

        <View style={styles.profileCard}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>👤</Text>
            </View>
          )}

          <Text style={styles.name}>{myProfile?.nickname || '未設定'}</Text>

          <Text style={styles.basicInfo}>
            {myProfile
              ? `${myProfile.gender || '性別未設定'} / ${calculateAge()}歳 / ${myProfile.prefecture || '居住地未設定'}`
              : 'プロフィール未登録'}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自己紹介</Text>
            <Text style={styles.bodyText}>
              {myProfile?.profile || 'まだ自己紹介が入力されていません。'}
            </Text>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>プロフィールを編集</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onOpenLegal('terms')}
          >
            <Text style={styles.menuText}>利用規約</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onOpenLegal('privacy')}
          >
            <Text style={styles.menuText}>プライバシーポリシー</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onOpenInquiry}
          >
            <Text style={styles.menuText}>お問い合わせ</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>ログアウト</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? '削除処理中...' : 'アカウントを削除'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.deleteNote}>
          削除後も、法令遵守・不正利用防止・問い合わせ対応のために必要な情報を一定期間保存する場合があります。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  accent: '#f4d4dc',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  danger: '#b3261e',
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
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  photo: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignSelf: 'center',
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: colors.accent,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontSize: 44,
  },
  name: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  basicInfo: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.subText,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: colors.card,
  },
  logoutButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: colors.card,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '900',
  },
  deleteNote: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 36,
    paddingHorizontal: 6,
  },
});