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
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

type LegalType = 'terms' | 'privacy' | 'contact';

type Props = {
  onComplete: () => void;
  onOpenLegal: (type: LegalType) => void;
};

type AuthMode = 'login' | 'signup';

export function AuthScreen({ onComplete, onOpenLegal }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isOver18, setIsOver18] = useState(false);
  const [agreedLegal, setAgreedLegal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';
  const isEmailValid = email.trim().includes('@');
  const isPasswordValid = password.length >= 6;
  const isPasswordMatched = !isSignup || password === passwordConfirm;

  const canSubmit =
    isEmailValid &&
    isPasswordValid &&
    isPasswordMatched &&
    (!isSignup || (isOver18 && agreedLegal)) &&
    !isSubmitting;

  const resetExtraInputs = () => {
    setPasswordConfirm('');
    setIsOver18(false);
    setAgreedLegal(false);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetExtraInputs();
  };

  const handleLogin = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    onComplete();
  };

  const handleSignup = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          is_over_18_confirmed: true,
          legal_agreed: true,
          legal_agreed_at: new Date().toISOString(),
        },
      },
    });
    setIsSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert('登録が完了しました。続いてプロフィールを作成してください。');
    onComplete();
  };

  const handleSubmit = () => {
    if (isSignup) {
      handleSignup();
      return;
    }

    handleLogin();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>Xching</Text>
          <Text style={styles.title}>{isSignup ? '新規登録' : 'ログイン'}</Text>
          <Text style={styles.subtitle}>
            {isSignup
              ? 'メールアドレスで登録し、プロフィール作成へ進みます。'
              : '登録済みのメールアドレスでログインしてください。'}
          </Text>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeButton, !isSignup && styles.modeButtonActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.modeText, !isSignup && styles.modeTextActive]}>ログイン</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, isSignup && styles.modeButtonActive]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.modeText, isSignup && styles.modeTextActive]}>新規登録</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>パスワード</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="6文字以上"
            secureTextEntry
          />

          {isSignup && (
            <>
              <Text style={styles.label}>パスワード確認</Text>
              <TextInput
                style={styles.input}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder="もう一度入力"
                secureTextEntry
              />
              {passwordConfirm.length > 0 && !isPasswordMatched && (
                <Text style={styles.errorText}>パスワードが一致していません</Text>
              )}

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setIsOver18((current) => !current)}
              >
                <View style={[styles.checkbox, isOver18 && styles.checkboxActive]}>
                  {isOver18 && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkText}>私は18歳以上です。</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setAgreedLegal((current) => !current)}
              >
                <View style={[styles.checkbox, agreedLegal && styles.checkboxActive]}>
                  {agreedLegal && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkText}>利用規約・プライバシーポリシーに同意します。</Text>
              </TouchableOpacity>

              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => onOpenLegal('terms')}>
                  <Text style={styles.legalLinkText}>利用規約を確認</Text>
                </TouchableOpacity>
                <Text style={styles.legalSeparator}>/</Text>
                <TouchableOpacity onPress={() => onOpenLegal('privacy')}>
                  <Text style={styles.legalLinkText}>プライバシーポリシーを確認</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting
                ? '処理中...'
                : isSignup
                  ? '登録してプロフィール作成へ'
                  : 'ログインする'}
            </Text>
          </TouchableOpacity>

          {isSignup && (
            <Text style={styles.note}>
              登録後、プロフィール登録画面で生年月日を入力します。18歳未満の方は本サービスを利用できません。
            </Text>
          )}
        </View>
      </ScrollView>
      <StatusBar style="dark" />
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
  error: '#b3261e',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 22,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.subText,
  },
  modeTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  legalLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: colors.subText,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 28,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  note: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 18,
  },
});
