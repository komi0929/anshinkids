"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Heart, BookOpen, ArrowLeft, Check, TrendingUp, Sparkles } from "@/components/icons";
import { motion } from "framer-motion";

interface ProfileStats {
 total_contributions: number;
 total_thanks_received: number;
 trust_score: number;
}

interface ImpactData {
 articlesHelped: number;
 thanks: number;
 trustScore: number;
 recentImpacts?: {
 title: string;
 slug: string;
 category: string;
 snippet: string;
 trustScore: number;
 extractedAt: string;
 }[];
}

interface StreakData {
 currentStreak: number;
 longestStreak: number;
 totalDays: number;
}

interface Contribution {
 id: string;
 original_message_snippet: string;
 extracted_at: string;
 wiki_entries?: { title: string; slug: string; category: string };
}

export default function NotificationsClient({
 profile,
 impact,
 streak,
 contributions,
}: {
 profile: ProfileStats | null;
 impact: ImpactData | null;
 streak: StreakData | null;
 contributions: Contribution[];
}) {
 const [activeTab, setActiveTab] = useState<"activity" | "contributions">("activity");

 const hasAnyActivity = (profile && (profile.total_contributions > 0 || profile.total_thanks_received > 0)) ||
 (impact && impact.articlesHelped > 0) ||
 contributions.length > 0;

 return (
 <div className="fade-in pb-4">
 {/* Header */}
 <div className="px-5 py-4 flex items-center gap-3 bg-[var(--color-bg)] sticky top-0 z-40">
 <Link href="/mypage" className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-[1.5px] border-[var(--color-border)] hover: transition-all active:scale-95">
 <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
 </Link>
 <div className="flex items-center gap-2">
 <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-glow">
 <Bell className="w-5 h-5 text-white" />
 </div>
 <h1 className="text-[15px] font-bold text-[var(--color-text)]">通知・活動履歴</h1>
 </div>
 </div>

 {/* Tabs */}
 <div className="px-5 pt-2 pb-4 flex gap-3">
 <button
 onClick={() => setActiveTab("activity")}
 className={`flex-1 py-3 rounded-full text-[14px] font-black transition-all ${
 activeTab === "activity"
 ? "bg-[var(--color-text)] text-white "
 : "bg-white text-[var(--color-subtle)] hover:"
 }`}
 >
 あなたの活動
 </button>
 <button
 onClick={() => setActiveTab("contributions")}
 className={`flex-1 py-3 rounded-full text-[14px] font-black transition-all ${
 activeTab === "contributions"
 ? "bg-[var(--color-text)] text-white "
 : "bg-white text-[var(--color-subtle)] hover:"
 }`}
 >
 まとめ記事への貢献
 </button>
 </div>

 {/* ─── Tab: Activity ──────────────────────────────────── */}
 {activeTab === "activity" && (
 <div className="px-4 py-3 space-y-4">
 {/* Stats Cards */}
 {profile && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="grid grid-cols-3 gap-3"
 >
 <div className="bg-white rounded-2xl p-5 text-center border-[1.5px] border-[var(--color-border)]">
 <BookOpen className="w-5 h-5 text-[var(--color-subtle)] mx-auto mb-2 opacity-50" />
 <div className="text-[24px] font-black text-[var(--color-text)] leading-none">{profile.total_contributions}</div>
 <div className="text-[10px] font-extrabold text-[var(--color-subtle)] mt-1.5 leading-tight">発言回数</div>
 </div>
 <div className="bg-white rounded-2xl p-5 text-center border-[1.5px] border-[var(--color-border)]">
 <Heart className="w-5 h-5 text-rose-400 mx-auto mb-2" />
 <div className="text-[24px] font-black text-rose-500 leading-none">{profile.total_thanks_received}</div>
 <div className="text-[10px] font-extrabold text-[var(--color-subtle)] mt-1.5 leading-tight">いいね</div>
 </div>
 <div className="bg-white rounded-2xl p-5 text-center border-[1.5px] border-[var(--color-border)]">
 <TrendingUp className="w-5 h-5 text-[var(--color-primary)] mx-auto mb-2" />
 <div className="text-[24px] font-black text-[var(--color-primary-dark)] leading-none">{impact?.articlesHelped || 0}</div>
 <div className="text-[10px] font-extrabold text-[var(--color-subtle)] mt-1.5 leading-tight">記事へ採用</div>
 </div>
 </motion.div>
 )}

 {/* Streak */}
 {streak && streak.totalDays > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.05 }}
 className="p-5 rounded-2xl bg-white border-[1.5px] border-[var(--color-border)]"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-xl ">🔥</div>
 <div className="flex-1">
 <p className="text-[13px] font-black text-[var(--color-secondary)]">
 {streak.currentStreak > 0 ? `${streak.currentStreak}日連続で参加中！` : `通算${streak.totalDays}日参加`}
 </p>
 <p className="text-[11px] font-bold text-[var(--color-secondary)]/80">
 最長 {streak.longestStreak}日連続アクセス
 </p>
 </div>
 <div className="flex items-end gap-1">
 {Array.from({ length: 7 }).map((_, i) => (
 <div key={i} className={`w-2.5 rounded-full ${i < Math.min(streak.currentStreak, 7) ? "bg-[var(--color-secondary)]" : "bg-[var(--color-secondary)]/10"}`} style={{ height: `${12 + i * 4}px` }} />
 ))}
 </div>
 </div>
 </motion.div>
 )}

 {/* Impact Bento */}
 {impact && (impact.articlesHelped > 0 || impact.thanks > 0) && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 >
 <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-2.5 flex items-center gap-1.5">
 <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
 みんなへのお役立ち
 </h3>
 <div className="grid grid-cols-2 gap-3 mb-4">
 <div className="p-5 rounded-2xl bg-white border-[1.5px] border-[var(--color-border)] flex flex-col justify-between h-28 relative overflow-hidden">
 <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-[var(--color-primary-bg)] rounded-full blur-xl pointer-events-none" />
 <p className="text-[11px] font-black text-[var(--color-subtle)] relative z-10">まとめ記事への採用</p>
 <div className="flex items-end gap-1 relative z-10">
 <span className="text-3xl font-black text-[var(--color-primary-dark)]">{impact.articlesHelped}</span>
 <span className="text-[11px] font-bold text-[var(--color-primary)] mb-1">件</span>
 </div>
 </div>
 <div className="p-5 rounded-2xl bg-white border-[1.5px] border-[var(--color-border)] flex flex-col justify-between h-28 relative overflow-hidden">
 <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-rose-100/50 rounded-full blur-xl pointer-events-none" />
 <p className="text-[11px] font-black text-[var(--color-subtle)] relative z-10">助かった親御さん</p>
 <div className="flex items-end gap-1 relative z-10">
 <span className="text-3xl font-black text-rose-500">{impact.thanks}</span>
 <span className="text-[11px] font-bold text-rose-400 mb-1">人</span>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {/* Recent impacts */}
 {impact?.recentImpacts && impact.recentImpacts.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.15 }}
 className="space-y-2.5"
 >
 {impact.recentImpacts.map((imp, idx) => (
 <Link
 key={idx}
 href={`/wiki/${imp.slug}`}
 className="block p-5 rounded-2xl bg-white hover: transition-all border-[1.5px] border-[var(--color-border)] group"
 >
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-full bg-[var(--color-primary-bg)] flex items-center justify-center flex-shrink-0 ">
 <BookOpen className="w-5 h-5 text-[var(--color-primary-dark)]" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[11px] text-[var(--color-primary-dark)] font-black mb-1 flex items-center gap-1">
 <Check className="w-3.5 h-3.5" /> まとめ記事に採用
 </p>
 <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1.5 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
 {imp.title}
 </h4>
 <p className="text-[12px] font-medium text-[var(--color-subtle)] line-clamp-1">
 あなたの体験: 「{imp.snippet.length > 30 ? imp.snippet.slice(0, 30) + "..." : imp.snippet}」
 </p>
 </div>
 </div>
 </Link>
 ))}
 </motion.div>
 )}

 {/* Empty state */}
 <div className="text-center py-12 bg-white rounded-2xl border-[1.5px] border-[var(--color-border)]">
 <div className="w-16 h-16 rounded-full bg-[var(--color-bg)] flex items-center justify-center mx-auto mb-4 ">
 <span className="text-2xl">🌱</span>
 </div>
 <p className="text-[15px] font-black text-[var(--color-text)] mb-2">まだ活動はありません</p>
 <p className="text-[13px] font-medium text-[var(--color-subtle)] leading-relaxed mb-6">
 トークルームで体験を共有すると、<br/>ここにあなたの活動が表示されます。
 </p>
 <Link href="/talk" className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-[var(--color-primary)] text-white text-[14px] font-black shadow-glow hover:scale-[1.02] active:scale-95 duration-200 transition-transform">
 💬 トークルームへ行く
 </Link>
 </div>
 </div>
 )}

 {/* ─── Tab: Contributions ─────────────────────────────── */}
 {activeTab === "contributions" && (
 <div className="px-4 py-3 space-y-3">
 {contributions.length === 0 ? (
 <div className="text-center py-12 bg-white rounded-2xl border-[1.5px] border-[var(--color-border)]">
 <div className="w-16 h-16 rounded-full bg-[var(--color-bg)] flex items-center justify-center mx-auto mb-4 ">
 <Sparkles className="w-7 h-7 text-[var(--color-subtle)]" />
 </div>
 <p className="text-[15px] text-[var(--color-text)] mb-2 font-black break-keep text-balance">
 まだまとめ記事に採用された発言はありません
 </p>
 <p className="text-[13px] font-medium text-[var(--color-subtle)] leading-relaxed mb-6 break-keep text-balance">
 トークルームで話題に参加すると、<br/>AIが知見を抽出し、まとめ記事へと進化させます。
 </p>
 <Link href="/talk" className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-[var(--color-primary)] text-white text-[14px] font-black shadow-glow hover:scale-[1.02] active:scale-95 duration-200 transition-transform">
 💬 トークルームへ行く
 </Link>
 </div>
 ) : (
 <>
 <p className="text-[12px] text-[var(--color-text-secondary)] font-medium leading-relaxed">
 あなたの投稿がAIに採用され、みんなの役に立つまとめ記事になりました。
 </p>
 {contributions.map((contrib) => (
 <motion.div
 key={contrib.id}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <Link
 href={contrib.wiki_entries ? `/wiki/${contrib.wiki_entries.slug}` : "/wiki"}
 className="block p-5 rounded-2xl bg-white hover: transition-all border-[1.5px] border-[var(--color-border)] group"
 >
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-full bg-[var(--color-primary-bg)] flex items-center justify-center flex-shrink-0 ">
 <span className="text-xl">🌱</span>
 </div>
 <div className="flex-1 min-w-0">
 {contrib.wiki_entries && (
 <h4 className="font-extrabold text-[14px] text-[var(--color-text)] break-keep text-balance line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
 {contrib.wiki_entries.title.replace("【みんなの知恵袋】", "").trim()}
 </h4>
 )}
 <p className="text-[12px] text-[var(--color-subtle)] font-medium mt-1 line-clamp-1">
 あなたの体験: 「{contrib.original_message_snippet}」
 </p>
 <span className="text-[10px] text-[var(--color-muted)] font-bold mt-1.5 inline-block">
 {new Date(contrib.extracted_at).toLocaleDateString("ja-JP")}に反映
 </span>
 </div>
 </div>
 </Link>
 </motion.div>
 ))}
 </>
 )}
 </div>
 )}
 </div>
 );
}
