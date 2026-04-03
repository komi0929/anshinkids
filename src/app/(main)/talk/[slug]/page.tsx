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

  useEffect(() => {
    async function init() {
      const result = await getTalkRoomBySlug(slug);
      if (result.success && result.data && result.data.id !== "temp-id") {
        setRoomInfo(result.data as RoomInfo);
        loadTopics(result.data.id);
      } else {
        window.location.href = "/talk";
      }
    }
    init();
  }, [slug]);

  async function loadTopics(roomId: string) {
    setIsLoading(true);
    const res = await getTalkTopics(roomId);
    if (res.success && res.data) {
      setTopics(res.data as Topic[]);
    }
    setIsLoading(false);
  }

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
        <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[var(--color-text)]">
              話題一覧
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--color-primary)] text-white text-[12px] font-bold shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              新しい話題を作る
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
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
                    onClick={() => setShowCreateForm(false)}
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

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer h-24 rounded-2xl" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-[var(--color-primary)]" style={{ opacity: 0.4 }} />
              </div>
              <h3 className="text-[16px] font-bold text-[var(--color-text)] break-keep text-balance px-4">
                まだ話題がありません
              </h3>
              <p className="text-[13px] text-[var(--color-text-secondary)] mt-2 leading-relaxed max-w-[260px]">
                上のボタンから最初の話題を投稿してみませんか？みんなの知恵が集まるきっかけになります
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
      </div>
    </div>
  );
}
