"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Heart, MessageCircle, Sparkles, RefreshCw, BookOpen } from "lucide-react";
import {
  getActiveMessages,
  postMessage,
  sendThanks,
  removeThanks,
  generateRoomPrompts,
  getTalkRoomBySlug,
  getWikiCountForRoom,
} from "@/app/actions/messages";

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

interface RoomInfo {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
}

export default function TalkRoomPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [thankedIds, setThankedIds] = useState<Set<string>>(new Set());
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [wikiCount, setWikiCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadRoom() {
    const result = await getTalkRoomBySlug(slug);
    if (result.success && result.data) {
      const room = result.data as RoomInfo;
      setRoomInfo(room);
      loadMessages(room.id);
      loadPrompts(room.name, room.description);
      loadWikiCount(room.id);

      // Set up polling with room UUID
      const interval = setInterval(() => loadMessages(room.id), 15000);
      return () => clearInterval(interval);
    } else {
      setRoomInfo({ id: "", name: slug, description: "", icon_emoji: "💬" });
      setIsLoading(false);
    }
  }

  async function loadPrompts(name: string, desc: string) {
    setIsLoadingPrompts(true);
    const result = await generateRoomPrompts(name, desc);
    if (result.success && result.data) {
      setPrompts(result.data);
    }
    setIsLoadingPrompts(false);
  }

  async function loadWikiCount(roomId: string) {
    const result = await getWikiCountForRoom(roomId);
    setWikiCount(result.count || 0);
  }

  async function refreshPrompts() {
    if (roomInfo?.name) {
      loadPrompts(roomInfo.name, roomInfo.description);
    }
  }

  async function loadMessages(roomId: string) {
    const result = await getActiveMessages(roomId);
    if (result.success) {
      setMessages(result.data as Message[]);
    }
    setIsLoading(false);
  }

  const [authError, setAuthError] = useState(false);

  async function handleSend(content?: string) {
    const text = content || newMessage;
    if (!text.trim() || isSending || !roomInfo?.id) return;
    setIsSending(true);

    const result = await postMessage(roomInfo.id, text);
    if (result.success) {
      setNewMessage("");
      setAuthError(false);
      await loadMessages(roomInfo.id);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (result.error === "ログインが必要です") {
      setAuthError(true);
    }
    setIsSending(false);
  }

  function handlePromptClick(prompt: string) {
    setNewMessage(prompt);
    const textarea = document.querySelector("textarea");
    textarea?.focus();
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
    if (roomInfo?.id) await loadMessages(roomInfo.id);
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
    if (hours > 0) return `あと${hours}時間${minutes}分`;
    if (minutes > 0) return `あと${minutes}分`;
    return "まもなく消えます";
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]">
        <Link
          href="/talk"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{roomInfo?.icon_emoji || "💬"}</span>
          <div>
            <h1 className="text-[15px] font-bold text-[var(--color-text)]">{roomInfo?.name || ""}</h1>
            <p className="text-[10px] text-[var(--color-subtle)]">
              投稿は24hで消えて、みんなの知恵に変わります
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Wiki Knowledge Banner */}
        {wikiCount > 0 && (
          <Link href="/wiki" className="block mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--color-success-light)]/60 to-[var(--color-surface-warm)] border border-[var(--color-success)]/15 hover:border-[var(--color-success)]/30 transition-colors">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  みんなの会話から <strong className="text-[var(--color-success)]">{wikiCount}件</strong> の知恵が生まれました 📖
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* AI Conversation Starters */}
        {messages.length === 0 && !isLoading && (
          <div className="mb-6">
            {/* Welcome */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-success-light)] flex items-center justify-center mx-auto mb-3 text-2xl">
                {roomInfo?.icon_emoji || "💬"}
              </div>
              <h2 className="text-[15px] font-bold text-[var(--color-text)]">
                「{roomInfo?.name}」について話そう
              </h2>
              <p className="text-[12px] text-[var(--color-subtle)] mt-1">
                AIが話題を用意しました。気になるものをタップ！
              </p>
            </div>

            {/* AI Prompts */}
            <div className="space-y-2">
              {isLoadingPrompts ? (
                <>
                  <div className="shimmer h-12 rounded-xl" />
                  <div className="shimmer h-12 rounded-xl" />
                  <div className="shimmer h-12 rounded-xl" />
                </>
              ) : (
                prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handlePromptClick(prompt)}
                    className="w-full text-left p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-[13px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors leading-snug">
                        {prompt}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {!isLoadingPrompts && (
              <button
                onClick={refreshPrompts}
                className="flex items-center gap-1.5 mx-auto mt-3 text-[11px] text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                別の話題を出す
              </button>
            )}
          </div>
        )}

        {/* Always show prompts at top even when messages exist */}
        {messages.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
              <span className="text-[10px] font-medium text-[var(--color-subtle)]">こんな話題はどう？</span>
              <button
                onClick={refreshPrompts}
                className="ml-auto text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {isLoadingPrompts ? (
                <div className="shimmer h-8 w-40 rounded-full" />
              ) : (
                prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handlePromptClick(prompt)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all whitespace-nowrap"
                  >
                    💬 {prompt.length > 25 ? prompt.slice(0, 25) + "…" : prompt}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-20 rounded-xl" />
            ))}
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

      {/* Auth Error Banner */}
      {authError && (
        <div className="px-4 py-3 bg-[var(--color-warning-light)] border-t border-[var(--color-warning)]/20">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              💬 投稿するにはログインが必要です
            </p>
            <a
              href="/login"
              className="btn-primary !py-1.5 !px-4 !text-[12px] flex-shrink-0"
            >
              ログインする
            </a>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-3 items-end max-w-lg mx-auto">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="体験をざざっと書くだけでOK ✍️"
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
            onClick={() => handleSend()}
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
