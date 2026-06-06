import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

type LegalType = 'terms' | 'privacy' | 'contact';

type Props = {
  type: LegalType;
  onBack: () => void;
};

export function LegalScreen({ type, onBack }: Props) {
  const title =
    type === 'terms'
      ? '利用規約'
      : type === 'privacy'
        ? 'プライバシーポリシー'
        : 'お問い合わせ';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        {type === 'terms' && (
          <>
            <Text style={styles.body}>
              Xching利用規約は、Xchingの利用条件を定めるものです。
              利用者は本規約に同意したうえで本サービスを利用するものとします。
            </Text>

            <Text style={styles.sectionTitle}>第1条 利用資格</Text>
            <Text style={styles.body}>
              本サービスは18歳以上の方のみ利用できます。18歳未満の方は利用できません。
            </Text>

            <Text style={styles.sectionTitle}>第2条 禁止事項</Text>
            <Text style={styles.body}>
              虚偽情報の登録、なりすまし、迷惑行為、勧誘、誹謗中傷、法令違反、公序良俗に反する行為は禁止します。
            </Text>

            <Text style={styles.sectionTitle}>第3条 利用停止</Text>
            <Text style={styles.body}>
              運営者は、規約違反や不正利用が確認された場合、事前通知なくアカウントの停止または削除を行うことができます。
            </Text>

            <Text style={styles.sectionTitle}>第4条 免責</Text>
            <Text style={styles.body}>
              利用者同士の交流、連絡、面会等は利用者自身の責任で行うものとし、運営者は利用者間のトラブルについて責任を負いません。
            </Text>
          </>
        )}

        {type === 'privacy' && (
          <>
            <Text style={styles.body}>
              Xchingは、利用者の個人情報を適切に管理し、サービス提供および安全な運営のために利用します。
            </Text>

            <Text style={styles.sectionTitle}>取得する情報</Text>
            <Text style={styles.body}>
              メールアドレス、ニックネーム、生年月日、性別、居住地、プロフィール情報、画像、利用履歴等を取得します。
            </Text>

            <Text style={styles.sectionTitle}>利用目的</Text>
            <Text style={styles.body}>
              サービス提供、本人確認、不正利用防止、通報対応、サービス改善、お問い合わせ対応のために利用します。
            </Text>

            <Text style={styles.sectionTitle}>第三者提供</Text>
            <Text style={styles.body}>
              法令に基づく場合を除き、利用者の同意なく第三者に個人情報を提供しません。
            </Text>
          </>
        )}

        {type === 'contact' && (
          <>
            <Text style={styles.body}>
              お問い合わせは以下のメールアドレスまでご連絡ください。
            </Text>

            <Text style={styles.contactMail}>support@xching.jp</Text>

            <Text style={styles.body}>
              返信には数日かかる場合があります。通報・ブロック機能もあわせてご利用ください。
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#fff7f5',
  primary: '#8f2d56',
  text: '#2b2226',
  subText: '#75666c',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 22,
    paddingBottom: 60,
  },
  backText: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 22,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 25,
  },
  contactMail: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '800',
    marginVertical: 18,
  },
});