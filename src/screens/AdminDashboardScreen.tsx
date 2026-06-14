import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type DashboardCounts = {
  profiles: number;
  likes: number;
  matches: number;
  messages: number;
  reports: number;
  inquiries: number;
};

type CountCardProps = {
  label: string;
  value: number;
  description: string;
};

type ProfileRow = {
  id: string;
  admin_memo: string | null;
};

type LikeRow = {
  id: number;
  from_user: string | null;
  to_user: string | null;
  is_match: boolean | null;
};

type MessageRow = {
  id: number | string;
  sender_id: string | null;
  receiver_id: string | null;
};

type ReportRow = {
  id: number | string;
  reporter_id: string | null;
  target_user_id: string | null;
};

type InquiryRow = {
  id: number | string;
  user_id: string | null;
};

const EXCLUDED_ADMIN_MEMOS = ['sample_user', 'Admin_User'];

export function AdminDashboardScreen() {
  const [counts, setCounts] = useState<DashboardCounts>({
    profiles: 0,
    likes: 0,
    matches: 0,
    messages: 0,
    reports: 0,
    inquiries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedText, setLastUpdatedText] = useState('');

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 30000);

    return () => clearInterval(interval);
  }, []);

  const isExcludedMemo = (adminMemo: string | null | undefined) => {
    return EXCLUDED_ADMIN_MEMOS.includes(adminMemo || '');
  };

  const isRealUserId = (
    userId: string | null | undefined,
    realUserIds: Set<string>
  ) => {
    return Boolean(userId && realUserIds.has(userId));
  };

  const loadDashboard = async () => {
    setIsLoading(true);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, admin_memo');

    if (profileError) {
      alert(profileError.message);
      setIsLoading(false);
      return;
    }

    const realProfiles = ((profiles || []) as ProfileRow[]).filter(
      (profile) => !isExcludedMemo(profile.admin_memo)
    );

    const realUserIds = new Set(realProfiles.map((profile) => profile.id));

    const [likeResult, messageResult, reportResult, inquiryResult] =
      await Promise.all([
        supabase.from('likes').select('id, from_user, to_user, is_match'),
        supabase.from('messages').select('id, sender_id, receiver_id'),
        supabase.from('reports').select('id, reporter_id, target_user_id'),
        supabase.from('inquiries').select('id, user_id'),
      ]);

    if (likeResult.error) {
      alert(likeResult.error.message);
      setIsLoading(false);
      return;
    }

    if (messageResult.error) {
      alert(messageResult.error.message);
      setIsLoading(false);
      return;
    }

    if (reportResult.error) {
      alert(reportResult.error.message);
      setIsLoading(false);
      return;
    }

    if (inquiryResult.error) {
      alert(inquiryResult.error.message);
      setIsLoading(false);
      return;
    }

    const realLikes = ((likeResult.data || []) as LikeRow[]).filter(
      (like) =>
        isRealUserId(like.from_user, realUserIds) &&
        isRealUserId(like.to_user, realUserIds)
    );

    const realMatches = realLikes.filter((like) => like.is_match === true);

    const realMessages = ((messageResult.data || []) as MessageRow[]).filter(
      (message) =>
        isRealUserId(message.sender_id, realUserIds) &&
        isRealUserId(message.receiver_id, realUserIds)
    );

    const realReports = ((reportResult.data || []) as ReportRow[]).filter(
      (report) => {
        const reporterIsReal =
          !report.reporter_id || isRealUserId(report.reporter_id, realUserIds);

        const targetUserIsReal =
          !report.target_user_id ||
          isRealUserId(report.target_user_id, realUserIds);

        return reporterIsReal && targetUserIsReal;
      }
    );

    const realInquiries = ((inquiryResult.data || []) as InquiryRow[]).filter(
      (inquiry) => {
        return !inquiry.user_id || isRealUserId(inquiry.user_id, realUserIds);
      }
    );

    setCounts({
      profiles: realProfiles.length,
      likes: realLikes.length,
      matches: realMatches.length,
      messages: realMessages.length,
      reports: realReports.length,
      inquiries: realInquiries.length,
    });

    setLastUpdatedText(
      new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ダッシュボード</Text>
            <Text style={styles.subtitle}>
              サンプルユーザーを除いた利用状況です
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={loadDashboard}>
            <Text style={styles.refreshButtonText}>更新</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            {isLoading ? '読み込み中...' : '最新状況'}
          </Text>

          <Text style={styles.statusText}>
            {lastUpdatedText
              ? `最終更新：${lastUpdatedText}`
              : 'データを取得しています'}
          </Text>

          <Text style={styles.excludeText}>
            除外条件：profiles.admin_memo が sample_user / Admin_User のユーザー
          </Text>
        </View>

        <View style={styles.cardGrid}>
          <CountCard
            label="登録者数"
            value={counts.profiles}
            description="サンプル・管理者を除くプロフィール作成済みユーザー"
          />

          <CountCard
            label="いいね数"
            value={counts.likes}
            description="実ユーザー同士で送信されたいいねの総数"
          />

          <CountCard
            label="マッチ数"
            value={counts.matches}
            description="実ユーザー同士で成立したマッチの総数"
          />

          <CountCard
            label="メッセージ数"
            value={counts.messages}
            description="実ユーザー同士で送信されたメッセージの総数"
          />

          <CountCard
            label="通報数"
            value={counts.reports}
            description="サンプル・管理者を除いた通報件数"
          />

          <CountCard
            label="お問い合わせ数"
            value={counts.inquiries}
            description="サンプル・管理者を除いた問い合わせ件数"
          />
        </View>

        <View style={styles.memoCard}>
          <Text style={styles.memoTitle}>見るべきポイント</Text>
          <Text style={styles.memoText}>
            まずは「登録者数 → いいね数 → マッチ数 → メッセージ数」の順に落ち込みを確認してください。
            ここでは admin_memo が sample_user / Admin_User のユーザーと、そのユーザーが関係するデータを除外しています。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CountCard({ label, value, description }: CountCardProps) {
  return (
    <View style={styles.countCard}>
      <Text style={styles.countLabel}>{label}</Text>
      <Text style={styles.countValue}>{value.toLocaleString()}</Text>
      <Text style={styles.countDescription}>{description}</Text>
    </View>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  accent: '#f4d4dc',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 6,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  statusText: {
    fontSize: 13,
    color: colors.subText,
    marginTop: 6,
  },
  excludeText: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 8,
    lineHeight: 18,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countCard: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 150,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  countLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
  },
  countValue: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 10,
  },
  countDescription: {
    fontSize: 12,
    color: colors.subText,
    lineHeight: 18,
    marginTop: 8,
  },
  memoCard: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
  },
  memoTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  memoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 21,
  },
});
