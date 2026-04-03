"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  Check,
  AlertTriangle,
  Phone,
  ShieldCheck,
  X,
  Trash2,
  Reply,
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
  EMERGENCY_GUIDANCE,
  COMMUNITY_GUIDELINES,
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
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    trust_score: number;
  };
  has_thanked?: boolean;
  is_optimistic?: boolean;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    });
    loadData();
  }, [slug, topicId]);

  async function loadData() {
    const roomRes = await getTalkRoomBySlug(slug);
    if (!roomRes.success || !roomRes.data) {
        window.location.href = "/talk";
        return;
    }
    setRoomInfo(roomRes.data as RoomInfo);

    const topicRes = await getTalkTopicById(topicId);
    if (!topicRes.success || !topicRes.data) {
        window.location.href = `/talk/${slug}`;
        return;
    }
    setTopicInfo(topicRes.data as TopicInfo);

    await loadMessages();
  }

  async function loadMessages() {
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
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = newMessage;
    if (!text.trim() || isSending || !topicInfo || !roomInfo) return;

    setIsSending(true);

    const optimisticMsg: Message = {
      id: "opt-" + Date.now(),
      user_id: currentUserId || "temp",
      content: text,
      is_system_bot: false,
      thanks_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      profiles: { display_name: "あなた", avatar_url: null, trust_score: 0 },
      is_optimistic: true,
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 20);

    const result = await postTopicMessage(topicId, roomInfo.id, text);
    if (result.success) {
      Haptics.success();
      AudioHaptics.playPop();
      setNewMessage("");
      await loadMessages();
    } else {
        alert("送信に失敗しました");
    }
    setIsSending(false);
  }

  async function handleDelete(messageId: string) {
    if (!confirm("本当にこの投稿を削除しますか？")) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await deleteMessage(messageId);
  }

  async function handleThanks(messageId: string, event?: React.MouseEvent) {
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
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, thanks_count: Math.max(0, m.thanks_count - 1) } : m));
      await removeThanks(messageId);
    } else {
      setThankedIds((prev) => new Set(prev).add(messageId));
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, thanks_count: m.thanks_count + 1 } : m));
      await sendThanks(messageId);
    }
  }

  function getAvatarColor(name: string) {
    const colors = [
      "from-blue-400 to-indigo-500",
      "from-emerald-400 to-teal-500",
      "from-rose-400 to-pink-500",
      "from-amber-400 to-orange-500",
      "from-purple-400 to-fuchsia-500",
    ];
    const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  const renderedMessages = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-4 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`shimmer w-[70%] h-16 rounded-2xl ${i % 2 === 0 ? "ml-auto" : ""}`} />
          ))}
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="empty-state py-12 flex flex-col items-center text-center">
          <MessageCircle className="w-12 h-12 text-[var(--color-primary)]/40 mb-3 mx-auto" />
          <h3 className="text-[16px] font-bold text-[var(--color-text)] break-keep text-balance px-4">
            「{topicInfo?.title}」
          </h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-3 leading-relaxed max-w-[240px]">
            最初の投稿をしてみませんか？
          </p>
        </div>
      );
    }

    return messages.map((msg) => {
      const isThanked = msg.has_thanked || thankedIds.has(msg.id);
      const isMyMessage = msg.user_id === currentUserId;
      const opacityClass = msg.is_optimistic ? "opacity-60" : "opacity-100 transition-opacity duration-300";

      if (isMyMessage) {
        return (
          <div key={msg.id} className={`flex flex-col items-end px-4 mb-4 ${opacityClass} fade-in`}>
            <div className="flex gap-2 max-w-[85%]">
              <div className="flex flex-col items-end">
                <div className="px-4 py-2.5 rounded-[20px] rounded-br-[4px] bg-[var(--color-primary)] text-white shadow-sm break-words whitespace-pre-wrap text-[14px]">
                  {msg.content}
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[10px] font-medium text-[var(--color-muted)]">
                     {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <button onClick={() => handleDelete(msg.id)} className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-danger)] flex items-center">
                    <Trash2 className="w-3 h-3"/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        return (
            <div key={msg.id} className={`flex flex-col items-start px-4 mb-4 ${opacityClass} fade-in`}>
                <div className="flex gap-2 max-w-[85%]">
                    <div className={`w-8 h-8 mt-1 flex-shrink-0 rounded-full bg-gradient-to-br ${getAvatarColor(msg.user_id)} flex items-center justify-center shadow-sm`}>
                         <User className="w-4 h-4 text-white/90" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[11px] font-semibold text-[var(--color-subtle)] ml-1 mb-0.5">参加者</span>
                        <div className="px-4 py-2.5 rounded-[20px] rounded-bl-[4px] bg-white border border-[var(--color-border-light)] text-[var(--color-text)] shadow-sm break-words whitespace-pre-wrap text-[14px]">
                            {msg.content}
                        </div>
                        
                        <div className="flex gap-2 items-center mt-1 ml-1">
                            <span className="text-[10px] font-medium text-[var(--color-muted)]">
                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                                <span>❤️</span>{msg.thanks_count > 0 && <span className="font-bold">{msg.thanks_count}</span>}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        )
      }
    });

  }, [messages, thankedIds, currentUserId, isLoading, topicInfo]);

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
                    in {roomInfo.name}
                </p>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-6 relative z-10">
        <div className="py-4">
             {renderedMessages}
             <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-[var(--color-border-light)] pb-safe shadow-[0_-4px_15px_-10px_rgba(0,0,0,0.1)] relative z-20">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2 items-end">
            <div className="flex-1 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all overflow-hidden flex items-center min-h-[44px] px-3 py-2">
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="w-full bg-transparent border-none outline-none resize-none text-[15px] p-0 text-[var(--color-text)] placeholder-[var(--color-muted)] placeholder:font-medium leading-[1.4]"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
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
