
import Link from "next/link";
import { Sparkles, Shield, User, Heart, Leaf, BookOpen, Check, TrendingUp, ShieldCheck, RefreshCw, Clock, Search, Plus, Share } from "@/components/icons";

const CATEGORIES = [
  {
    title: "SNS・コミュニティアプローチ",
    desc: "ユーザー同士が助け合い、自発的な「善意のループ」を回すための機能設計。",
    colorClass: "from-pink-100 to-rose-50 text-rose-600 border-rose-200",
    iconBg: "bg-rose-500",
    features: [
      { title: "完全匿名・安全なトークルーム", desc: "LINEの個人情報を完全遮断。システム上で固有の「匿名ID（Slug）」を発行し、実名やSNS連携のリスクを排除します。", icon: <Shield className="w-5 h-5" />, tags: ["Privacy", "Auth"] },
      { title: "「ありがとう」共感フィードバック", desc: "解決策ではなくとも、ただ「わかるよ」と感謝を伝えるだけのワンタップアクションを実装し、心理的安全性を確保。", icon: <Heart className="w-5 h-5" /> },
      { title: "影響の可視化 (Compound Impact)", desc: "「あなたの体験が〇人の親御さんに読まれています」と具体的に数値化し、マイページでやりがいを提示。", icon: <TrendingUp className="w-5 h-5" />, tags: ["UX"] },
      { title: "SOSリップル（外部連携）", desc: "どうしても助けが必要な投稿を、OGP画像付きの「ヘルプカード」として生成し、外部SNS(X等)へ拡散できる機能。", icon: <Share className="w-5 h-5" />, tags: ["Growth"] },
      { title: "階層のないダイナミックダッシュボード", desc: "権威性（モデレーターや称号）を排除し、未ログイン、閲覧のみ、お話し参加者の3つの状態に応じてUIがフラットに変化。", icon: <User className="w-5 h-5" /> },
    ]
  },
  {
    title: "AI自律ループとアーキテクチャ",
    desc: "トークを知識に変え、プラットフォームを自動で育てるLiving Knowledgeエンジンの裏側。",
    colorClass: "from-emerald-100 to-green-50 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-500",
    features: [
      { title: "3日間の自動アーカイブ（自律掃除）", desc: "トークルームで72時間発言がなかった場合、自動で会話をクローズし、コミュニティの文脈を常に最新に保ちます。", icon: <Clock className="w-5 h-5" />, tags: ["Cron", "DB"] },
      { title: "文脈抽出エンジン (Talk-to-Wiki)", desc: "アーカイブ時、Gemini 3 Flashが会話の全スレッドを解析し、有益な一次情報を「Snippet」として自動抽出する中核機能。", icon: <RefreshCw className="w-5 h-5" />, tags: ["Gemini"] },
      { title: "8テーマのHub & Spoke分配", desc: "抽出されたSnippetを、外食・レシピ・学校生活などの「8つの巨大なメガWiki（Hub）」へ自動で分類・マージする構造。", icon: <BookOpen className="w-5 h-5" /> },
      { title: "緊急度判定ガード (Medical Safety)", desc: "「息苦しい」等のアナフィラキシー疑いをAIが検知し、APIレベルで即時回答を遮断、119番への誘導へ強制フォールバック。", icon: <ShieldCheck className="w-5 h-5" />, tags: ["Safety"] },
      { title: "ハルシネーション追跡機構", desc: "まとめ記事の一文ごとに、「どの親御さんの発言（ID）をもとにAIが書いたか」を紐づけ、情報の出所を完全にトラッキング。", icon: <Search className="w-5 h-5" /> },
      { title: "ポリフィル型スキーママッチング", desc: "リモートDBのマイグレーションが遅延しても、フロントエンドで安全にJSONをフォールバックする高耐障害設計。", icon: <Check className="w-5 h-5" /> },
    ]
  },
  {
    title: "最高精細 UI/UX (Nani System)",
    desc: "アレルギー管理の難しさを消し飛ばす、Bento UIとモダンフロントエンドの融合。",
    colorClass: "from-blue-100 to-indigo-50 text-indigo-700 border-indigo-200",
    iconBg: "bg-indigo-500",
    features: [
      { title: "マイクロブックマーク", desc: "メガWiki全体ではなく、記事の「この一文だけ！」をピンポイントで切り抜いてマイページにストックする個人辞書機能。", icon: <BookOpen className="w-5 h-5" />, tags: ["UX"] },
      { title: "Bento UIとGlassmorphism", desc: "視覚的境界が美しい32pxの角丸カード（Bento）を並べ、背景には半透明グラスエフェクトを適用したノイズレスなデザイン。", icon: <Sparkles className="w-5 h-5" />, tags: ["Design"] },
      { title: "動的兄弟プロファイル管理", desc: "「1人目」「2人目」のタブを切り替え、別々の年齢・複雑なアレルゲンデータを一つのRAGコンテキストとしてAIに同時伝達。", icon: <User className="w-5 h-5" /> },
      { title: "28品目＋自由記述のTag Input", desc: "厚労省指定の最新28品目に加え、入力欄でエンターを押すだけであらゆる食材を無制限に追加できる動的ラベルUI。", icon: <Plus className="w-5 h-5" /> },
      { title: "Hydration Mismatch自動回避", desc: "Server/ClientのSSRレンダリング差異によるReact18のクラッシュを先読みして防ぐ `isMounted` フック基盤。", icon: <Check className="w-5 h-5" />, tags: ["React"] },
      { title: "Server ActionsのAPIレス通信", desc: "Next.js 16のServer Actionsをフル活用し、GraphQLやREST API層を持たずに直接セキュアにDBと会話する高速アーキテクチャ。", icon: <TrendingUp className="w-5 h-5" /> },
    ]
  }
];

export default function FeaturesPage() {
  return (
    <div className="fade-in pb-16 min-h-[100dvh] bg-[var(--color-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 py-4 border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-warm)] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight">オープンな開発仕様</h1>
            <p className="text-[11px] font-bold text-[var(--color-text-secondary)] mt-0.5">Living Knowledge を実現する技術とUX</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-10 max-w-2xl mx-auto">
        {/* Intro */}
        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-light)] shadow-sm">
          <h2 className="text-[16px] font-black text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            なぜ全ての仕様を公開するのか？
          </h2>
          <p className="text-[13px] font-bold text-[var(--color-text-secondary)] leading-[1.8] mb-5">
            「あんしんキッズ」は、アレルギーをもつ子どもたちとその家族を守るためのプラットフォームです。この仕組みをブラックボックスにせず、自律型のAI抽出ループから細かなUXのアプローチまで全てをオープン化することで、より多くの技術者やコミュニティと共に発展していくことを目指しています。
          </p>
          <div className="flex flex-wrap gap-2">
            {["Next.js 16", "Supabase", "Gemini 3 Flash", "Bento UI"].map(tag => (
               <span key={tag} className="px-3 py-1 bg-[var(--color-surface-warm)] rounded-full text-[11px] font-extrabold text-[var(--color-subtle)] border border-[var(--color-border-light)]">
                 {tag}
               </span>
            ))}
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-10">
          {CATEGORIES.map((category, index) => (
            <section key={category.title} className="slide-up relative" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center gap-3 mb-5">
                <span className={`w-10 h-10 rounded-[18px] flex items-center justify-center font-black text-[14px] text-white ${category.iconBg} shadow-sm border border-white/20`}>
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[17px] font-black text-[var(--color-text)] tracking-tight leading-tight">{category.title}</h3>
                  <p className="text-[11.5px] font-bold text-[var(--color-subtle)] mt-0.5">{category.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.features.map((feature, fIndex) => (
                  <div key={fIndex} className="p-5 rounded-[24px] bg-white border border-[var(--color-border-light)] hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5 text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] transition-colors">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[14px] font-black text-[var(--color-text)] mb-2 leading-tight">{feature.title}</h4>
                        <p className="text-[12.5px] font-semibold text-[var(--color-text-secondary)] leading-relaxed">
                          {feature.desc}
                        </p>
                        {feature.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {feature.tags.map(tag => (
                              <span key={tag} className="text-[9.5px] font-black uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface-warm)] px-2 py-0.5 rounded-lg border border-[var(--color-border-light)]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Global CTA */}
        <div className="mt-12 p-8 rounded-[32px] bg-[var(--color-text)] text-white text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 mx-auto bg-white/10 rounded-[20px] flex items-center justify-center backdrop-blur-md mb-4 border border-white/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-[18px] font-extrabold mb-3 tracking-tight">力を貸してください 🤝</h2>
            <p className="text-[13px] font-bold text-white/80 mb-6 leading-relaxed max-w-[280px] mx-auto">
              これらの仕様を一緒に洗練させ、より多くのアレルギーっ子家族を救う開発メンバー・デザイナーを探しています。
            </p>
            <a href="mailto:partner@anshin-kids.app" className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-text)] px-6 py-3.5 rounded-2xl text-[14px] font-black shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform">
              <User className="w-4 h-4" /> 開発・デザインに協力する
            </a>
          </div>
        </div>

        <div className="text-center mt-8 pb-4">
          <Link href="/about" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeftIcon className="w-4 h-4" /> 概要（アバウト）に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);
