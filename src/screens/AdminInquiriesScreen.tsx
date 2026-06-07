import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type InquiryRow = {
  id: number;
  user_id: string;
  email: string | null;
  category: string;
  message: string;
  status: string | null;
  created_at: string;
  handled_at: string | null;
};

export function AdminInquiriesScreen() {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<'open' | 'closed' | 'all'>('open');

  useEffect(() => {
    loadInquiries();
  }, [activeStatus]);

  const loadInquiries = async () => {
    setIsLoading(true);

    let query = supabase
      .from('inquiries')
      .select('id, user_id, email, category, message, status, created_at, handled_at')
      .order('created_at', { ascending: false });

    if (activeStatus !== 'all') {
      query = query.eq('status', activeStatus);
    }

    const { data, error } = await query;
    setIsLoading(false);

    if (error) {
      Alert.alert('エラー', error.message);
      return;
    }

    setInquiries(data || []);
  };

  const closeInquiry = async (id: number) => {
    Alert.alert(
      '確認',
      'このお問い合わせを対応済みにしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '対応済みにする',
          onPress: async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            const { error } = await supabase
              .from('inquiries')
              .update({
                status: 'closed',
                handled_at: new Date().toISOString(),
                handled_by: user?.id || null,
              })
              .eq('id', id);

            if (error) {
              Alert.alert('エラー', error.message);
              return;
            }

            loadInquiries();
          },
        },
      ]
    );
  };

  const reopenInquiry = async (id: number) => {
    const { error } = await supabase
      .from('inquiries')
      .update({
        status: 'open',
        handled_at: null,
        handled_by: null,
      })
      .eq('id', id);

    if (error) {
      Alert.alert('エラー', error.message);
      return;
    }

    loadInquiries();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>お問い合わせ管理</Text>
        <Text style={styles.subtitle}>アプリ内から送信された問い合わせを確認します。</Text>

        <View style={styles.statusTabs}>
          <StatusButton label="未対応" active={activeStatus === 'open'} onPress={() => setActiveStatus('open')} />
          <StatusButton label="対応済み" active={activeStatus === 'closed'} onPress={() => setActiveStatus('closed')} />
          <StatusButton label="すべて" active={activeStatus === 'all'} onPress={() => setActiveStatus('all')} />
        </View>

        <TouchableOpacity style={styles.reloadButton} onPress={loadInquiries}>
          <Text style={styles.reloadButtonText}>再読み込み</Text>
        </TouchableOpacity>

        {isLoading ? (
          <Text style={styles.emptyText}>読み込み中...</Text>
        ) : inquiries.length === 0 ? (
          <Text style={styles.emptyText}>該当するお問い合わせはありません。</Text>
        ) : (
          inquiries.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={[styles.status, item.status === 'closed' && styles.statusClosed]}>
                  {item.status === 'closed' ? '対応済み' : '未対応'}
                </Text>
              </View>

              <Text style={styles.meta}>日時：{new Date(item.created_at).toLocaleString()}</Text>
              <Text style={styles.meta}>ユーザー：{item.email || item.user_id}</Text>
              <Text style={styles.message}>{item.message}</Text>

              {item.status === 'closed' ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => reopenInquiry(item.id)}>
                  <Text style={styles.secondaryButtonText}>未対応に戻す</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={() => closeInquiry(item.id)}>
                  <Text style={styles.primaryButtonText}>対応済みにする</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type StatusButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function StatusButton({ label, active, onPress }: StatusButtonProps) {
  return (
    <TouchableOpacity style={[styles.statusButton, active && styles.statusButtonActive]} onPress={onPress}>
      <Text style={[styles.statusButtonText, active && styles.statusButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  success: '#2f7d32',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: colors.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  statusTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 11,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 13,
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  reloadButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reloadButtonText: {
    color: colors.primary,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.subText,
    textAlign: 'center',
    marginTop: 28,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  category: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  status: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  statusClosed: {
    color: colors.success,
  },
  meta: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  message: {
    marginTop: 12,
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
});