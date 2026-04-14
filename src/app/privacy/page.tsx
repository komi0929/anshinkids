import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

export default function PrivacyPage() {
 return (
 <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">
 {/* Header */}
 <div className="sticky top-0 z-40 px-5 py-4 flex items-center justify-between border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md ">
 <BackButton />
 <h1 className="text-[17px] font-extrabold tracking-tight text-[var(--color-text)]">
 プライバシーポリシー
 </h1>
 <div className="w-10 h-10" />
 </div>

 <div className="px-5 py-8 mx-auto max-w-2xl">
 <section className="space-y-8 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
 <p>
 株式会社ヒトコト（以下「当社」）は、本サービス「あんしんキッズ」（以下「本サービス」）における、
 ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
 </p>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第1条（個人情報）</h2>
 <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第2条（個人情報の収集方法）</h2>
 <p className="mb-2">当社は、ユーザーが利用登録をする際に以下の個人情報を収集することがあります。</p>
 <ol className="list-decimal pl-5 space-y-2">
 <li><strong>LINE認証情報</strong>: LINEアカウントとの連携により取得するユーザーID、表示名、プロフィール画像URL</li>
 <li><strong>ユーザーが任意に提供する情報</strong>: お子さまのアレルゲン情報、月齢等のプロフィール情報</li>
 <li><strong>コンテンツ</strong>: トークルームへのお話し内容、AIコンシェルジュへの相談内容</li>
 <li><strong>利用履歴</strong>: 本サービス内でのアクセスログ、「ありがとう」ボタンの押下履歴</li>
 <li><strong>Cookie等の技術的情報</strong>: セッション管理に必要なCookie情報</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第3条（個人情報を収集・利用する目的）</h2>
 <p className="mb-2">当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
 <ol className="list-decimal pl-5 space-y-2">
 <li>本サービスの提供・運営のため</li>
 <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
 <li>AIによる情報抽出・構造化処理（みんなの体験まとめ等の生成）のため</li>
 <li>AIコンシェルジュによる相談回答のため</li>
 <li>情報の品質維持およびコミュニティの安全性確保のため</li>
 <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
 <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
 <li>上記の利用目的に付随する目的のため</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第4条（利用目的の変更）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
 <li>利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本サービス上に公表するものとします。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第5条（個人情報の第三者提供）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
 <ul className="list-disc pl-5 mt-1 space-y-1">
 <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
 <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
 <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
 </ul>
 </li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第6条（AI処理における個人情報の取扱い）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>本サービスでは、Google Gemini AI（以下「外部AIサービス」）を利用して、投稿された情報の解析・構造化を行います。</li>
 <li>外部AIサービスへ送信するデータには、投稿テキストの内容のみが含まれ、ユーザーの氏名、LINE ID等の個人識別情報は送信しません。</li>
 <li>AI処理により生成されたまとめ記事では、個人を特定できる情報は除去されます。ただし、完全な除去を保証するものではなく、万が一個人情報が含まれていた場合は、当社にご連絡ください。速やかに対応いたします。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第7条（個人情報の開示）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあります。
 <ul className="list-disc pl-5 mt-1 space-y-1">
 <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
 <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
 <li>その他法令に違反することとなる場合</li>
 </ul>
 </li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第8条（個人情報の訂正および削除）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除を請求することができます。</li>
 <li>当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第9条（個人情報の利用停止等）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は、本人から、個人情報が利用目的の範囲を超えて取り扱われているという理由により、その利用の停止または消去を求められた場合には、遅滞なく必要な調査を行います。</li>
 <li>前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第10条（プライバシーポリシーの変更）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</li>
 <li>当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本サービス上に掲載したときから効力を生じるものとします。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第11条（お問い合わせ窓口）</h2>
 <p>本ポリシーに関するお問い合わせは、下記までお願いいたします。</p>
 </div>

 <div className="pt-8 border-t border-[var(--color-border)]">
 <p>2026年3月27日 制定</p>
 <p className="mt-2">
 株式会社ヒトコト<br />
 代表 小南優作<br />
 お問い合わせ: <a href="mailto:y.kominami@hitokoto1.co.jp" className="text-[var(--color-primary)] underline">y.kominami@hitokoto1.co.jp</a>
 </p>
 </div>
 </section>
 </div>

 {/* Footer Nav */}
 <div className="px-5 pb-8 flex flex-col items-center gap-3 text-[12px] font-bold text-[var(--color-muted)]">
 <div className="flex items-center gap-4">
 <Link href="/terms" className="hover:text-[var(--color-text)] transition-colors">利用規約</Link>
 <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
 <Link href="/about" className="hover:text-[var(--color-text)] transition-colors">あんしんキッズとは</Link>
 <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
 <Link href="/support" className="hover:text-[var(--color-text)] transition-colors">サポート</Link>
 </div>
 </div>
 </div>
 );
}
