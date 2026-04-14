import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";
import Image from "next/image";
import { Check, Shield, ChevronRight, BookOpen, TrendingUp } from "@/components/icons";

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
 { title: "全自動の匿名化", desc: "本名やLINEアイコンは出ません。システムが安全に匿名であつかいます。" },
 { title: "自律クリーンナップ", desc: "古い会話は自動で消去され、いつでもタイムラインは最新で綺麗に保たれます。" },
 { title: "透明なAI情報管理", desc: "AIのアドバイスには、必ず「保護者の一次情報」のソース数を表示して信頼度を明かします。" },
 { title: "プライバシー最優先設計", desc: "LINEの友だち情報はシステムが取得しません。いつでも1タップで退会可能です。" },
];

/* LINE official SVG icon */
function LineIcon({ className }: { className?: string }) {
 return (
 <svg role="img" viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" className={className}>
 <path
 d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.348 0 .63.285.63.63v3.51h1.753c.348 0 .628.283.628.63 0 .344-.28.629-.628.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
 fill="currentColor"
 />
 </svg>
 );
}

export default function AboutPage() {
 return (
 <div className="fade-in pb-24 min-h-[100dvh] bg-white max-w-md mx-auto relative">
 {/* Header */}
 <div className="sticky top-0 z-40 px-5 py-4 flex items-center justify-between border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md ">
 <BackButton />
 <h1 className="text-[17px] font-extrabold tracking-tight text-[var(--color-text)]">
 あんしんキッズとは
 </h1>
 <div className="w-10 h-10" /> {/* Spacer for centering */}
 </div>

 {/* Hero Section */}
 <div className="px-6 pt-12 pb-10 text-center">
 <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white flex items-center justify-center shadow-xl overflow-hidden border-[1.5px] border-[var(--color-border)] transform transition-transform hover:scale-105">
 <Image src="/logo.png" alt="あんしんキッズ ロゴ" width={80} height={80} className="w-full h-full object-cover" />
 </div>
 <h2 className="text-[24px] font-extrabold leading-tight tracking-tight text-[var(--color-text)] mb-4">
 みんなの日常が、<br />
 やさしい知識になる。
 </h2>
 <p className="text-[14px] font-medium leading-[1.9] text-[var(--color-text-secondary)] max-w-sm mx-auto">
 「あんしんキッズ」は、食物アレルギーっ子をもつママ・パパの<strong>リアルな体験と知恵をAIで結晶化</strong>する、新しい『知識のコミュニティ』です。
 </p>
 </div>

 {/* Core Mission Bento Card */}
 <div className="px-5 mb-10">
 <div className="rounded-2xl p-8 text-center bg-gradient-to-br from-[var(--color-surface-soft)] to-[var(--color-primary-bg)] border-[1.5px] border-[var(--color-border)] relative overflow-hidden group">
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
 <div key={step.num} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-[1.5px] border-[var(--color-border)] hover: hover:border-[var(--color-primary)]/30 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-soft)] group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[var(--color-primary)]/10 group-hover:to-[var(--color-success)]/10 flex items-center justify-center flex-shrink-0 transition-all font-black text-[22px]">
 {step.icon}
 </div>
 <div>
 <div className="text-[11px] font-extrabold text-[var(--color-primary)] mb-0.5">STEP {step.num}</div>
 <h4 className="text-[17px] font-extrabold text-[var(--color-text)]">
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
 <div key={title} className="bg-[var(--color-surface-soft)] rounded-xl p-5 border-[1.5px] border-[var(--color-border)]">
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
 <h3 className="text-[20px] font-extrabold text-center mb-6 text-[var(--color-text)]">
 さっそく始めましょう！
 </h3>
 
 <div className="space-y-3 max-w-[320px] mx-auto">
 <Link href="/talk" className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-[var(--color-surface-soft)] text-[var(--color-text)] font-extrabold text-[15px] border-[1.5px] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-white transition-all transform active:scale-95 group">
 <BookOpen className="w-5 h-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" /> 
 みんなのまとめ記事を読む
 </Link>
 <Link href="/talk" className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-[var(--color-surface-soft)] text-[var(--color-text)] font-extrabold text-[15px] border-[1.5px] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-white transition-all transform active:scale-95 group">
 <TrendingUp className="w-5 h-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" /> 
 話題のトークルームを見る
 </Link>
 
 <div className="h-4" />
 
 <Link href="/login" className="w-full text-center flex items-center justify-center gap-3 py-4 rounded-3xl font-bold text-[15px] text-white active:scale-95 transition-all hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
 <LineIcon className="text-white" />
 LINEで参加する（無料）
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
 <span className="inline-block px-3 py-1 mb-3 rounded-full bg-[var(--color-surface-soft)] text-[10px] font-black tracking-wider text-[var(--color-subtle)] uppercase">Open Source Project</span>
 <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-2">
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
 <Link href="/support" className="hover:text-[var(--color-text)] transition-colors">お問い合わせ・サポート</Link>
 </div>
 </div>
 </div>
 );
}
