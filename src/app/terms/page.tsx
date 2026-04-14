import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

export default function TermsPage() {
 return (
 <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">
 {/* Header */}
 <div className="sticky top-0 z-40 px-5 py-4 flex items-center justify-between border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md ">
 <BackButton />
 <h1 className="text-[17px] font-extrabold tracking-tight text-[var(--color-text)]">
 利用規約
 </h1>
 <div className="w-10 h-10" />
 </div>

 <div className="px-5 py-8 mx-auto max-w-2xl">
 <section className="space-y-8 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
 <p>
 この利用規約（以下「本規約」）は、株式会社ヒトコト（以下「当社」）が提供する
 「あんしんキッズ」（以下「本サービス」）の利用条件を定めるものです。
 利用者の皆さま（以下「ユーザー」）には、本規約に同意いただいた上で、本サービスをご利用いただきます。
 </p>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第1条（適用）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</li>
 <li>当社は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下「個別規定」）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。</li>
 <li>本規約と個別規定が矛盾する場合には、個別規定の定めが優先されるものとします。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第2条（利用登録）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこの利用登録の申請を承認することによって、利用登録が完了するものとします。</li>
 <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
 <ul className="list-disc pl-5 mt-1 space-y-1">
 <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
 <li>本規約に違反したことがある者からの申請である場合</li>
 <li>その他、当社が利用登録を相当でないと判断した場合</li>
 </ul>
 </li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第3条（ユーザーIDおよびパスワードの管理）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>ユーザーは、自己の責任において、本サービスのLINEアカウント連携情報を適切に管理するものとします。</li>
 <li>ユーザーは、いかなる場合にも、アカウント情報を第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
 <li>当社は、LINEアカウントと紐づけられた認証情報が一致してログインされた場合には、そのアカウントを所有するユーザー自身による利用とみなします。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第4条（禁止事項）</h2>
 <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
 <ol className="list-decimal pl-5 space-y-2">
 <li>法令または公序良俗に違反する行為</li>
 <li>犯罪行為に関連する行為</li>
 <li>当社、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
 <li>当社のサービスの運営を妨害するおそれのある行為</li>
 <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
 <li>不正アクセスをし、またはこれを試みる行為</li>
 <li>他のユーザーに成りすます行為</li>
 <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
 <li>当社、本サービスの他のユーザーまたは第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
 <li>医療行為と誤認されるような断定的な医療アドバイスを投稿する行為</li>
 <li>営利目的の広告、宣伝、勧誘等の投稿行為（ステルスマーケティングを含む）</li>
 <li>他のユーザーの投稿に対する攻撃的・侮辱的な言動</li>
 <li>その他、当社が不適切と判断する行為</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第5条（本サービスの提供の停止等）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
 <ul className="list-disc pl-5 mt-1 space-y-1">
 <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
 <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
 <li>コンピュータまたは通信回線等が事故により停止した場合</li>
 <li>その他、当社が本サービスの提供が困難と判断した場合</li>
 </ul>
 </li>
 <li>当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第6条（投稿内容に関する権利と取扱い）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>ユーザーが本サービスに投稿した内容（テキスト、画像等を含みます。以下「投稿コンテンツ」）の著作権は、当該ユーザーに帰属します。</li>
 <li>ユーザーは、投稿コンテンツについて、当社に対し、本サービスの運営・改善に必要な範囲で、無償・非独占的・地域を問わない利用許諾を与えるものとします。これには、AIによる情報抽出、要約、構造化（「AI動的Wiki」への変換）および公開が含まれます。</li>
 <li>トークルームにお話しされた内容は、一定時間でUI上からリセットされます。ただし、AIによる情報抽出・構造化後のデータ（個人を特定できない客観的事実情報）は、「みんなの体験まとめ（Wiki）」として蓄積・公開されます。</li>
 <li>当社は、公開にあたり個人を特定できる情報、感情的表現を除去するよう努めますが、完全な除去を保証するものではありません。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第7条（AI機能に関する免責）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>本サービスが提供するAI機能（AIコンシェルジュ、AI動的Wiki等）は、利用者の情報提供を支援するものであり、医療上の助言を提供するものではありません。</li>
 <li>AIが提示する情報は、過去の利用者の一次情報に基づく参考情報であり、正確性・完全性・最新性を保証するものではありません。</li>
 <li>食物アレルギーに関する判断は、必ず主治医等の医療専門家にご相談ください。AIの回答に基づいて行った行動により生じた損害について、当社は一切の責任を負いません。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第8条（利用制限および登録抹消）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、投稿コンテンツの削除、ユーザーに対して本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
 <ul className="list-disc pl-5 mt-1 space-y-1">
 <li>本規約のいずれかの条項に違反した場合</li>
 <li>登録事項に虚偽の事実があることが判明した場合</li>
 <li>当社からの連絡に対し、一定期間返答がない場合</li>
 <li>本サービスについて、最終の利用から一定期間利用がない場合</li>
 <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
 </ul>
 </li>
 <li>当社は、本条に基づき当社が行った行為によりユーザーに生じた損害について、一切の責任を負いません。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第9条（保証の否認および免責事項）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。</li>
 <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。</li>
 <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第10条（サービス内容の変更等）</h2>
 <p>当社は、ユーザーへの事前の告知なくして、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。</p>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第11条（利用規約の変更）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
 <ul className="list-disc pl-5 mt-1 space-y-1">
 <li>本規約の変更がユーザーの一般の利益に適合するとき</li>
 <li>本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき</li>
 </ul>
 </li>
 <li>当社はユーザーに対し、前項による本規約の変更にあたり、事前に、本規約を変更する旨および変更後の本規約の内容並びにその効力発生時期を通知します。</li>
 </ol>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第12条（個人情報の取扱い）</h2>
 <p>当社は、本サービスの利用によって取得する個人情報については、当社「<Link href="/privacy" className="text-[var(--color-primary)] underline">プライバシーポリシー</Link>」に従い適切に取り扱うものとします。</p>
 </div>

 <div>
 <h2 className="text-[15px] font-extrabold mb-3 text-[var(--color-text)] break-keep text-balance">第13条（準拠法・裁判管轄）</h2>
 <ol className="list-decimal pl-5 space-y-2">
 <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
 <li>本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
 </ol>
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
 <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">プライバシー</Link>
 <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
 <Link href="/about" className="hover:text-[var(--color-text)] transition-colors">あんしんキッズとは</Link>
 <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
 <Link href="/support" className="hover:text-[var(--color-text)] transition-colors">サポート</Link>
 </div>
 </div>
 </div>
 );
}
