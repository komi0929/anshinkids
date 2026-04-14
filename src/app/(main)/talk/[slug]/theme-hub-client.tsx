"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { createTopic } from "@/app/actions/messages";
import { checkSimilarTopicWithAI, SimilarTopicResult } from "@/app/actions/topic-similarity";
import { TopicSummary } from "@/app/actions/topic-summary";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Plus, Search } from "@/components/icons";
import { Haptics } from "@/lib/haptics";
import { AudioHaptics } from "@/lib/audio-haptics";
import { motion, AnimatePresence } from "framer-motion";
import TopicBookmarkButton from "@/components/topic-bookmark-button";
import { Filter, ArrowUpDown } from "@/components/icons";
import { ThemeSummaryRenderer } from "@/components/theme-summary-renderer";
import { THEMES } from "@/lib/themes";

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
  userAllergens,
  userAgeGroups,
  userInterests,
  imageGallery = [],
}: {
  slug: string;
  roomInfo: RoomInfo;
  initialTopics: Topic[];
  initialSummaries: Record<string, TopicSummary>;
  suggestedPrompts: string[];
  userAllergens?: string[];
  userAgeGroups?: string[];
  userInterests?: string[];
  imageGallery?: string[];
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
  const [similarTopicResult, setSimilarTopicResult] = useState<SimilarTopicResult | null>(null);
  
  // Hydrated personalization state
  const [hydratedAllergens, setHydratedAllergens] = useState<string[]>(userAllergens || []);
  const [hydratedAgeGroups, setHydratedAgeGroups] = useState<string[]>(userAgeGroups || []);
  const [hydratedInterests, setHydratedInterests] = useState<string[]>(userInterests || []);
  
  const router = useRouter();

  // Asynchronous User Profile Hydration for 0ms transitions
  useEffect(() => {
    if (!userAllergens?.length && !userAgeGroups?.length) {
      import("@/app/actions/mypage").then(m => m.getMyProfile()).then(res => {
         if (res.success && res.data) {
           const profile = res.data;
           setHydratedAllergens(profile.allergen_tags || []);
           const childrenProfile = profile.children_profiles as any[];
           if (childrenProfile && Array.isArray(childrenProfile)) {
             setHydratedAgeGroups(Array.from(new Set(childrenProfile.map(c => c.ageGroup).filter(Boolean))) as string[]);
           }
           if (profile.interests && Array.isArray(profile.interests)) {
             setHydratedInterests(profile.interests);
           }
         }
      });
    }
  }, [userAllergens, userAgeGroups]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    if (topic) {
      setNewTopicTitle(topic);
      setShowCreateForm(true);
    }
  }, []);

  const handleCreateTopic = async (e?: React.FormEvent, forceCreate: boolean = false) => {
    if (e) e.preventDefault();
    if (!newTopicTitle.trim() || !roomInfo?.id || isCreating || isPending) return;
    setIsCreating(true);

    if (!forceCreate) {
      const aiResult = await checkSimilarTopicWithAI(roomInfo.id, newTopicTitle.trim());
      if (aiResult.similarFound) {
        setSimilarTopicResult(aiResult);
        setIsCreating(false);
        Haptics.error();
        return; // Halt and show modal
      }
    }

    setSimilarTopicResult(null);
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

  if (filterPersonalized && (hydratedAllergens.length || hydratedAgeGroups.length || hydratedInterests.length)) {
    // Decode age and interest contextual keywords
    const keywords: string[] = [];
    if (hydratedAgeGroups.length > 0) {
      if (hydratedAgeGroups.includes("0-1")) keywords.push("離乳食", "赤ちゃん", "ベビー", "ミルク", "初めて", "授乳");
      if (hydratedAgeGroups.includes("1-3")) keywords.push("幼児", "保育園", "1歳", "2歳", "3歳", "おやつ", "イヤイヤ");
      if (hydratedAgeGroups.includes("3-6")) keywords.push("幼稚園", "こども園", "給食", "お弁当", "先生", "遠足");
      if (hydratedAgeGroups.includes("6-12")) keywords.push("小学生", "学童", "入学", "学校", "宿泊", "ランドセル");
    }
    if (hydratedInterests.length > 0) {
      if (hydratedInterests.includes("shopping")) keywords.push("市販品", "スーパー", "商品", "おやつ");
      if (hydratedInterests.includes("eating-out")) keywords.push("外食", "レストラン", "チェーン", "メニュー");
      if (hydratedInterests.includes("medical")) keywords.push("病院", "治療", "負荷試験", "血液検査", "主治医");
      if (hydratedInterests.includes("daily-food")) keywords.push("献立", "レシピ", "代替", "代用", "ごはん");
      if (hydratedInterests.includes("school-life")) keywords.push("保育園", "幼稚園", "学校", "給食", "先生", "面談");
      if (hydratedInterests.includes("concern")) keywords.push("悩み", "相談", "共感", "不安");
    }

    displayTopics = displayTopics.filter(t => {
      const summary = summaries[t.id];
      if (!summary) return false;
      
      // 1. Check allergens first
      const hasAllergenMatch = hydratedAllergens.length > 0 && summary.allergen_tags && 
        (Array.isArray(summary.allergen_tags) ? summary.allergen_tags : [summary.allergen_tags])
        .some(tag => hydratedAllergens.includes(tag as string));
        
      if (hasAllergenMatch) return true;
      
      // 2. Check keywords against summary_snippet if no allergen match
      if (keywords.length > 0) {
         const snippet = summary.summary_snippet || "";
         return keywords.some(kw => snippet.includes(kw));
      }
      
      return false;
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
      <div className="px-4 py-3 flex items-center gap-3 bg-[var(--color-bg)]/80 backdrop-blur-md sticky top-0 z-40">
        <Link
          href="/talk"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-[var(--color-border-light)] hover:shadow-sm transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary-bg)] flex items-center justify-center text-[24px] shadow-sm">
            {roomInfo?.icon_emoji || "💬"}
          </div>
          <div>
            <h1 className="text-[16px] font-extrabold text-[var(--color-text)] break-keep text-balance leading-tight">
              {roomInfo?.name || ""}
            </h1>
            <p className="text-[12px] font-bold mt-0.5 text-[var(--color-subtle)]">
              {topics.length}件のトピック
            </p>
          </div>
        </div>
      </div>

      {/* Image Gallery (Bento Style) */}
      {imageGallery && imageGallery.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm bg-[var(--color-surface-soft)] px-1.5 py-0.5 rounded border border-[var(--color-border-light)]">📸</span>
            <h2 className="text-[15px] font-extrabold text-[var(--color-text)]">みんなのおすすめ</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x -mx-4 px-4 scrollbar-hide">
             {imageGallery.map((img, idx) => (
                <div key={idx} className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm border border-[var(--color-border-light)] snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`gallery-${idx}`} className="w-full h-full object-cover bg-[var(--color-surface-soft)]" />
                </div>
             ))}
          </div>
        </div>
      )}

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
                className="w-full pl-10 pr-4 py-4 rounded-full bg-white text-[14px] font-bold text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all shadow-sm border border-[var(--color-border-light)]"
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
              
              {(hydratedAllergens.length || hydratedAgeGroups.length || hydratedInterests.length) ? (
                <button
                  onClick={() => setFilterPersonalized(!filterPersonalized)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all ${
                    filterPersonalized 
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm" 
                      : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  自分に関係のある話題
                </button>
              ) : null}
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
                    className="text-left px-5 py-4 rounded-2xl bg-white shadow-sm border border-[var(--color-border-light)] hover:shadow-sm transition-all flex items-center justify-between group w-full"
                  >
                    <span className="text-[14px] font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors pr-2 break-keep text-balance line-clamp-1">
                      {prompt}
                    </span>
                    <span className="text-[11px] bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex-shrink-0">
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
                        className="p-5 rounded-2xl bg-white shadow-sm border border-[var(--color-border-light)] transition-all group relative overflow-hidden"
                       >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-[16px] font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary-dark)] transition-colors break-keep text-balance leading-snug pr-2">
                            {topic.title}
                          </h3>
                          <div className="relative z-20 flex-shrink-0">
                            <TopicBookmarkButton summaryId={topic.id} snippetTitle={topic.title} snippetContent={summary?.summary_snippet || ""} />
                          </div>
                        </div>
                        {summary?.summary_snippet && (
                          <p className="text-[14px] text-[var(--color-text-secondary)] font-medium leading-relaxed mt-2 mb-3 bg-[var(--color-bg)] rounded-xl px-4 py-3 ">
                            {summary.summary_snippet}
                          </p>
                        )}
                        
                        {/* ThemeSummaryRenderer passing roomSlug and topicId */}
                        {summary && summary.full_summary && (
                          <div className="mt-3 relative z-10" onClick={(e) => {
                            // Prevent navigation if clicking on badge
                            if ((e.target as HTMLElement).closest('a')) e.stopPropagation();
                          }}>
                             <ThemeSummaryRenderer theme={THEMES.find(t => t.slug === slug) || THEMES[0]} topicSummary={summary} roomSlug={slug} topicId={topic.id} />
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--color-muted)] mt-2">
                          <span className="flex items-center gap-1 bg-[var(--color-bg)] px-2.5 py-1 rounded-md">
                            <MessageCircle className="w-4 h-4" />
                            {topic.message_count}声
                          </span>
                          {summary?.allergen_tags && Array.isArray(summary.allergen_tags) && summary.allergen_tags.length > 0 && (
                            <span className="flex items-center gap-1 bg-[var(--color-primary-bg)] text-[var(--color-primary-dark)] px-2.5 py-1 rounded-md">
                              {summary.allergen_tags.slice(0, 3).join("・")}
                            </span>
                          )}
                          <span className="ml-auto font-medium">{timeAgo(topic.updated_at)}</span>
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
                      <span className="text-sm bg-[var(--color-surface-soft)] px-2 py-0.5 rounded-lg border border-[var(--color-border-light)] font-bold">
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
                      className="p-5 rounded-2xl bg-white shadow-sm border border-[var(--color-border-light)] hover:shadow-sm transition-all group"
                     >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-2 break-keep text-balance leading-snug">
                            {topic.title}
                          </h3>
                          {topic.last_message_preview && (
                            <p className="text-[13px] font-medium text-[var(--color-subtle)] truncate mb-3 leading-relaxed">
                              {topic.last_message_preview}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[12px] font-bold text-[var(--color-muted)]">
                            <span className="flex items-center gap-1 bg-[var(--color-bg)] px-2.5 py-1 rounded-md">
                              <MessageCircle className="w-4 h-4" />
                              {topic.message_count}声
                            </span>
                            <span>{timeAgo(topic.updated_at)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-bg)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors mt-1">
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
              <span className="text-xl bg-white shadow-sm border border-[var(--color-border-light)] px-2 py-1.5 rounded-full">✏️</span>
              <h2 className="text-[16px] font-extrabold text-[var(--color-text)]">話題をつくる</h2>
            </div>

            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full p-5 rounded-2xl bg-white border border-transparent shadow-sm border border-[var(--color-border-light)] hover:shadow-sm text-[14px] font-extrabold text-[var(--color-subtle)] hover:text-[var(--color-primary-dark)] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                自分で話題を作成する
              </button>
            ) : (
              <div className="p-5 rounded-2xl bg-white shadow-sm slide-up">
                <form onSubmit={handleCreateTopic} className="space-y-4">
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="例：おすすめの米粉パン教えて！"
                    maxLength={100}
                    className="w-full px-5 py-4 rounded-full bg-[var(--color-bg)] text-[14px] font-bold text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all"
                    autoFocus
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowCreateForm(false); setNewTopicTitle(""); }}
                      className="px-5 py-3 text-[14px] font-bold text-[var(--color-subtle)]"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={!newTopicTitle.trim() || isCreating}
                      className="px-6 py-3 rounded-full bg-[var(--color-primary)] text-white text-[14px] font-black shadow-glow disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
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

      {/* AI Similarity Feedback Modal */}
      <AnimatePresence>
        {similarTopicResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-end bg-[var(--color-text)]/40 backdrop-blur-[2px]"
          >
            <div className="absolute inset-0" onClick={() => setSimilarTopicResult(null)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-[32px] p-6 pb-safe flex flex-col gap-5 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] max-w-2xl mx-auto w-full"
              style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            >
              <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto self-center mb-1" />
              
              <div className="text-center space-y-2">
                <span className="text-[36px] drop-shadow-sm block mb-1">💡</span>
                <h3 className="text-[18px] font-black text-[var(--color-text)] tracking-tight">似たニュアンスの話題があります</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[90%] mx-auto whitespace-pre-wrap">
                  {similarTopicResult.reason}
                </p>
              </div>

              <div className="bg-[var(--color-surface-soft)] border border-[var(--color-primary)]/15 p-4 rounded-2xl relative overflow-hidden mt-2">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent rounded-full -mr-10 -mt-10 blur-xl" />
                <p className="text-[11px] font-bold text-[var(--color-primary)] mb-1.5">見つかった既存の募集部屋</p>
                <div className="text-[15px] font-bold text-[var(--color-text)] leading-snug drop-shadow-sm min-h-[1.5em]">
                  {similarTopicResult.topicTitle}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                <Link
                  href={`/talk/${slug}/${similarTopicResult.topicId}`}
                  onClick={() => {
                    Haptics.success();
                    AudioHaptics.playPop();
                  }}
                  className="w-full h-14 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] shadow-[0_8px_20px_-8px_var(--color-primary)] active:scale-95 transition-transform"
                >
                  そちらの話題に参加する
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    AudioHaptics.playTink();
                    handleCreateTopic(undefined, true);
                  }}
                  className="w-full h-[48px] flex items-center justify-center rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-border-light)] text-[var(--color-text-secondary)] font-bold text-[14px] active:scale-[0.98] transition-transform"
                >
                  構わず新しく話題をつくる
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
