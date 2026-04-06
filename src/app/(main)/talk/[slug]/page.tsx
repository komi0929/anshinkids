"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getTalkRoomBySlug,
  getTalkTopics,
  createTopic,
} from "@/app/actions/messages";
import { ArrowLeft, MessageCircle, Plus } from "@/components/icons";
import { Haptics } from "@/lib/haptics";
import { AudioHaptics } from "@/lib/audio-haptics";
import { THEME_PROMPTS } from "@/lib/theme-prompts";

interface RoomInfo {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
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

export default function TalkThemeHubPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const initialTopic = searchParams.get("topic");

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState(initialTopic || "");
  const [showCreateForm, setShowCreateForm] = useState(!!initialTopic);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      const result = await getTalkRoomBySlug(slug);
      if (!result.success || !result.data || result.data.id === "temp-id") {
        window.location.href = "/talk";
        return;
      }
      setRoomInfo(result.data as RoomInfo);

      // Load topics immediately after room info
      setIsLoading(true);
      const res = await getTalkTopics(result.data.id);
      if (res.success && res.data) {
        const allTopics = res.data as Topic[];
        setTopics(allTopics);
        
        const themePrompts = THEME_PROMPTS[slug] || [];
        const nonOverlapping = themePrompts.filter(p => !allTopics.some(t => t.title === p));
        const shuffled = [...nonOverlapping].sort(() => 0.5 - Math.random());
        setSuggestedPrompts(shuffled.slice(0, 3));
      }
      setIsLoading(false);
    }
    init();
  }, [slug]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !roomInfo?.id || isCreating) return;
    setIsCreating(true);
    const res = await createTopic(roomInfo.id, newTopicTitle.trim());
    if (res.success && res.topicId) {
      Haptics.success();
      AudioHaptics.playPop();
      window.location.href = `/talk/${slug}/${res.topicId}`;
    } else {
      alert(!res.success && 'error' in res ? res.error : "トピックの作成に失敗しました");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-bg)]">
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
            <p
              className="text-[11px] font-medium mt-0.5"
              style={{ color: "var(--color-subtle)" }}
            >
              トピックを選んで参加しよう
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5 max-w-2xl mx-auto">

          {/* === セクション1: 話題を選ぶ === */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm bg-[var(--color-surface-warm)] px-1.5 py-0.5 rounded border border-[var(--color-border-light)]">💬</span>
              <h2 className="text-[15px] font-extrabold text-[var(--color-text)]">話題を選ぶ</h2>
            </div>

            {/* きっかけ提案 */}
            {!isLoading && suggestedPrompts.length > 0 && (
              <div className="mb-3 slide-up" style={{ animationDelay: '50ms' }}>
                <p className="text-[11px] font-bold text-[var(--color-subtle)] mb-2 ml-0.5">💡 タップですぐに話題をスタートできます</p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setNewTopicTitle(prompt);
                        setShowCreateForm(true);
                        // Scroll to the create form
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
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* トピック一覧 */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="shimmer h-24 rounded-2xl" />
                ))}
              </div>
            ) : topics.length === 0 ? (
              <div className="py-4 px-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] text-center">
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  まだ話題がありません。上のきっかけをタップするか、下の「話題をつくる」から始めましょう。
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/talk/${slug}/${topic.id}`}
                    className="block p-4 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-5 h-5 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[var(--color-border-light)]">
                             {topic.creator_avatar ? (
                                <img src={topic.creator_avatar} alt="avatar" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500" />
                             )}
                          </div>
                          <span className="text-[11px] font-bold text-[var(--color-subtle)] truncate">
                            {(topic.creator_name && topic.creator_name !== "あんしんユーザー") ? topic.creator_name : "投稿者"}
                          </span>
                        </div>
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors mt-4">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[var(--color-muted)] group-hover:text-white transition-colors"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* === セクション2: 話題をつくる === */}
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
