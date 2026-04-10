"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { createTopic } from "@/app/actions/messages";
import { TopicSummary } from "@/app/actions/topic-summary";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Plus, Search } from "@/components/icons";
import { Haptics } from "@/lib/haptics";
import { AudioHaptics } from "@/lib/audio-haptics";
import { motion, AnimatePresence } from "framer-motion";
import TopicBookmarkButton from "@/components/topic-bookmark-button";
import { Filter, ArrowUpDown } from "@/components/icons";

interface RoomInfo {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  slug: string;
}

interface Topic {
  id: string;
  title: string;
  message_count: number;
  last_message_preview: string | null;
  updated_at: string;
  creator_name?: string;
  creator_avatar?: string | null;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export default function ThemeHubClient({
  slug,
  roomInfo,
  initialTopics,
  initialSummaries,
  suggestedPrompts,
}: {
  slug: string;
  roomInfo: RoomInfo;
  initialTopics: Topic[];
  initialSummaries: Record<string, TopicSummary>;
  suggestedPrompts: string[];
  userAllergens?: string[];
  userAgeGroups?: string[];
}) {
  const [topics] = useState<Topic[]>(initialTopics);
  const [summaries] = useState<Record<string, TopicSummary>>(initialSummaries);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"newest" | "active">("newest");
  const [filterPersonalized, setFilterPersonalized] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    if (topic) {
      setNewTopicTitle(topic);
      setShowCreateForm(true);
    }
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !roomInfo?.id || isCreating || isPending) return;
    setIsCreating(true);
    startTransition(async () => {
      const res = await createTopic(roomInfo.id, newTopicTitle.trim());
      if (res.success && res.topicId) {
        Haptics.success();
        AudioHaptics.playPop();
        router.push(`/talk/${slug}/${res.topicId}`);
      } else {
        alert(!res.success && 'error' in res && res.error ? res.error : "トピックの作成に失敗しました");
        setIsCreating(false);
      }
    });
  };

  // Filter and Sort Phase
  let displayTopics = [...topics];

  if (searchQuery) {
    displayTopics = displayTopics.filter(t => {
      const snippet = summaries[t.id]?.summary_snippet || "";
      return t.title.toLowerCase().includes(searchQuery.toLowerCase())
        || snippet.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }

  if (filterPersonalized && userAllergens) {
    displayTopics = displayTopics.filter(t => {
      const summary = summaries[t.id];
      if (!summary || !summary.allergen_tags) return false;
      const tags = Array.isArray(summary.allergen_tags) ? summary.allergen_tags : [summary.allergen_tags];
      return tags.some(tag => userAllergens.includes(tag as string));
    });
  }

  if (sortMode === "active") {
    displayTopics.sort((a, b) => b.message_count - a.message_count);
  } else {
    displayTopics.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  const topicsWithSummary = displayTopics.filter(t => summaries[t.id]);
  const topicsWithoutSummary = displayTopics.filter(t => !summaries[t.id]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--color-bg)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <Link
          href="/talk"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-bg-warm)] flex items-center justify-center text-[22px] shadow-sm border border-[var(--color-border-light)]">
            {roomInfo?.icon_emoji || "💬"}
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[var(--color-text)] break-keep text-balance leading-tight">
              {roomInfo?.name || ""}
            </h1>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--color-subtle)" }}>
              {topics.length}件のトピック
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4 space-y-5 max-w-2xl mx-auto">

          {/* Search, Filter, Sort Controls */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="このテーマ内を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[var(--color-border-light)] text-[14px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSortMode(prev => prev === "newest" ? "active" : "newest")}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all ${
                  sortMode === "active" 
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm" 
                    : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface)]"
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortMode === "newest" ? "最新順" : "注目順"}
              </button>
              
              {userAllergens && userAllergens.length > 0 && (
                <button
                  onClick={() => setFilterPersonalized(!filterPersonalized)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all ${
                    filterPersonalized 
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                      : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  自分に関係のある話題
                </button>
              )}
            </div>
          </div>

          {/* Suggested Prompts */}
          {suggestedPrompts.length > 0 && !searchQuery && (
            <div className="slide-up" style={{ animationDelay: '50ms' }}>
              <p className="text-[11px] font-bold text-[var(--color-subtle)] mb-2 ml-0.5">💡 タップですぐに話題をスタート</p>
              <div className="grid grid-cols-1 gap-2">
                <AnimatePresence>
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={i}
                    type="button"
                    onClick={() => {
                      setNewTopicTitle(prompt);
                      setShowCreateForm(true);
                      setTimeout(() => {
                        document.getElementById("create-topic-section")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="card-elevated text-left px-4 py-3 border border-[var(--color-border-light)] hover:border-[var(--color-primary)] hover:shadow-md transition-all flex items-center justify-between group bg-white w-full"
                  >
                    <span className="text-[13px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors pr-2 break-keep text-balance line-clamp-1">
                      {prompt}
                    </span>
                    <span className="text-[10px] bg-[var(--color-primary)] text-white px-2.5 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex-shrink-0">
                      話す
                    </span>
                  </motion.button>
                ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Topic List */}
          {displayTopics.length === 0 ? (
            <div className="py-8 px-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] text-center">
              {searchQuery ? (
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  「{searchQuery}」に一致するトピックはありません
                </p>
              ) : (
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  まだトピックがありません。上のきっかけをタップするか、下の「話題をつくる」から始めましょう。
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Topics with AI Summary */}
              {topicsWithSummary.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-lg border border-[var(--color-primary)]/20 font-bold">
                      📝
                    </span>
                    <h2 className="text-[13px] font-extrabold text-[var(--color-text)]">まとめあり</h2>
                    <span className="text-[11px] font-bold text-[var(--color-subtle)]">{topicsWithSummary.length}件</span>
                  </div>
                  {topicsWithSummary.map((topic) => {
                    const summary = summaries[topic.id];
                    return (
                      <Link
                        key={topic.id}
                        href={`/talk/${slug}/${topic.id}`}
                        prefetch={true}
                        className="block"
                      >
                       <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all group relative overflow-hidden"
                       >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-[15px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors break-keep text-balance leading-snug pr-2">
                            {topic.title}
                          </h3>
                          <div className="relative z-20 flex-shrink-0">
                            <TopicBookmarkButton summaryId={topic.id} snippetTitle={topic.title} snippetContent={summary?.summary_snippet || ""} />
                          </div>
                        </div>
                        {summary?.summary_snippet && (
                          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 mb-3 bg-[var(--color-surface-warm)] rounded-xl px-3 py-2.5">
                            {summary.summary_snippet}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--color-muted)]">
                          <span className="flex items-center gap-1 bg-[var(--color-surface-warm)] px-2 py-0.5 rounded-md">
                            <MessageCircle className="w-3 h-3" />
                            {topic.message_count}件
                          </span>
                          {summary?.allergen_tags && Array.isArray(summary.allergen_tags) && summary.allergen_tags.length > 0 && (
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                              {summary.allergen_tags.slice(0, 3).join("・")}
                            </span>
                          )}
                          {summary?.allergen_tags && !Array.isArray(summary.allergen_tags) && (
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                              {String(summary.allergen_tags).slice(0, 10)}
                            </span>
                          )}
                          <span className="ml-auto">{timeAgo(topic.updated_at)}</span>
                        </div>
                       </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Topics without AI Summary */}
              {topicsWithoutSummary.length > 0 && (
                <div className="space-y-3">
                  {topicsWithSummary.length > 0 && (
                    <div className="flex items-center gap-2 mb-1 mt-4">
                      <span className="text-sm bg-[var(--color-surface-warm)] px-2 py-0.5 rounded-lg border border-[var(--color-border-light)] font-bold">
                        💬
                      </span>
                      <h2 className="text-[13px] font-extrabold text-[var(--color-text)]">会話中</h2>
                      <span className="text-[11px] font-bold text-[var(--color-subtle)]">{topicsWithoutSummary.length}件</span>
                    </div>
                  )}
                  {topicsWithoutSummary.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/talk/${slug}/${topic.id}`}
                      prefetch={true}
                      className="block"
                    >
                     <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all group"
                     >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-1.5 break-keep text-balance leading-snug">
                            {topic.title}
                          </h3>
                          {topic.last_message_preview && (
                            <p className="text-[12px] text-[var(--color-subtle)] truncate mb-2 leading-relaxed">
                              {topic.last_message_preview}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--color-muted)]">
                            <span className="flex items-center gap-1 bg-[var(--color-surface-warm)] px-2 py-0.5 rounded-md">
                              <MessageCircle className="w-3 h-3" />
                              {topic.message_count}件
                            </span>
                            <span>{timeAgo(topic.updated_at)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors mt-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-muted)] group-hover:text-white transition-colors">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                     </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Topic Section */}
          <div id="create-topic-section">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm bg-[var(--color-surface-warm)] px-1.5 py-0.5 rounded border border-[var(--color-border-light)]">✏️</span>
              <h2 className="text-[15px] font-extrabold text-[var(--color-text)]">話題をつくる</h2>
            </div>

            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] text-[13px] font-bold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                自分で話題を作成する
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-primary)]/20 slide-up">
                <form onSubmit={handleCreateTopic} className="space-y-3">
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="例：おすすめの米粉パン教えて！"
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-[14px] outline-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowCreateForm(false); setNewTopicTitle(""); }}
                      className="px-4 py-2 text-[13px] font-medium text-[var(--color-subtle)]"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={!newTopicTitle.trim() || isCreating}
                      className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-[13px] font-bold disabled:opacity-50 transition-opacity"
                    >
                      {isCreating ? "作成中..." : "作成する"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
