"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTalkRoomBySlug, getTalkTopics, createTopic } from "@/app/actions/messages";
import { ArrowLeft, MessageCircle, Plus, Search } from "@/components/icons";
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
  updated_at: string;
}

export default function TalkThemeHubPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      alert(res.error || "トピックの作成に失敗しました");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/talk" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-bg-warm)] flex items-center justify-center text-lg shadow-sm">
            {roomInfo?.icon_emoji || "💬"}
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[var(--color-text)] break-keep text-balance">
              {roomInfo?.name || ""}
            </h1>
            <p className="text-[12px] font-medium" style={{ color: "var(--color-subtle)" }}>
              トピックを選んで参加しよう
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[var(--color-text)]">話題一覧</h2>
            <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-[12px] font-bold shadow-sm active:scale-95 transition-transform"
            >
                <Plus className="w-4 h-4" />
                新しい話題を作る
            </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
            <div className="p-4 rounded-2xl bg-[var(--color-surface-warm)]/50 border border-[var(--color-primary)]/20 mb-4 slide-down">
                <form onSubmit={handleCreateTopic} className="space-y-3">
                    <input 
                        type="text" 
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="例：おすすめの米粉パン教えて！"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-[14px] outline-none"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-[13px] font-medium text-[var(--color-subtle)]">キャンセル</button>
                        <button type="submit" disabled={!newTopicTitle.trim() || isCreating} className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-[13px] font-bold disabled:opacity-50 transition-opacity">
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
               <div key={i} className="shimmer h-20 rounded-2xl" />
             ))}
           </div>
        ) : topics.length === 0 ? (
            <div className="empty-state py-12 flex flex-col items-center text-center">
                <MessageCircle className="w-12 h-12 text-[var(--color-primary)]/40 mb-3 mx-auto" />
                <h3 className="text-[16px] font-bold text-[var(--color-text)] break-keep text-balance px-4">
                まだ話題がありません
                </h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-3 leading-relaxed max-w-[240px]">
                右上のボタンから最初の話題を投稿してみませんか？
                </p>
            </div>
        ) : (
            <div className="space-y-3">
                {topics.map(topic => (
                    <Link key={topic.id} href={`/talk/${slug}/${topic.id}`} className="block p-4 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow transition-all group">
                        <h3 className="text-[15px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-2 break-keep text-balance">
                            {topic.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--color-subtle)]">
                            <span className="flex items-center gap-1.5 bg-[var(--color-surface-warm)] px-2.5 py-1 rounded-md">
                                <MessageCircle className="w-3.5 h-3.5" />
                                {topic.message_count}件のチャット
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
