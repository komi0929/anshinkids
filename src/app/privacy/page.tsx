export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] px-4 py-12" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-2xl font-bold break-keep text-balance">プライバシーポリシー</h1>
        <section className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <p>
            株式会社ヒトコト（以下「当社」）は、本サービス「あんしんキッズ」（以下「本サービス」）における、
            ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
          </p>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第1条（個人情報）</h2>
            <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第2条（個人情報の収集方法）</h2>
            <p className="mb-2">当社は、ユーザーが利用登録をする際に以下の個人情報を収集することがあります。</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>LINE認証情報</strong>: LINEアカウントとの連携により取得するユーザーID、表示名、プロフィール画像URL</li>
              <li><strong>ユーザーが任意に提供する情報</strong>: お子さまのアレルゲン情報、月齢等のプロフィール情報</li>
              <li><strong>投稿コンテンツ</strong>: トークルームへの投稿内容、AIコンシェルジュへの相談内容</li>
              <li><strong>利用履歴</strong>: 本サービス内でのアクセスログ、「ありがとう」ボタンの押下履歴</li>
              <li><strong>Cookie等の技術的情報</strong>: セッション管理に必要なCookie情報</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第3条（個人情報を収集・利用する目的）</h2>
            <p className="mb-2">当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li>AIによる情報抽出・構造化処理（AI動的Wiki生成）のため</li>
              <li>AIコンシェルジュによる相談回答のため</li>
              <li>情報の品質維持およびコミュニティの安全性確保のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li>上記の利用目的に付随する目的のため</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第4条（利用目的の変更）</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
              <li>利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本サービス上に公表するものとします。</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第5条（個人情報の第三者提供）</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                </ul>
              </li>
              <li>前項の定めにかかわらず、以下の場合には、当該情報の提供先は第三者に該当しないものとします。
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                  <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                </ul>
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第6条（AI処理における個人情報の取扱い）</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>本サービスでは、Google Gemini AI（以下「外部AIサービス」）を利用して、投稿された情報の解析・構造化を行います。</li>
              <li>外部AIサービスへ送信するデータには、投稿テキストの内容のみが含まれ、ユーザーの氏名、LINE ID等の個人識別情報は送信しません。</li>
              <li>AI処理により生成されたWiki記事（パブリックWiki含む）では、個人を特定できる情報は除去されます。ただし、完全な除去を保証するものではなく、万が一個人情報が含まれていた場合は、当社にご連絡ください。速やかに対応いたします。</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第7条（個人情報の開示）</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                  <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                  <li>その他法令に違反することとなる場合</li>
                </ul>
              </li>
              <li>前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第8条（個人情報の訂正および削除）</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下「訂正等」）を請求することができます。</li>
              <li>当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。</li>
              <li>当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第9条（個人情報の利用停止等）</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>当社は、本人から、個人情報が利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」）を求められた場合には、遅滞なく必要な調査を行います。</li>
              <li>前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。</li>
              <li>当社は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第10条（プライバシーポリシーの変更）</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</li>
              <li>当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本サービス上に掲載したときから効力を生じるものとします。</li>
            </ol>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-3 break-keep text-balance" style={{ color: "var(--color-text)" }}>第11条（お問い合わせ窓口）</h2>
            <p>本ポリシーに関するお問い合わせは、下記までお願いいたします。</p>
          </div>

          <div className="pt-8 border-t" style={{ borderColor: "var(--color-border)" }}>
            <p>2026年3月27日 制定</p>
            <p className="mt-2">
              株式会社ヒトコト<br />
              代表 小南優作<br />
              お問い合わせ: <a href="mailto:y.kominami@hitokoto1.co.jp" className="underline" style={{ color: "var(--color-primary)" }}>y.kominami@hitokoto1.co.jp</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
