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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        {type === 'terms' && (
          <>
            <Text style={styles.lead}>
              この利用規約（以下「本規約」といいます。）は、Xching（以下「本サービス」といいます。）の利用条件を定めるものです。利用者は、本規約に同意したうえで本サービスを利用するものとします。
            </Text>

            <Text style={styles.sectionTitle}>第1条 適用</Text>
            <Text style={styles.body}>
              本規約は、本サービスの利用に関する運営者と利用者との間の一切の関係に適用されます。運営者が本サービス上で掲載するルール、注意事項、ガイドライン等は本規約の一部を構成します。
            </Text>

            <Text style={styles.sectionTitle}>第2条 利用資格</Text>
            <Text style={styles.body}>
              本サービスは18歳以上の方のみ利用できます。18歳未満の方、過去に本サービスの利用停止または退会処分を受けた方、反社会的勢力に該当または関与する方、その他運営者が不適切と判断した方は利用できません。利用者は、登録情報が真実、正確かつ最新であることを保証するものとします。
            </Text>

            <Text style={styles.sectionTitle}>第3条 アカウント管理</Text>
            <Text style={styles.body}>
              利用者は、自身の責任でログイン情報およびアカウントを管理するものとします。第三者による利用、貸与、譲渡、売買、名義変更は禁止します。アカウントの管理不十分、使用上の過誤、第三者使用等により生じた損害について、運営者は運営者に故意または重過失がある場合を除き責任を負いません。
            </Text>

            <Text style={styles.sectionTitle}>第4条 本サービスの性質</Text>
            <Text style={styles.body}>
              本サービスは、利用者同士がプロフィール閲覧、いいね、マッチ、メッセージ等を通じて交流する機会を提供するサービスです。運営者は、特定の相手との出会い、交際、成婚、連絡継続、プロフィール情報の完全性・真実性、利用者間の関係成立を保証しません。
            </Text>

            <Text style={styles.sectionTitle}>第5条 禁止事項</Text>
            <Text style={styles.body}>
              利用者は、以下の行為を行ってはなりません。虚偽情報の登録、なりすまし、他人の画像・情報の無断使用、18歳未満の利用または誘引、売春・買春・援助交際・違法な性的行為の勧誘、金銭目的の勧誘、詐欺、投資・副業・宗教・マルチ商法等への勧誘、外部サービスへの不適切な誘導、迷惑行為、ストーカー行為、脅迫、誹謗中傷、差別的表現、わいせつ・暴力的・違法な投稿、個人情報の無断収集、第三者の権利侵害、不正アクセス、システムへの過度な負荷、その他法令または公序良俗に反する行為。
            </Text>

            <Text style={styles.sectionTitle}>第6条 投稿・プロフィール情報</Text>
            <Text style={styles.body}>
              利用者は、自身が投稿または登録する文章、画像、その他情報について必要な権利を有していることを保証します。運営者は、法令違反、規約違反、通報、権利侵害のおそれ、またはサービス運営上必要と判断した場合、事前通知なく投稿・プロフィール情報の非表示、削除、修正依頼、アカウント制限を行うことができます。
            </Text>

            <Text style={styles.sectionTitle}>第7条 通報・ブロック・安全対策</Text>
            <Text style={styles.body}>
              利用者は、不適切な利用者を発見した場合、通報またはブロック機能を利用できます。運営者は、通報内容、利用状況、登録情報等を確認し、必要に応じて警告、表示制限、利用停止、退会処分、関係機関への相談等を行うことがあります。ただし、全ての通報への個別回答や対応結果の開示を保証するものではありません。
            </Text>

            <Text style={styles.sectionTitle}>第8条 利用停止・登録抹消</Text>
            <Text style={styles.body}>
              運営者は、利用者が本規約に違反した場合、不正利用のおそれがある場合、一定期間利用がない場合、その他運営者が必要と判断した場合、事前通知なく利用制限、投稿削除、マッチ解除、アカウント停止または登録抹消を行うことができます。これにより利用者に損害が生じても、運営者は運営者に故意または重過失がある場合を除き責任を負いません。
            </Text>

            <Text style={styles.sectionTitle}>第9条 退会・アカウント削除</Text>
            <Text style={styles.body}>
              利用者は、運営者所定の方法により退会またはアカウント削除を申請できます。退会後も、法令遵守、不正利用防止、紛争対応、問い合わせ対応のために必要な範囲で一定期間情報を保持する場合があります。
            </Text>

            <Text style={styles.sectionTitle}>第10条 免責事項</Text>
            <Text style={styles.body}>
              利用者間の連絡、交流、面会、取引、トラブル、損害、犯罪被害等は利用者自身の責任で対応するものとします。運営者は、本サービスの完全性、正確性、有用性、安全性、継続性、エラーや障害がないことを保証しません。運営者は、運営者に故意または重過失がある場合を除き、本サービスに関連して利用者に生じた損害について責任を負いません。
            </Text>

            <Text style={styles.sectionTitle}>第11条 サービス変更・中断・終了</Text>
            <Text style={styles.body}>
              運営者は、保守、障害、セキュリティ対応、法令対応、運営上の都合等により、事前通知なく本サービスの全部または一部を変更、中断、停止、終了することがあります。
            </Text>

            <Text style={styles.sectionTitle}>第12条 規約変更</Text>
            <Text style={styles.body}>
              運営者は、必要に応じて本規約を変更できます。重要な変更がある場合は、本サービス上での掲示その他適切な方法により周知します。変更後に利用者が本サービスを利用した場合、変更後の規約に同意したものとみなします。
            </Text>

            <Text style={styles.sectionTitle}>第13条 準拠法・管轄</Text>
            <Text style={styles.body}>
              本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
            </Text>

            <Text style={styles.note}>制定日：2026年6月</Text>
          </>
        )}

        {type === 'privacy' && (
          <>
            <Text style={styles.lead}>
              Xching（以下「本サービス」といいます。）は、利用者の個人情報を適切に取り扱うため、以下のとおりプライバシーポリシーを定めます。
            </Text>

            <Text style={styles.sectionTitle}>1. 取得する情報</Text>
            <Text style={styles.body}>
              本サービスは、メールアドレス、ユーザーID、ニックネーム、生年月日、年齢、性別、居住地、自己紹介、職業、休日、趣味、プロフィール画像、本人確認または年齢確認に必要な情報、いいね・マッチ・ブロック・通報・メッセージ等の利用履歴、端末情報、アクセスログ、問い合わせ内容その他サービス提供に必要な情報を取得する場合があります。
            </Text>

            <Text style={styles.sectionTitle}>2. 利用目的</Text>
            <Text style={styles.body}>
              取得した情報は、会員登録、プロフィール表示、マッチング、メッセージ機能、年齢確認・本人確認、不正利用防止、通報・ブロック対応、利用停止等の安全管理、問い合わせ対応、サービス改善、利用状況分析、重要なお知らせ、法令遵守、紛争・トラブル対応のために利用します。
            </Text>

            <Text style={styles.sectionTitle}>3. プロフィール情報の公開範囲</Text>
            <Text style={styles.body}>
              ニックネーム、年齢、性別、居住地、自己紹介、画像等のプロフィール情報は、サービスの性質上、他の利用者に表示されます。利用者は、公開されることを前提として登録内容を管理してください。住所、電話番号、勤務先、金融情報等の機微な情報をプロフィールやメッセージに記載しないでください。
            </Text>

            <Text style={styles.sectionTitle}>4. 第三者提供</Text>
            <Text style={styles.body}>
              本サービスは、法令に基づく場合、生命・身体・財産の保護に必要な場合、利用者の同意がある場合、業務委託先に必要な範囲で提供する場合を除き、個人情報を第三者に提供しません。
            </Text>

            <Text style={styles.sectionTitle}>5. 外部サービス・委託先</Text>
            <Text style={styles.body}>
              本サービスは、認証、データ保存、画像保存、配信、分析、問い合わせ対応等のため、クラウドサービス、データベース、ストレージ、決済、分析ツール等の外部サービスを利用する場合があります。委託先には、必要な範囲で情報を取り扱わせ、適切な管理に努めます。
            </Text>

            <Text style={styles.sectionTitle}>6. 安全管理</Text>
            <Text style={styles.body}>
              本サービスは、個人情報の漏えい、滅失、毀損、不正アクセス等を防止するため、アクセス制御、権限管理、通信の暗号化、ログ管理等、合理的な安全管理措置を講じます。ただし、インターネット上の通信およびシステムについて完全な安全性を保証するものではありません。
            </Text>

            <Text style={styles.sectionTitle}>7. 保存期間</Text>
            <Text style={styles.body}>
              取得した情報は、利用目的の達成に必要な期間保存します。退会またはアカウント削除後も、法令遵守、不正利用防止、紛争対応、問い合わせ対応、監査、安全管理のために必要な範囲で一定期間保存する場合があります。
            </Text>

            <Text style={styles.sectionTitle}>8. 開示・訂正・削除等</Text>
            <Text style={styles.body}>
              利用者は、法令に基づき、自己の個人情報の開示、訂正、利用停止、削除等を請求できます。本人確認のうえ、合理的な期間内に対応します。ただし、法令上または運営上保存が必要な情報については、削除に応じられない場合があります。
            </Text>

            <Text style={styles.sectionTitle}>9. 未成年者の利用禁止</Text>
            <Text style={styles.body}>
              本サービスは18歳未満の利用を禁止しています。18歳未満による利用が判明した場合、運営者はアカウント停止、削除その他必要な措置を行います。
            </Text>

            <Text style={styles.sectionTitle}>10. ポリシー変更</Text>
            <Text style={styles.body}>
              本ポリシーは、法令変更、サービス内容変更、運営上の必要に応じて変更されることがあります。重要な変更は本サービス上で周知します。
            </Text>

            <Text style={styles.note}>制定日：2026年6月</Text>
          </>
        )}

        {type === 'contact' && (
          <>
            <Text style={styles.lead}>
              お問い合わせ、通報対応、アカウント削除依頼、個人情報に関する請求は、以下のメールアドレスまでご連絡ください。
            </Text>

            <Text style={styles.contactMail}>support@xching.jp</Text>

            <Text style={styles.body}>
              ご連絡の際は、登録メールアドレス、ユーザーID、発生日時、対象ユーザー、具体的な内容を可能な範囲で記載してください。安全上の理由により、通報の調査結果や相手方への対応内容は開示できない場合があります。
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
  border: '#ead9de',
  card: '#ffffff',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 72,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: {
    color: colors.primary,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  lead: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 25,
  },
  note: {
    fontSize: 13,
    color: colors.subText,
    marginTop: 28,
    lineHeight: 22,
  },
  contactMail: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '800',
    marginVertical: 18,
  },
});
