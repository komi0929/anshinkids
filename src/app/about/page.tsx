import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";
import { Check, Shield, ChevronRight, Sparkles, BookOpen, Heart, TrendingUp } from "@/components/icons";

const STEPS = [
  {
    num: "1",
    title: "トークルームでお話しする",
    desc: "「テーマごとの部屋」で同じ悩みをもつ親御さんと会話できます。",
    icon: "💬",
    points: [
      "ログインしなくても読むことができます",
      "会話は72時間で自動的にアーカイブ",
      "「わかる！」と共感ボタンを押すだけでも参加できます"
    ],
  },
  {
    num: "2",
    title: "会話が「まとめ」に進化",
    desc: "AIがみんなの会話から有用なヒントを抽出し、8つのテーマ記事（メガWiki）に自動整理します。",
    icon: "✨",
    points: [
      "個人情報は一切含まれない形で抽出",
      "誰かの解決策が、未来の親御さんの助けに",
      "あなたの一言が、Wikiを少しずつ成長させます"
    ],
  },
  {
    num: "3",
    title: "マイクロブックマーク",
    desc: "まとめ記事の中から「この一文だけ覚えておきたい！」という役立つ知識をピンポイントで保存。",
    icon: "🔖",
    points: [
      "マイページに直接ストック可能",
      "必要なときにすぐにヒントを引き出せます",
      "自分専用の『おまもりノート』づくり"
    ],
  },
];

const SAFETY_POINTS = [
  { title: "全自動の匿名化", desc: "本名やLINEアイコンは出ません。システムが安全に匿名（ゲストAなど）であつかいます。" },
  { title: "自律クリーンナップ", desc: "古い会話は自動で消去され、いつでもタイムラインは最新で綺麗に保たれます。" },
  { title: "透明なAIハルシネーション対策", desc: "AIのアドバイスには、必ず「保護者の一次情報」のソース数を表示して信頼度を明かします。" },
  { title: "SOSリップル・緊急アラート", desc: "どうしても困ったときはSNSへ拡散して助けを呼んだり、緊急時にはAIが119番の案内を行います。" },
];

export default function AboutPage() {
  return (
    <div className="fade-in pb-24 min-h-[100dvh] bg-[var(--color-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 py-4 flex items-center justify-between border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md shadow-sm">
        <BackButton />
        <h1 className="text-[17px] font-extrabold tracking-tight text-[var(--color-text)]">
          あんしんキッズとは
        </h1>
        <div className="w-10 h-10" /> {/* Spacer for centering */}
      </div>

      {/* Hero Section */}
      <div className="px-6 pt-12 pb-10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-[28px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success-deep)] flex items-center justify-center shadow-xl transform transition-transform hover:scale-105">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-[26px] font-black leading-tight tracking-tight text-[var(--color-text)] mb-4">
          みんなの日常が、<br />
          やさしい知識になる。
        </h2>
        <p className="text-[15px] font-medium leading-[1.9] text-[var(--color-text-secondary)] max-w-sm mx-auto">
          「あんしんキッズ」は、食物アレルギーっ子をもつママ・パパの<strong>リアルな体験と知恵をAIで結晶化</strong>する、新しい『知識のコミュニティ』です。
        </p>
      </div>

      {/* Core Mission Bento Card */}
      <div className="px-5 mb-10">
        <div className="rounded-[32px] p-8 text-center bg-gradient-to-br from-[var(--color-surface-warm)] to-green-50 border border-green-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
          <h3 className="text-[18px] font-extrabold text-[var(--color-text)] mb-4 relative z-10">
            あなたの「今日」が、<br/>誰かの「明日」の安心に。
          </h3>
          <p className="text-[14px] font-semibold leading-relaxed text-[var(--color-text-secondary)] relative z-10">
            毎日のごはんや外食での工夫。<br/>
            あなたがトークルームで話した何気ない体験が、AIの力で自動的に<strong>『まとめ記事』</strong>として蓄積され、明日同じことで悩む別の家族のヒントとしてずっと輝き続けます。
          </p>
        </div>
      </div>

      {/* 3 Steps - Bento Grid Format */}
      <div className="px-5 mb-10">
        <h3 className="text-[18px] font-extrabold text-[var(--color-text)] mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
          つながる 3つの体験
        </h3>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 border border-[var(--color-border-light)] shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-warm)] group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[var(--color-primary)]/10 group-hover:to-[var(--color-success)]/10 flex items-center justify-center flex-shrink-0 transition-all font-black text-[22px]">
                  {step.icon}
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-[var(--color-primary)] mb-0.5">STEP {step.num}</div>
                  <h4 className="text-[17px] font-black text-[var(--color-text)]">
                    {step.title}
                  </h4>
                </div>
              </div>
              <p className="text-[13px] font-bold text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                {step.desc}
              </p>
              <div className="space-y-2">
                {step.points.map((point, j) => (
                  <div key={j} className="flex flex-start gap-2.5">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-[var(--color-success)]" />
                    <span className="text-[12.5px] font-semibold text-[var(--color-subtle)] leading-snug">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Points */}
      <div className="px-5 mb-10">
        <h3 className="text-[18px] font-extrabold text-[var(--color-text)] mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--color-primary)]" />
          徹底した安心への配慮
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAFETY_POINTS.map(({ title, desc }) => (
            <div key={title} className="bg-[var(--color-surface-warm)] rounded-[24px] p-5 border border-[var(--color-border-light)]">
              <h4 className="text-[14px] font-extrabold text-[var(--color-text)] mb-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                {title}
              </h4>
              <p className="text-[12.5px] font-semibold text-[var(--color-text-secondary)] leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Warning */}
      <div className="px-5 mb-10">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-[13px] font-bold leading-relaxed text-amber-900">
              このサービスの情報は保護者の様々な体験に基づく参考情報です。<br/>お子さまの症状やアレルゲンに関する<strong>医療的な判断・摂取については、必ず主治医にご相談ください。</strong>
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-5 pb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--color-primary)]/10 blur-[60px] rounded-full point-events-none -z-10" />
        <h3 className="text-[20px] font-black text-center mb-6 text-[var(--color-text)]">
          さっそく始めましょう！
        </h3>
        
        <div className="space-y-3 max-w-[320px] mx-auto">
          <Link href="/wiki" className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-[var(--color-surface-warm)] text-[var(--color-text)] font-extrabold text-[15px] border border-[var(--color-border-light)] hover:border-[var(--color-primary)]/40 hover:bg-white shadow-sm transition-all transform active:scale-95 group">
            <BookOpen className="w-5 h-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" /> 
            みんなのまとめ記事を読む
          </Link>
          <Link href="/talk" className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-[var(--color-surface-warm)] text-[var(--color-text)] font-extrabold text-[15px] border border-[var(--color-border-light)] hover:border-[var(--color-primary)]/40 hover:bg-white shadow-sm transition-all transform active:scale-95 group">
            <TrendingUp className="w-5 h-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" /> 
            話題のトークルームを見る
          </Link>
          
          <div className="h-4" />
          
          <Link href="/login" className="btn-primary w-full text-center flex items-center justify-center gap-2 py-4 shadow-lg active:scale-95 transition-all text-[15px]">
            <Heart className="w-5 h-5" />
            LINEで参加する (無料)
          </Link>
          <p className="text-[11px] font-bold text-center mt-3 text-[var(--color-muted)]">
            ※ ログインしなくてもまとめ記事の閲覧はご利用いただけます
          </p>
        </div>
      </div>

      {/* Collaboration Link */}
      <div className="px-5 mb-10 max-w-md mx-auto relative pt-4">
        <div className="absolute top-0 left-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent -translate-x-1/2" />
        <div className="text-center">
            <span className="inline-block px-3 py-1 mb-3 rounded-full bg-[var(--color-surface-warm)] text-[10px] font-black tracking-wider text-[var(--color-subtle)] uppercase">Open Source Project</span>
            <h3 className="text-[15px] font-black text-[var(--color-text)] mb-2">
              開発者・協力者の方へ
            </h3>
            <p className="text-[12px] font-bold text-[var(--color-subtle)] mb-5 leading-relaxed">
              プラットフォームの核となる自律AIループやSNS設計など、コミュニティを育てるための全技術仕様を公開しています。
            </p>
            <Link href="/features" className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--color-primary)] hover:underline">
              オープンな開発仕様を見る <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
      </div>

      {/* Footer Links */}
      <div className="px-5 pb-10 flex flex-col items-center justify-center gap-4 text-[12px] font-bold text-[var(--color-muted)]">
        <div className="flex items-center gap-5">
          <Link href="/guide" className="hover:text-[var(--color-text)] transition-colors">使い方ガイド</Link>
          <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
          <Link href="/terms" className="hover:text-[var(--color-text)] transition-colors">利用規約</Link>
          <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
          <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">プライバシー</Link>
        </div>
        <div className="flex flex-col items-center gap-2 mt-2">
          <a href="mailto:support@anshin-kids.app?subject=お問い合わせ" className="hover:text-[var(--color-text)] transition-colors">運営・フィードバック</a>
          <a href="mailto:partner@anshin-kids.app?subject=活動へのご協賛・サポートについて" className="hover:text-[var(--color-text)] transition-colors">医療提携・NPO/企業スポンサーシップ</a>
        </div>
      </div>
    </div>
  );
}
