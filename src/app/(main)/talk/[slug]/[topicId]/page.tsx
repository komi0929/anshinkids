"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Trash2,
  User,
  Share,
} from "@/components/icons";
import {
  getTopicMessages,
  postTopicMessage,
  deleteMessage,
  sendThanks,
  removeThanks,
  getTalkRoomBySlug,
  getTalkTopicById,
} from "@/app/actions/messages";
import {
  checkContentSafety,
} from "@/lib/ai/safety-guard";
import { Haptics } from "@/lib/haptics";
import { AudioHaptics } from "@/lib/audio-haptics";
import { triggerSensoryBurst } from "@/components/ui/SensoryEffects";
import { motion } from "framer-motion";

interface Message {
  id: string;
  user_id: string;
  content: string;
  is_system_bot: boolean;
  thanks_count: number;
  created_at: string;
  expires_at: string;
  has_thanked?: boolean;
  is_optimistic?: boolean;
  author_name?: string;
  author_avatar?: string | null;
  author_trust?: number;
  author_allergens?: string[];
}

interface RoomInfo {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
}

interface TopicInfo {
  id: string;
  title: string;
  message_count: number;
}

export default function TopicChatPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const topicId = params.topicId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [thankedIds, setThankedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadMessages = useCallback(async () => {
    const result = await getTopicMessages(topicId);
    if (result.success) {
      const msgs = result.data as unknown as Message[];
      setMessages(msgs);
      const dbThanked = msgs.filter((m) => m.has_thanked).map((m) => m.id);
      if (dbThanked.length > 0) {
        setThankedIds((prev) => {
          const newSet = new Set(prev);
          dbThanked.forEach((id) => newSet.add(id));
          return newSet;
        });
      }
    }
    setIsLoading(false);
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      200
    );
  }, [topicId]);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      });

    async function initData() {
      const roomRes = await getTalkRoomBySlug(slug);
      if (!roomRes.success || !roomRes.data) {
        router.push("/talk");
        return;
      }
      setRoomInfo(roomRes.data as RoomInfo);

      const topicRes = await getTalkTopicById(topicId);
      if (!topicRes.success || !topicRes.data) {
        router.push(`/talk/${slug}`);
        return;
      }
      setTopicInfo(topicRes.data as TopicInfo);

      await loadMessages();
    }
    initData();
  }, [slug, topicId, router, loadMessages]);


  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);
      setSafetyWarning(null);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    },
    []
  );

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = newMessage;
    if (!text.trim() || isSending || !topicInfo || !roomInfo) return;

    // Safety check
    const safety = checkContentSafety(text);
    if (!safety.isSafe) {
      const reason = safety.hasDangerousAdvice
        ? "医療アドバイスに関する表現が含まれています。体験談として共有してください。"
        : "攻撃的な表現が検出されました。やさしい言葉で書き直してみてください。";
      setSafetyWarning(reason);
      Haptics.error();
      return;
    }
    if (safety.isEmergency) {
      setSafetyWarning("⚠️ 緊急時は迷わず119番へ。エピペンをお持ちの方は使用してください。");
    }

    setIsSending(true);
    setSafetyWarning(null);

    const optimisticMsg: Message = {
      id: "opt-" + Date.now(),
      user_id: currentUserId || "temp",
      content: text,
      is_system_bot: false,
      thanks_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      is_optimistic: true,
      author_name: "あなた",
      author_avatar: null,
      author_trust: 0,
      author_allergens: [],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      20
    );

    const result = await postTopicMessage(topicId, roomInfo.id, text);
    if (result.success) {
      Haptics.success();
      AudioHaptics.playPop();
      await loadMessages();
    } else {
      // Restore on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(text);
      setSafetyWarning(result.error || "送信に失敗しました");
    }
    setIsSending(false);
  }

  async function handleDelete(messageId: string) {
    if (!confirm("本当にこの投稿を削除しますか？")) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await deleteMessage(messageId);
  }

  const handleThanks = useCallback(async (messageId: string, event?: React.MouseEvent) => {
    Haptics.light();
    if (event && !thankedIds.has(messageId)) {
      AudioHaptics.playTink();
      triggerSensoryBurst(event);
    }

    if (thankedIds.has(messageId)) {
      setThankedIds((prev) => {
        const n = new Set(prev);
        n.delete(messageId);
        return n;
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, thanks_count: Math.max(0, m.thanks_count - 1) }
            : m
        )
      );
      await removeThanks(messageId);
    } else {
      setThankedIds((prev) => new Set(prev).add(messageId));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, thanks_count: m.thanks_count + 1 }
            : m
        )
      );
      await sendThanks(messageId);
    }
  }, [thankedIds]);

  const handleShareMessage = useCallback(async (msgId: string) => {
    Haptics.success();
    const url = `${window.location.origin}/share/talk/${msgId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "教えて！あんしんキッズ",
          text: "食物アレルギーの先輩パパ・ママ、知恵を貸してください🙏",
          url: url,
        });
      } catch (e) {
        console.error("Share failed", e);
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("リンクをコピーしました！SNSでシェアして助けを呼びましょう。");
    }
  }, []);

  function getAvatarColor(name: string) {
    const colors = [
      "from-blue-400 to-indigo-500",
      "from-emerald-400 to-teal-500",
      "from-rose-400 to-pink-500",
      "from-amber-400 to-orange-500",
      "from-purple-400 to-fuchsia-500",
    ];
    const hash = name
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  function renderAvatar(avatar_url: string | null, user_id: string, name: string) {
    if (avatar_url && avatar_url.startsWith("http")) {
      return (
        <Image 
          src={avatar_url} 
          alt={name || ""} 
          fill 
          unoptimized 
          className="object-cover rounded-full" 
        />
      );
    }
    const color = getAvatarColor(user_id);
    return (
      <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
        <User className="w-4 h-4 text-white/90" />
      </div>
    );
  }

  const renderedMessages = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-4 px-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`shimmer w-[70%] h-16 rounded-2xl ${i % 2 === 0 ? "ml-auto" : ""}`}
            />
          ))}
        </div>
      );
    }

      if (messages.length === 0) {
      return (
        <div className="py-16 flex flex-col items-center text-center px-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-[var(--color-primary)]" style={{ opacity: 0.4 }} />
          </div>
          <h3 className="text-[16px] font-bold text-[var(--color-text)] break-keep text-balance px-4 mb-2">
            {topicInfo?.title}
          </h3>
          <div className="bg-white p-4 rounded-2xl border border-[var(--color-border-light)] max-w-sm w-full shadow-sm">
            <p className="text-[13px] font-bold text-[var(--color-text)] mb-2">💡 最初の声を届けてみませんか？</p>
            <p className="text-[11px] text-[var(--color-subtle)] leading-relaxed text-left">
              たとえば…<br />
              ・「うちの子は卵アレルギーなのですが、皆さんはどうしてますか？」<br />
              ・「最近、こんなアレルギー対応のレシピを見つけました」<br />
              あなたのささいな疑問や体験が、他の親御さんの「安心」に繋がります🍀
            </p>
          </div>
        </div>
      );
    }

    return messages.map((msg) => {
      const isThanked = msg.has_thanked || thankedIds.has(msg.id);
      const isMyMessage = msg.user_id === currentUserId;
      const opacityClass = msg.is_optimistic
        ? "opacity-60"
        : "opacity-100 transition-opacity duration-300";

      if (isMyMessage) {
        return (
          <div
            key={msg.id}
            className={`flex flex-col items-end px-4 mb-4 ${opacityClass} fade-in`}
          >
            <div className="flex gap-2 max-w-[85%]">
              <div className="flex flex-col items-end">
                <div className="px-4 py-2.5 rounded-[20px] rounded-br-[4px] bg-[var(--color-primary)] text-white shadow-sm break-words whitespace-pre-wrap text-[14px] leading-relaxed">
                  {msg.content}
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[10px] font-medium text-[var(--color-muted)]">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {!msg.is_optimistic && (
                    <>
                      <button
                        onClick={() => handleShareMessage(msg.id)}
                        className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-primary)] flex items-center transition-colors mr-1"
                        aria-label="シェアして助けを求める"
                      >
                        <Share className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-danger)] flex items-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div
            key={msg.id}
            className={`flex flex-col items-start px-4 mb-4 ${opacityClass} fade-in`}
          >
            <div className="flex gap-2 max-w-[85%]">
              <div
                className={`w-8 h-8 mt-1 flex-shrink-0 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden`}
              >
                {renderAvatar(msg.author_avatar || null, msg.user_id, msg.author_name || "参加者")}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 ml-1 mb-0.5 flex-wrap">
                  <span className="text-[12px] font-bold text-[var(--color-primary)]">
                    {msg.author_name || "参加者"}
                  </span>
                  {msg.author_allergens && msg.author_allergens.length > 0 && (
                    <span className="text-[10px] bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded border border-[var(--color-border-light)]">
                      {msg.author_allergens.slice(0, 2).join(", ")}
                      {msg.author_allergens.length > 2 ? "..." : ""}
                    </span>
                  )}
                </div>
                <div className="px-4 py-2.5 rounded-[20px] rounded-bl-[4px] bg-white border border-[var(--color-border-light)] text-[var(--color-text)] shadow-sm break-words whitespace-pre-wrap text-[14px] leading-relaxed">
                  {msg.content}
                </div>

                <div className="flex gap-2 items-center mt-1 ml-1">
                  <span className="text-[10px] font-medium text-[var(--color-muted)]">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => handleThanks(msg.id, e)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-all border ${
                      isThanked
                        ? "bg-[var(--color-heart-light)]/50 border-[var(--color-heart)]/30 text-[var(--color-heart)]"
                        : "bg-[var(--color-surface)] border-[var(--color-border-light)] text-[var(--color-subtle)]"
                    }`}
                  >
                    <span>❤️</span>
                    {msg.thanks_count > 0 && (
                      <span className="font-bold">{msg.thanks_count}</span>
                    )}
                  </motion.button>
                  <button
                    onClick={() => handleShareMessage(msg.id)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-surface)] border border-[var(--color-border-light)] text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-all"
                  >
                    <Share className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    });
  }, [messages, thankedIds, currentUserId, isLoading, topicInfo, handleThanks, handleShareMessage]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-bg)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--color-border-light)] bg-white/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <Link
          href={`/talk/${slug}`}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-[var(--color-surface-warm)] transition-colors active:scale-95 text-[var(--color-text)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0 pr-4 text-center">
          <h1 className="text-[14px] font-bold text-[var(--color-text)] truncate px-2 leading-tight">
            {topicInfo?.title || "読み込み中..."}
          </h1>
          {roomInfo && (
            <p className="text-[10px] font-medium text-[var(--color-subtle)] truncate mt-0.5">
              {roomInfo.icon_emoji} {roomInfo.name}
            </p>
          )}
        </div>
        <div className="w-8" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-6 relative z-10">
        <div className="py-4">
          {renderedMessages}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Safety Warning */}
      {safetyWarning && (
        <div className="px-4 pb-2">
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700 font-medium flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠️</span>
            <span>{safetyWarning}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div
        className="p-3 bg-white border-t border-[var(--color-border-light)] shadow-[0_-4px_15px_-10px_rgba(0,0,0,0.1)] relative z-20"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto flex gap-2 items-end"
        >
          <div className="flex-1 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all overflow-hidden flex items-end min-h-[44px] px-3 py-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              placeholder="メッセージを入力..."
              className="w-full bg-transparent border-none outline-none resize-none text-[15px] p-0 text-[var(--color-text)] placeholder-[var(--color-muted)] placeholder:font-medium leading-[1.5] max-h-[120px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all ${
              newMessage.trim() && !isSending
                ? "bg-[var(--color-primary)] text-white shadow-md active:scale-90"
                : "bg-[var(--color-surface-warm)] text-[var(--color-muted)]"
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
