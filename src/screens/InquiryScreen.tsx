import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Props = {
  onBack: () => void;
};

const categories = ['不具合', '通報・安全', 'アカウント', '要望', 'その他'];

export function InquiryScreen({ onBack }: Props) {
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const canSubmit = message.trim().length >= 10 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSentMessage('');
    setIsSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsSubmitting(false);
      alert('ログイン情報を取得できませんでした。');
      return;
    }

    const { error } = await supabase.from('inquiries').insert({
      user_id: user.id,
      email: user.email,
      category,
      message: message.trim(),
      status: 'open',
    });

    setIsSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMessage('');
    setSentMessage('お問い合わせを受け付けました。内容を確認のうえ、必要に応じて対応します。');
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.phoneFrame}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>お問い合わせ</Text>
          <Text style={styles.caption}>不具合、アカウント、安全上の問題などをアプリ内から送信できます。</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {sentMessage.length > 0 && <Text style={styles.successText}>{sentMessage}</Text>}

            <Text style={styles.label}>カテゴリ</Text>
            <View style={styles.categoryGrid}>
              {categories.map((item) => {
                const active = category === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.categoryButton, active && styles.categoryButtonActive]}
                    onPress={() => setCategory(item)}
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>お問い合わせ内容</Text>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder="発生した内容、相手ユーザー、日時、操作手順などをできるだけ具体的に入力してください。"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.note}>10文字以上入力してください。緊急性の高い危険がある場合は、警察等の公的機関への相談も検討してください。</Text>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? '送信中...' : '送信する'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  card: '#ffffff',
  primary: '#8f2d56',
  disabled: '#c9c1c4',
  text: '#2b2226',
  subText: '#75666c',
  border: '#ead9de',
  successBg: '#f4edf0',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
    marginBottom: 8,
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  caption: {
    marginTop: 8,
    fontSize: 13,
    color: colors.subText,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 18,
  },
  successText: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  categoryTextActive: {
    color: '#fff',
  },
  textArea: {
    minHeight: 180,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  note: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
