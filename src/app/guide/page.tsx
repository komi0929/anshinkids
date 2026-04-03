import Link from "next/link";
import Image from "next/image";
import { Leaf, ArrowLeft, MessageCircle, BookOpen, Sparkles, ArrowRight } from "@/components/icons";

export const metadata = {
  title: "使い方ガイド | あんしんキッズ",
  description: "あんしんキッズの使い方を、画面付きでわかりやすく解説します。",
};

const steps = [
  {
    number: 1,
    title: "みんなの声で体験をシェア",
    description:
      "テーマ別のトークルームで、日々の悩みや発見を気軽にお話しできます。「毎日のごはん」「外食・お出かけ」など、生活シーンに合ったテーマを選んでタップするだけ。",
    tip: "あなたのお声は一定時間でリセットされるので、気兼ねなくお話しできます。会話から生まれた体験はAIが「みんなのまとめ」に整理します。",
    image: "/guide-talk.png",
    alt: "みんなの声 - テーマ一覧画面",
    color: "var(--color-primary)",
  },
  {
    number: 2,
    title: "トークルームで話す",
    description:
      "ルームに入ったら、テキストを入力して送るだけ。他の保護者の体験も読めます。「いいね」で共感を伝えたり、返信で会話を深めることもできます。",
    tip: "会話はすべて匿名。LINEの表示名は他のユーザーには見えません。",
    image: "/guide-talk-room.png",
    alt: "トークルーム内のチャット画面",
    color: "var(--color-accent)",
  },
  {
    number: 3,
    title: "みんなのまとめで知識を探す",
    description:
      "みんなの体験をAIが読み解き、検索できる知識ライブラリに。「毎日のごはん」など8つの大きなテーマ別に探せます。",
    tip: "各記事の「情報を追加」から、あなたの体験を書き足せます。みんなで記事を育てましょう。",
    image: "/guide-wiki.png",
    alt: "みんなのまとめ - 知識ライブラリ画面",
    color: "var(--color-success)",
  },
  {
    number: 4,
    title: "AI相談でサッと聞く",
    description:
      "「卵アレルギーでも食べられるケーキは？」のように自然な言葉で質問するだけ。みんなの体験データをもとに、AIがやさしく回答します。",
    tip: "医療アドバイスではありません。具体的な治療は必ず主治医にご相談ください。",
    image: "/guide-concierge.png",
    alt: "AI相談 - コンシェルジュ画面",
    color: "var(--color-warning)",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]">
      {/* Header */}
      <div className="px-5 pt-7 pb-4">
        <Link
          href="/about"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-subtle)] hover:text-[var(--color-text)] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          あんしんキッズについて
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--color-text)] tracking-tight break-keep text-balance">
              使い方ガイド
            </h1>
            <p className="text-[12px] text-[var(--color-subtle)]">
              3分でわかる、あんしんキッズの活用法
            </p>
          </div>
        </div>
      </div>

      {/* How the loop works */}
      <div className="mx-5 mb-6 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] shadow-sm">
        <h2 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 break-keep text-balance">
          🔄 あんしんキッズの仕組み
        </h2>
        <div className="flex items-center justify-between gap-2 text-center">
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <p className="text-[11px] font-bold text-[var(--color-text)]">話す</p>
            <p className="text-[9px] text-[var(--color-subtle)]">みんなの声</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--color-muted)] flex-shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <p className="text-[11px] font-bold text-[var(--color-text)]">AIが編集</p>
            <p className="text-[9px] text-[var(--color-subtle)]">会話から知恵に</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--color-muted)] flex-shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <p className="text-[11px] font-bold text-[var(--color-text)]">まとめに蓄積</p>
            <p className="text-[9px] text-[var(--color-subtle)]">みんなの資産</p>
          </div>
        </div>
        <p className="text-[11px] text-[var(--color-subtle)] text-center mt-3 leading-relaxed">
          あなたの体験が、次に悩む誰かの助けになります。<br />
          使うほど「まとめ」が育ち、AI回答も正確になっていきます。
        </p>
      </div>

      {/* Feature Highlights (UX & Growth) */}
      <div className="mx-5 mb-8 p-5 rounded-2xl bg-[#FBF8F4] border border-[var(--color-border-light)] shadow-sm">
        <h2 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-1.5 break-keep text-balance">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
          あんしんキッズのやさしい特徴
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-[12px] font-bold text-[var(--color-text)] mb-1 break-keep text-balance">💚 「ありがとう」が目に見える資産に</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              トークルームで共感を集めたり、まとめ記事に体験を追加すると「ありがとう」が届きます。あなたの日々の奮闘が、コミュニティを守る力としてマイページに記録され、お互いの助け合いがひと目で分かります。
            </p>
          </div>
          <div>
            <h3 className="text-[12px] font-bold text-[var(--color-text)] mb-1 break-keep text-balance">⚡ 病院の地下でもサクサク安心</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              最新の超高速技術を搭載し、画面の読み込み待ち時間を「ゼロ」にしました。一度開いたまとめ記事は裏で自動保存されるため、電波の悪い病院の待合室や災害時でも、お守りのようにサクサク閲覧できます。
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 space-y-8 pb-10">
        {steps.map((step) => (
          <div key={step.number} className="fade-in">
            {/* Step header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-[13px] shadow-sm"
                style={{ backgroundColor: step.color }}
              >
                {step.number}
              </div>
              <h2 className="text-[16px] font-extrabold text-[var(--color-text)] break-keep text-balance">
                {step.title}
              </h2>
            </div>

            {/* Screenshot */}
            <div className="rounded-2xl overflow-hidden border border-[var(--color-border-light)] shadow-md mb-3 bg-[var(--color-surface)]">
              <Image
                src={step.image}
                alt={step.alt}
                width={390}
                height={500}
                className="w-full h-auto"
                priority={step.number <= 2}
              />
            </div>

            {/* Description */}
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.8] mb-2">
              {step.description}
            </p>

            {/* Tip */}
            <div className="p-3 rounded-xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                💡 <span className="font-bold">ポイント：</span>{step.tip}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 pb-10">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] text-center shadow-lg">
          <h2 className="text-[17px] font-extrabold text-white mb-2 break-keep text-balance">
            さっそく使ってみよう 🌿
          </h2>
          <p className="text-[12px] text-white/80 mb-4 leading-relaxed">
            ログインなしでも、みんなの声とまとめ記事は<br />今すぐ読めます。
          </p>
          <Link
            href="/talk"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[var(--color-primary)] font-bold text-[14px] shadow-sm hover:shadow-md transition-all"
          >
            みんなの声を見る
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
