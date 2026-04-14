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
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/mypage" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-warm)] flex items-center justify-center shadow-sm">
            <Bell className="w-4 h-4 text-[var(--color-text)]" />
          </div>
          <h1 className="text-[15px] font-bold text-[var(--color-text)]">通知・活動履歴</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-2">
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
            activeTab === "activity"
              ? "bg-[var(--color-text)] text-white shadow-sm"
              : "bg-[var(--color-surface-warm)] text-[var(--color-subtle)] hover:bg-[var(--color-border-light)]"
          }`}
        >
          あなたの活動
        </button>
        <button
          onClick={() => setActiveTab("contributions")}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
            activeTab === "contributions"
              ? "bg-[var(--color-text)] text-white shadow-sm"
              : "bg-[var(--color-surface-warm)] text-[var(--color-subtle)] hover:bg-[var(--color-border-light)]"
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
              className="grid grid-cols-3 gap-2"
            >
              <div className="bg-[var(--color-surface-warm)] rounded-[18px] p-3.5 text-center border border-[var(--color-border-light)]">
                <BookOpen className="w-4 h-4 text-[var(--color-text)] mx-auto mb-1.5 opacity-50" />
                <div className="text-[20px] font-black text-[var(--color-text)] leading-none">{profile.total_contributions}</div>
                <div className="text-[9px] font-bold text-[var(--color-subtle)] mt-1 leading-tight">発言回数</div>
              </div>
              <div className="bg-rose-50/70 rounded-[18px] p-3.5 text-center border border-rose-100">
                <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1.5" />
                <div className="text-[20px] font-black text-rose-600 leading-none">{profile.total_thanks_received}</div>
                <div className="text-[9px] font-bold text-rose-400 mt-1 leading-tight">いいね</div>
              </div>
              <div className="bg-emerald-50/70 rounded-[18px] p-3.5 text-center border border-emerald-100">
                <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
                <div className="text-[20px] font-black text-emerald-600 leading-none">{impact?.articlesHelped || 0}</div>
                <div className="text-[9px] font-bold text-emerald-500 mt-1 leading-tight">記事へ採用</div>
              </div>
            </motion.div>
          )}

          {/* Streak */}
          {streak && streak.totalDays > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-3.5 rounded-[18px] bg-gradient-to-r from-amber-50 to-orange-50 border border-[var(--color-warning)]/30"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔥</span>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-[var(--color-warning)]">
                    {streak.currentStreak > 0 ? `${streak.currentStreak}日連続で遊びにきてるね！` : `通算${streak.totalDays}日参加`}
                  </p>
                  <p className="text-[10px] text-[var(--color-warning)]">
                    最長 {streak.longestStreak}日連続アクセス
                  </p>
                </div>
                <div className="flex items-end gap-px">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className={`w-1.5 rounded-full ${i < Math.min(streak.currentStreak, 7) ? "bg-amber-400" : "bg-amber-200"}`} style={{ height: `${8 + i * 2}px` }} />
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
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="p-3.5 rounded-[18px] bg-gradient-to-br from-[var(--color-surface-warm)] to-green-50 border border-green-100 flex flex-col justify-between h-24 relative overflow-hidden">
                  <div className="absolute -right-1 -bottom-1 text-3xl opacity-10">📖</div>
                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)]">まとめ記事への採用</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-extrabold text-[var(--color-success-deep)]">{impact.articlesHelped}</span>
                    <span className="text-[10px] font-semibold text-[var(--color-success)] mb-0.5">件</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-[18px] bg-gradient-to-br from-[var(--color-surface-warm)] to-pink-50 border border-pink-100 flex flex-col justify-between h-24 relative overflow-hidden">
                  <div className="absolute -right-1 -bottom-1 text-3xl opacity-10">❤️</div>
                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)]">助かった親御さん</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-extrabold text-[var(--color-heart)]">{impact.thanks}</span>
                    <span className="text-[10px] font-semibold text-pink-500 mb-0.5">人</span>
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
                  className="block p-3.5 rounded-[18px] bg-white border border-[var(--color-border-light)] hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[var(--color-primary)] opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[var(--color-success)] font-bold mb-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> まとめ記事に採用
                      </p>
                      <h4 className="text-[13px] font-bold text-[var(--color-text)] mb-1 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                        {imp.title}
                      </h4>
                      <p className="text-[11px] text-[var(--color-subtle)] line-clamp-1">
                        あなたの体験: 「{imp.snippet.length > 30 ? imp.snippet.slice(0, 30) + "..." : imp.snippet}」
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {!hasAnyActivity && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-[20px] bg-[var(--color-surface-warm)] flex items-center justify-center mx-auto mb-3 border border-[var(--color-border-light)]">
                <span className="text-2xl">🌱</span>
              </div>
              <p className="text-[14px] font-bold text-[var(--color-text)] mb-1">まだ活動はありません</p>
              <p className="text-[12px] text-[var(--color-subtle)] leading-relaxed mb-4">
                トークルームで体験を共有すると、<br/>ここにあなたの活動が表示されます。
              </p>
              <Link href="/talk" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-text)] text-white text-[13px] font-bold">
                💬 トークルームへ行く
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Contributions ─────────────────────────────── */}
      {activeTab === "contributions" && (
        <div className="px-4 py-3 space-y-3">
          {contributions.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-[20px] bg-[var(--color-surface-warm)] flex items-center justify-center mx-auto mb-3 border border-[var(--color-border-light)]">
                <Sparkles className="w-6 h-6 text-[var(--color-text-secondary)]" />
              </div>
              <p className="text-[14px] text-[var(--color-text)] mb-1 font-bold break-keep text-balance">
                まだまとめ記事に採用された発言はありません
              </p>
              <p className="text-[12px] text-[var(--color-subtle)] leading-relaxed mb-4 break-keep text-balance">
                トークルームで話題に参加すると、<br/>AIが知見を抽出し、まとめ記事へと進化させます。
              </p>
              <Link href="/talk" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-text)] text-white text-[13px] font-bold">
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
                    className="block p-3.5 rounded-[18px] bg-white border border-[var(--color-border-light)] hover:border-[var(--color-success)]/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-success-light)] to-green-100/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-base">🌱</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {contrib.wiki_entries && (
                          <h4 className="font-bold text-[13px] text-[var(--color-text)] break-keep text-balance line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                            {contrib.wiki_entries.title.replace("【みんなの知恵袋】", "").trim()}
                          </h4>
                        )}
                        <p className="text-[11px] text-[var(--color-subtle)] mt-0.5 line-clamp-1">
                          あなたの体験: 「{contrib.original_message_snippet}」
                        </p>
                        <span className="text-[9px] text-[var(--color-muted)] mt-1 inline-block">
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
