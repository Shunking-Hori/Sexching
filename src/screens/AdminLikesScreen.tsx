import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../lib/supabase';

type PendingLike = {
  id: number;
  from_user: string;
  to_user: string;
  created_at: string;
  status: string;
};

type ReportRow = {
  id: number;
  reporter_id: string;
  target_user_id: string;
  reason: string;
  status: string | null;
  created_at: string;
};

type AdminTab = 'likes' | 'reports';

export function AdminLikesScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('likes');
  const [likes, setLikes] = useState<PendingLike[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    await Promise.all([loadPendingLikes(), loadReports()]);
    setIsLoading(false);
  };

  const loadPendingLikes = async () => {
    const { data, error } = await supabase
      .from('likes')
      .select('id, from_user, to_user, created_at, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setLikes(data || []);
  };

  const loadReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('id, reporter_id, target_user_id, reason, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setReports(data || []);
  };

  const approveLike = async (like: PendingLike) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    const { error } = await supabase
      .from('likes')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', like.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert('いいねを承認しました。');
    loadPendingLikes();
  };

  const rejectLike = async (likeId: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    const { error } = await supabase
      .from('likes')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
      })
      .eq('id', likeId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('いいねを却下しました。');
    loadPendingLikes();
  };

  const banUser = async (targetUserId: string, reportId?: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    const { error: banError } = await supabase
      .from('profiles')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_by: user.id,
        admin_memo: '通報により管理者が利用停止',
      })
      .eq('id', targetUserId);

    if (banError) {
      alert(banError.message);
      return;
    }

    if (reportId) {
      await supabase
        .from('reports')
        .update({
          status: 'handled',
          handled_at: new Date().toISOString(),
          handled_by: user.id,
        })
        .eq('id', reportId);
    }

    alert('ユーザーを利用停止にしました。');
    loadReports();
  };

  const markReportHandled = async (reportId: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'handled',
        handled_at: new Date().toISOString(),
        handled_by: user.id,
      })
      .eq('id', reportId);

    if (error) {
      alert(error.message);
      return;
    }

    alert('通報を対応済みにしました。');
    loadReports();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>管理</Text>
      <Text style={styles.subtitle}>運営管理メニュー</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'likes' && styles.tabButtonActive]}
          onPress={() => setActiveTab('likes')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'likes' && styles.tabButtonTextActive,
            ]}
          >
            いいね承認
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'reports' && styles.tabButtonActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'reports' && styles.tabButtonTextActive,
            ]}
          >
            通報一覧
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && <Text style={styles.infoText}>読み込み中...</Text>}

      {!isLoading && activeTab === 'likes' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {likes.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>承認待ちはありません</Text>
              <Text style={styles.emptyText}>
                ユーザーがいいねすると、ここに表示されます。
              </Text>
            </View>
          )}

          {likes.map((like) => (
            <View key={like.id} style={styles.card}>
              <Text style={styles.cardTitle}>いいね承認依頼</Text>

              <Text style={styles.label}>送信者</Text>
              <Text style={styles.value}>{like.from_user}</Text>

              <Text style={styles.label}>受信者</Text>
              <Text style={styles.value}>{like.to_user}</Text>

              <Text style={styles.label}>送信日時</Text>
              <Text style={styles.value}>
                {new Date(like.created_at).toLocaleString()}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => approveLike(like)}
                >
                  <Text style={styles.buttonText}>承認</Text>
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
      )}

      {!isLoading && activeTab === 'reports' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {reports.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>通報はありません</Text>
              <Text style={styles.emptyText}>
                ユーザーから通報があると、ここに表示されます。
              </Text>
            </View>
          )}

          {reports.map((report) => {
            const isHandled = report.status === 'handled';

            return (
              <View
                key={report.id}
                style={[styles.card, isHandled && styles.handledCard]}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.cardTitle}>通報</Text>

                  <View
                    style={[
                      styles.statusBadge,
                      isHandled
                        ? styles.statusBadgeHandled
                        : styles.statusBadgeOpen,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {isHandled ? '対応済み' : '未対応'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>通報者</Text>
                <Text style={styles.value}>{report.reporter_id}</Text>

                <Text style={styles.label}>対象ユーザー</Text>
                <Text style={styles.value}>{report.target_user_id}</Text>

                <Text style={styles.label}>理由</Text>
                <Text style={styles.reasonText}>{report.reason}</Text>

                <Text style={styles.label}>通報日時</Text>
                <Text style={styles.value}>
                  {new Date(report.created_at).toLocaleString()}
                </Text>

                {!isHandled && (
                  <>
                    <TouchableOpacity
                      style={styles.banButton}
                      onPress={() => banUser(report.target_user_id, report.id)}
                    >
                      <Text style={styles.buttonText}>
                        このユーザーを利用停止
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.handledButton}
                      onPress={() => markReportHandled(report.id)}
                    >
                      <Text style={styles.handledButtonText}>
                        BANせず対応済みにする
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  reject: '#8a8a8a',
  danger: '#c0392b',
  handled: '#e7e3e5',
  open: '#e53935',
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
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    color: colors.text,
    fontWeight: '800',
  },
  tabButtonTextActive: {
    color: '#fff',
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
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  handledCard: {
    opacity: 0.72,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
  },
  statusBadgeOpen: {
    backgroundColor: colors.open,
  },
  statusBadgeHandled: {
    backgroundColor: colors.reject,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 8,
  },
  value: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 15,
    color: colors.text,
    marginTop: 4,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  approveButton: {
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
  banButton: {
    marginTop: 18,
    backgroundColor: colors.danger,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  handledButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  handledButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});