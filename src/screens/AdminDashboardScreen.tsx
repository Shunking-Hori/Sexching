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

  const countRows = async (tableName: string, filter?: (query: any) => any) => {
    let query = supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (filter) {
      query = filter(query);
    }

    const { count, error } = await query;

    if (error) {
      console.log(`${tableName} count error`, error.message);
      return 0;
    }

    return count || 0;
  };

  const loadDashboard = async () => {
    setIsLoading(true);

    const [
      profileCount,
      likeCount,
      matchCount,
      messageCount,
      reportCount,
      inquiryCount,
    ] = await Promise.all([
      countRows('profiles'),
      countRows('likes'),
      countRows('likes', (query) => query.eq('is_match', true)),
      countRows('messages'),
      countRows('reports'),
      countRows('inquiries'),
    ]);

    setCounts({
      profiles: profileCount,
      likes: likeCount,
      matches: matchCount,
      messages: messageCount,
      reports: reportCount,
      inquiries: inquiryCount,
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
            <Text style={styles.subtitle}>アプリの利用状況を確認できます</Text>
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
        </View>

        <View style={styles.cardGrid}>
          <CountCard
            label="登録者数"
            value={counts.profiles}
            description="プロフィール作成済みユーザー"
          />

          <CountCard
            label="いいね数"
            value={counts.likes}
            description="送信されたいいねの総数"
          />

          <CountCard
            label="マッチ数"
            value={counts.matches}
            description="成立したマッチの総数"
          />

          <CountCard
            label="メッセージ数"
            value={counts.messages}
            description="送信されたメッセージの総数"
          />

          <CountCard
            label="通報数"
            value={counts.reports}
            description="ユーザーからの通報件数"
          />

          <CountCard
            label="お問い合わせ数"
            value={counts.inquiries}
            description="問い合わせフォームの件数"
          />
        </View>

        <View style={styles.memoCard}>
          <Text style={styles.memoTitle}>見るべきポイント</Text>
          <Text style={styles.memoText}>
            まずは「登録者数 → いいね数 → マッチ数 → メッセージ数」の順に落ち込みを確認してください。
            どこで数字が落ちているかを見ると、次に改善すべき場所が分かります。
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
