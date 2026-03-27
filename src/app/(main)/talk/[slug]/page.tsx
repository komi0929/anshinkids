"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Heart } from "lucide-react";
import { getActiveMessages, postMessage, sendThanks, removeThanks } from "@/app/actions/messages";

interface Message {
  id: string;
  content: string;
  is_system_bot: boolean;
  thanks_count: number;
  created_at: string;
  expires_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    trust_score: number;
  };
}

const ROOM_NAMES: Record<string, string> = {
  "egg-challenge": "🥚 卵負荷試験",
  "milk-challenge": "🥛 乳負荷試験",
  "wheat-challenge": "🌾 小麦負荷試験",
  snacks: "🍪 市販品おやつ",
  "eating-out": "🍽️ 外食・チェーン店",
  nursery: "🏫 保育園・幼稚園",
  recipes: "👩‍🍳 代替レシピ",
  skincare: "🧴 スキンケア",
  hospital: "🏥 病院・主治医",
  mental: "💚 メンタルケア",
};

export default function TalkRoomPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [thankedIds, setThankedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomName = ROOM_NAMES[slug] || slug;

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadMessages() {
    // We need the room ID from slug - for demo we'll use the slug directly
    const result = await getActiveMessages(slug);
    if (result.success) {
      setMessages(result.data as Message[]);
    }
    setIsLoading(false);
  }

  async function handleSend() {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);

    const result = await postMessage(slug, newMessage);
    if (result.success) {
      setNewMessage("");
      await loadMessages();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setIsSending(false);
  }

  async function handleThanks(messageId: string) {
    if (thankedIds.has(messageId)) {
      await removeThanks(messageId);
      setThankedIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    } else {
      await sendThanks(messageId);
      setThankedIds((prev) => new Set(prev).add(messageId));
    }
    await loadMessages();
  }

  function getTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    return "1日以上前";
  }

  function getExpiresIn(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / 60000);
    if (hours > 0) return `あと${hours}時間${minutes}分で消えます`;
    if (minutes > 0) return `あと${minutes}分で消えます`;
    return "まもなく消えます";
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="page-header flex items-center gap-3 border-b border-[var(--color-border-light)]">
        <Link
          href="/talk"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">{roomName}</h1>
          <p className="text-[11px] text-[var(--color-subtle)]">
            投稿は24時間でリセットされます
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-20 rounded-xl" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="text-5xl mb-2">🌱</div>
            <h3>まだ投稿がありません</h3>
            <p>
              最初の一歩を踏み出してみませんか？
              あなたの体験が、きっと誰かの力になります。
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="fade-in">
              {msg.is_system_bot ? (
                <div className="chat-bubble system">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-xs">🤖</span>
                    <span className="font-medium text-[11px]">あんしんBot</span>
                  </div>
                  {msg.content}
                </div>
              ) : (
                <div className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center text-sm flex-shrink-0">
                      {msg.profiles?.display_name?.[0] || "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[13px] text-[var(--color-text)]">
                          {msg.profiles?.display_name || "匿名ユーザー"}
                        </span>
                        {msg.profiles?.trust_score && msg.profiles.trust_score > 30 && (
                          <span className="trust-badge trust-high">
                            ✓ 信頼
                          </span>
                        )}
                        <span className="text-[11px] text-[var(--color-subtle)]">
                          {getTimeAgo(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-[var(--color-text)] whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => handleThanks(msg.id)}
                          className={`btn-thanks ${thankedIds.has(msg.id) ? "thanked" : ""}`}
                        >
                          <Heart
                            className="w-3.5 h-3.5"
                            fill={thankedIds.has(msg.id) ? "currentColor" : "none"}
                          />
                          <span>ありがとう</span>
                          {msg.thanks_count > 0 && (
                            <span className="font-medium">{msg.thanks_count}</span>
                          )}
                        </button>
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {getExpiresIn(msg.expires_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-3 items-end max-w-lg mx-auto">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="体験や情報を共有しましょう..."
            className="input-field flex-1 resize-none max-h-32"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="btn-primary !p-3 !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
