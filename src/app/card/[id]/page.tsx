import { getPublicAllergyCard } from "@/app/actions/mypage";
import { Leaf, ShieldCheck, ArrowRight } from "@/components/icons";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
 return {
 title: "デジタルお守りカード | あんしんキッズ",
 description: "アレルギー情報がまとまったデジタルお守りカードです。",
 };
}

export default async function AmuletCardPage({ params }: { params: Promise<{ id: string }> }) {
 const resolvedParams = await params;
 const result = await getPublicAllergyCard(resolvedParams.id);

 if (!result.success || !result.data) {
 return (
 <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--color-bg)] p-6">
 <ShieldCheck className="w-12 h-12 text-[var(--color-muted)] mb-4" />
 <p className="text-[14px] font-bold text-[var(--color-text)]">カードが見つかりません</p>
 <Link href="/" className="mt-4 btn-primary !bg-white !text-[var(--color-text)] ">
 ホームへ戻る
 </Link>
 </div>
 );
 }

 const profile = result.data;
 // Use new children_profiles or fallback to legacy allergen_tags
 const children = Array.isArray(profile.children_profiles) && profile.children_profiles.length > 0
 ? profile.children_profiles
 : [
 {
 name: "お子様",
 allergens: profile.allergen_tags || [],
 }
 ];

 return (
 <div className="min-h-[100dvh] bg-[var(--color-bg)] flex flex-col items-center pb-20 pt-8 sm:pt-16">
 
 {/* Wallet Pass Style Card */}
 <div className="w-full max-w-[360px] relative px-4 fade-in">
 <div className="rounded-2xl bg-[var(--color-surface)] border-[1.5px] border-[var(--color-border)] overflow-hidden">
 
 {/* Card Header */}
 <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success-deep)] p-6 text-white relative flex flex-col items-center">
 {/* Absolute visual noise/texture for wallet card feel */}
 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "12px 12px" }}></div>
 
 <Leaf className="w-10 h-10 mb-2 relative z-10" />
 <h1 className="text-[22px] font-extrabold tracking-tight relative z-10 mb-1 break-keep text-balance">お守りカード</h1>
 <p className="text-[11px] font-bold opacity-80 relative z-10 tracking-widest uppercase">Anshin Kids Amulet</p>
 </div>

 <div className="px-6 py-8">
 <h2 className="text-[12px] font-bold text-[var(--color-subtle)] mb-4 flex items-center justify-center gap-1.5 line-before-after break-keep text-balance">
 <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" /> 除去が必要な食品
 </h2>

 {/* List children and their allergens */}
 <div className="space-y-6">
 {children.map((child: { name?: string; allergens?: string[]; customAllergens?: string[] }, idx: number) => {
 const combinedAllergens = [
 ...(child.allergens || []),
 ...(child.customAllergens || []),
 ].filter(Boolean);

 return (
 <div key={idx} className="bg-[var(--color-surface-soft)] rounded-2xl p-4 text-center">
 <div className="text-[14px] font-extrabold text-[var(--color-text)] mb-3">
 {child.name || `お子様 ${idx + 1}`}
 </div>
 {combinedAllergens.length > 0 ? (
 <div className="flex flex-wrap gap-2 justify-center">
 {combinedAllergens.map((a: string) => (
 <span
 key={a}
 className="bg-[var(--color-danger-light)]00 text-red-700 font-extrabold text-[15px] px-3 py-1.5 rounded-lg border border-[var(--color-danger)]/30 "
 >
 {a}
 </span>
 ))}
 </div>
 ) : (
 <p className="text-[12px] font-medium text-[var(--color-success)] bg-[var(--color-success-light)] inline-block px-3 py-1 rounded-md">
 登録されているアレルゲンはありません
 </p>
 )}
 </div>
 );
 })}
 </div>

 <div className="mt-8 flex gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex-wrap">
 <span className="text-xl shrink-0 mt-0.5">ℹ️</span>
 <p className="text-[11px] text-blue-800 leading-relaxed font-medium flex-1 min-w-[200px]">
 微量な混入（コンタミネーション）の可否など、詳しい対応についてはご家族へ直接ご相談をお願いいたします。
 </p>
 </div>
 </div>
 
 {/* Perforated bottom / Ticket cut */}
 <div className="h-6 bg-[var(--color-surface-soft)] relative overflow-hidden border-t border-[var(--color-border-light)]">
 <div className="absolute top-[-8px] left-[-8px] w-4 h-4 bg-[var(--color-bg)] rounded-full"></div>
 <div className="absolute top-[-8px] right-[-8px] w-4 h-4 bg-[var(--color-bg)] rounded-full"></div>
 <div className="flex justify-center h-full items-center gap-1 opacity-20">
 {Array.from({ length: 20 }).map((_, i) => (
 <div key={i} className="w-1.5 h-0.5 bg-black rounded-full" />
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* 300-point Growth Loop (Non-intrusive utility CTA) */}
 <div className="max-w-[360px] w-full px-5 mt-10 slide-up">
 <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-soft)] p-5 rounded-2xl border-[1.5px] border-[var(--color-border)] ">
 <h2 className="text-[13px] font-extrabold text-[var(--color-text)] mb-2 break-keep text-balance">周りにアレルギーでお悩みの方はいませんか？</h2>
 <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-4">
 このお守りカードは「あんしんキッズ」で作成されました。同じようにアレルギーを持つ親御さんのための、国内最大級の体験ライブラリです。
 </p>
 <Link href="/" className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[var(--color-border)] group hover:border-[var(--color-primary)] transition-all">
 <div className="flex flex-col">
 <span className="text-[12px] font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">みんなのまとめを見てみる</span>
 <span className="text-[10px] text-[var(--color-muted)]">無料で専門知識やみんなの体験を探せます</span>
 </div>
 <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)]/10 flex items-center justify-center shrink-0">
 <ArrowRight className="w-4 h-4 text-[var(--color-primary)] group-hover:translate-x-1 transition-transform" />
 </div>
 </Link>
 </div>
 </div>

 <style dangerouslySetInnerHTML={{
 __html: `
 .line-before-after {
 display: flex;
 align-items: center;
 }
 .line-before-after::before,
 .line-before-after::after {
 content: "";
 flex: 1;
 border-bottom: 1px dashed var(--color-border);
 margin: 0 12px;
 }
 `
 }} />
 </div>
 );
}
