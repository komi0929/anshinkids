"use client";

import { useState, useEffect, useRef, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Send,
  Trash2,
  ChevronDown,
  BookOpen,
  Camera,
  X,
} from "@/components/icons";
import {
  getTopicMessages,
  postTopicMessage,
  deleteMessage,
  sendThanks,
  removeThanks,
  toggleReaction,
} from "@/app/actions/messages";
import { TopicSummary } from "@/app/actions/topic-summary";
import {
  checkContentSafety,
} from "@/lib/ai/safety-guard";
import { Haptics } from "@/lib/haptics";
import { AudioHaptics } from "@/lib/audio-haptics";
import { triggerSensoryBurst } from "@/components/ui/SensoryEffects";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeDefinition, THEMES } from "@/lib/themes";
import { ThemeSummaryRenderer } from "@/components/theme-summary-renderer";
import TopicBookmarkButton from "@/components/topic-bookmark-button";

export interface Message {
  id: string;
  user_id: string;
  content: string;
  is_system_bot: boolean;
  thanks_count: number;
  created_at: string;
  expires_at: string;
  has_thanked?: boolean;
  reactions?: { message_id: string, user_id: string, reaction_type: string }[];
  is_optimistic?: boolean;
  author_name?: string;
  author_avatar?: string | null;
  author_trust?: number;
  author_allergens?: string[];
  author_age?: string;
  image_url?: string | null;
}

export const AVAILABLE_REACTIONS = ["👍", "❤️", "😂", "🥺", "🙏", "👀"];

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

export default function ChatClient({
  slug,
  topicId,
  initialRoomInfo,
  initialTopicInfo,
  initialMessages,
  initialSummary,
}: {
  slug: string;
  topicId: string;
  initialRoomInfo: RoomInfo;
  initialTopicInfo: TopicInfo;
  initialMessages: Message[];
  initialSummary: TopicSummary | null;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false); // Rendered instantly via SSR
  const [isSending, setIsSending] = useState(false);
  const [thankedIds, setThankedIds] = useState<Set<string>>(
    new Set(initialMessages.filter(m => m.has_thanked).map(m => m.id))
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorId] = useState(() => crypto.randomUUID());

  const themeInfo = THEMES.find(t => t.slug === slug) || THEMES[0];

  const [roomInfo] = useState<RoomInfo>(initialRoomInfo);
  const [topicInfo] = useState<TopicInfo>(initialTopicInfo);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [topicSummary] = useState<TopicSummary | null>(initialSummary);
  const [showSummary, setShowSummary] = useState(true);
  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  // Initial scroll to bottom on mount
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  // Listen for real-time messages instead of polling (DDoS Fix)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`topic-${topicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `topic_id=eq.${topicId}`,
        },
        () => {
          loadMessages();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topicId, loadMessages]);


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
    if ((!text.trim() && !selectedImage) || isSending || !topicInfo || !roomInfo) return;

    // Safety check (only if text exists)
    if (text.trim()) {
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
      author_age: "",
      image_url: selectedImagePreview,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    // Clear preview locally
    const imageToUpload = selectedImage;
    setSelectedImage(null);
    setSelectedImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      // Keep keyboard open for rapid-fire chat (LINE-like UX)
      textareaRef.current.focus();
    }
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      20
    );

    startTransition(async () => {
      let finalImageUrl: string | undefined = undefined;
      
      // Upload image first if exists
      if (imageToUpload) {
        const supabase = createClient();
        const fileExt = imageToUpload.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${roomInfo.id}/${topicId}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage.from('chat_images').upload(filePath, imageToUpload);
        if (uploadError) {
           setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
           setNewMessage(text);
           setSelectedImage(imageToUpload);
           setSelectedImagePreview(URL.createObjectURL(imageToUpload));
           setSafetyWarning("画像のアップロードに失敗しました");
           setIsSending(false);
           return;
        }
        
        if (data) {
          const { data: publicUrlData } = supabase.storage.from('chat_images').getPublicUrl(filePath);
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      const result = await postTopicMessage(topicId, roomInfo.id, text, finalImageUrl);
      if (result.success) {
        Haptics.success();
        AudioHaptics.playPop();
        await loadMessages();
      } else {
        // Restore on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setNewMessage(text);
        if (imageToUpload) {
           setSelectedImage(imageToUpload);
           setSelectedImagePreview(URL.createObjectURL(imageToUpload));
        }
        setSafetyWarning(result.error || "送信に失敗しました");
      }
      setIsSending(false);
    });
  }

  async function handleDelete(messageId: string) {
    if (!confirm("本当にこの投稿を削除しますか？")) return;
    const backupMessages = [...messages];
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    startTransition(async () => {
      const result = await deleteMessage(messageId);
      if (!result.success) {
        setMessages(backupMessages);
        alert(result.error || "削除に失敗しました");
      }
    });
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

  const handleReactionToggle = useCallback(async (messageId: string, reactionType: string) => {
    Haptics.light();
    AudioHaptics.playPop();
    
    // Optistic update
    setMessages((prev) => prev.map(m => {
      if (m.id !== messageId || !currentUserId) return m;
      const existingReactions = m.reactions || [];
      const userReactionIndex = existingReactions.findIndex(r => r.user_id === currentUserId && r.reaction_type === reactionType);
      
      let newReactions = [...existingReactions];
      if (userReactionIndex >= 0) {
        // Toggle off
        newReactions.splice(userReactionIndex, 1);
      } else {
        // LINE style: If they tap a new reaction, we might just add it. But here our table uniquely constraints (message_id, user_id).
        // Optistically remove any other reaction by this user first.
        newReactions = newReactions.filter(r => r.user_id !== currentUserId);
        newReactions.push({ message_id: messageId, user_id: currentUserId, reaction_type: reactionType });
      }
      return { ...m, reactions: newReactions };
    }));
    
    setActiveReactionMsg(null);
    startTransition(async () => {
      await toggleReaction(messageId, reactionType);
    });
  }, [currentUserId]);


  // Anonymous label generator — gives each unique user_id a stable, distinct label
  const anonymousLabels = useMemo(() => {
    const labelMap = new Map<string, string>();
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let idx = 0;
    messages.forEach((msg) => {
      if (!labelMap.has(msg.user_id)) {
        labelMap.set(msg.user_id, chars[idx % chars.length]);
        idx++;
      }
    });
    return labelMap;
  }, [messages]);

  function getAnonymousName(user_id: string, original_name: string | undefined): string {
    if (original_name && !["あんしんユーザー", "ゲスト", "参加者"].includes(original_name)) return original_name;
    const letter = anonymousLabels.get(user_id) || "?";
    return `ゲスト${letter}`;
  }

  const AVATAR_COLORS = [
    "bg-[#E8D5C4]", // warm beige
    "bg-[#C9D6C8]", // sage
    "bg-[#D4C5E2]", // lavender
    "bg-[#C5D5E4]", // sky
    "bg-[#E4D4C4]", // sand
    "bg-[#D2C9B8]", // oat
    "bg-[#C8D5CF]", // mint
    "bg-[#E0C8C8]", // rose
  ];

  function getAvatarBg(user_id: string | null) {
    if (!user_id || typeof user_id !== 'string') return AVATAR_COLORS[0];
    const hash = user_id?.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  function getAvatarInitial(user_id: string | null, name: string): string {
    if (name && !["あんしんユーザー", "ゲスト", "参加者"].includes(name) && !name.startsWith("ゲスト")) return name[0];
    if (!user_id) return "?";
    return anonymousLabels.get(user_id) || "?";
  }

  function renderAvatar(avatar_url: string | null, user_id: string, name: string) {
    // LINEなどのURL画像
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
    // プロフィールで設定した絵文字アバター (1〜4文字)
    if (avatar_url && avatar_url.length <= 4) {
      return (
        <div className="w-full h-full bg-[var(--color-surface-warm)] flex items-center justify-center rounded-full border border-[var(--color-border-light)]">
          <span className="text-[14px]">{avatar_url}</span>
        </div>
      );
    }
    // デフォルト: ミュートカラー + イニシャル
    const bg = getAvatarBg(user_id);
    const initial = getAvatarInitial(user_id, name);
    return (
      <div className={`w-full h-full ${bg} flex items-center justify-center rounded-full`}>
        <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">{initial}</span>
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
        <div className="flex flex-col items-center px-4 pt-8 pb-4">
          <div className="w-full max-w-sm">
            <div className="relative rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-accent)]/5 border border-[var(--color-primary)]/10 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[20px] flex-shrink-0">
                  {topicSummary ? "📝" : (roomInfo?.icon_emoji || "💬")}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-[14px] font-bold text-[var(--color-text)] leading-snug mb-1">
                    {topicSummary ? "過去の声はまとめ記事に反映されました" : "この話題にまだ声がありません"}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                    {topicSummary
                      ? "プライバシー保護のためトーク内容は一定期間で自動削除されますが、知恵はまとめ記事として残ります"
                      : "あなたの体験やヒントが、同じ悩みを持つ誰かの助けになります"}
                  </p>
                </div>
              </div>
              {topicSummary && (
                <p className="text-[12px] text-[var(--color-primary)] font-medium mt-2">
                  💡 上部の「まとめ」をタップして記事を読めます。新しい体験談もぜひ共有してください！
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return messages.map((msg, index) => {
      const isThanked = msg.has_thanked || thankedIds.has(msg.id);
      const isMyMessage = msg.user_id === currentUserId;
      const opacityClass = msg.is_optimistic
        ? "opacity-60"
        : "opacity-100 transition-opacity duration-300";

      // Date Divider Logic
      const msgDate = new Date(msg.created_at);
      const isToday = msgDate.toDateString() === new Date().toDateString();
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = msgDate.toDateString() === yesterday.toDateString();
      
      const dateStr = isToday ? "今日" : isYesterday ? "昨日" : `${msgDate.getFullYear()}/${msgDate.getMonth() + 1}/${msgDate.getDate()}`;
      
      let showDateDivider = false;
      if (index === 0) {
        showDateDivider = true;
      } else {
        const prevDate = new Date(messages[index - 1].created_at);
        if (msgDate.toDateString() !== prevDate.toDateString()) {
          showDateDivider = true;
        }
      }

      const dateDivider = showDateDivider ? (
        <div className="flex justify-center my-5 slide-up" key={`date-${msg.id}`}>
          <span className="text-[11px] font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-soft)] px-3 py-1 rounded-full border border-[var(--color-border)] shadow-sm">
            {dateStr}
          </span>
        </div>
      ) : null;

      if (isMyMessage) {
        return (
          <div key={msg.id}>
            {dateDivider}
            <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            key={msg.id}
            className={`flex flex-col items-end px-4 mb-4 ${opacityClass}`}
          >
            <div className="flex gap-2 max-w-[85%] flex-row-reverse">
              <div
                className="w-8 h-8 mt-1 flex-shrink-0 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden"
              >
                {renderAvatar(msg.author_avatar || null, msg.user_id, getAnonymousName(msg.user_id, msg.author_name))}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-bold text-[var(--color-text-secondary)] mr-1 mb-0.5">
                  {getAnonymousName(msg.user_id, msg.author_name)}
                </span>
                <div className="px-4 py-2.5 rounded-[20px] rounded-br-[4px] bg-[var(--color-primary)] text-white shadow-sm break-words whitespace-pre-wrap text-[14px] leading-relaxed">
                  {msg.image_url && (
                    <div className="mb-2 -mx-1 -mt-1 rounded-t-[14px] overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.image_url} alt="attached" className="w-[200px] aspect-square object-cover bg-black/10" />
                    </div>
                  )}
                  {msg.content}
                </div>
                <div className="flex gap-2 items-center mt-1 mr-1 flex-row-reverse">
                  <span className="text-[10px] font-medium text-[var(--color-muted)]">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {!msg.is_optimistic && (
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-danger)] flex items-center transition-colors"
                        aria-label="お声を取り消す"
                        title="投稿を取り消す"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setActiveReactionMsg(activeReactionMsg === msg.id ? null : msg.id)}
                          className={`flex items-center justify-center w-6 h-6 rounded-full transition-all border ${
                            activeReactionMsg === msg.id 
                              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                              : "bg-[var(--color-surface)] text-[var(--color-subtle)] border-[var(--color-border-light)] hover:bg-[var(--color-surface-warm)]"
                          }`}
                        >
                          <span className="text-[12px] font-bold">+</span>
                        </button>
                        
                        {activeReactionMsg === msg.id && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white/90 backdrop-blur-md border border-[var(--color-border)] shadow-lg rounded-full px-2 py-1.5 flex gap-1 z-50 animate-in fade-in zoom-in duration-200">
                            {AVAILABLE_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReactionToggle(msg.id, emoji)}
                                className="text-[20px] hover:scale-125 active:scale-90 transition-transform px-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Reaction Pills Stacked Below My Bubble */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 mr-1 justify-end">
                    {Array.from(
                      msg.reactions.reduce((acc, r) => {
                        const existing = acc.get(r.reaction_type) || { count: 0, hasReacted: false };
                        existing.count += 1;
                        if (r.user_id === currentUserId) existing.hasReacted = true;
                        acc.set(r.reaction_type, existing);
                        return acc;
                      }, new Map<string, { count: number, hasReacted: boolean }>())
                    ).map(([emoji, data]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReactionToggle(msg.id, emoji)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-all border shadow-sm ${
                          data.hasReacted
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-[var(--color-surface)] border-[var(--color-border-light)] text-[var(--color-text)]"
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="font-bold opacity-80">{data.count}</span>
                      </button>
                    ))}
                  </div>
                )}
                
              </div>
            </div>
          </motion.div>
          </div>

        );
      } else {
        return (
          <div key={msg.id}>
            {dateDivider}
            <motion.div
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`flex flex-col items-start px-4 mb-4 ${opacityClass}`}
          >
            <div className="flex gap-2 max-w-[85%]">
              <div
                className="w-8 h-8 mt-1 flex-shrink-0 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden"
              >
                {renderAvatar(msg.author_avatar || null, msg.user_id, getAnonymousName(msg.user_id, msg.author_name))}
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1 mb-1 ml-1">
                  <span className="text-[11px] font-bold text-[var(--color-primary)]">
                    {getAnonymousName(msg.user_id, msg.author_name)}
                  </span>
                  {msg.author_age && (
                    <span className="text-[9px] font-bold bg-[var(--color-surface-warm)] text-[var(--color-subtle)] px-1.5 py-0.5 rounded-full">
                      {msg.author_age.includes("歳") ? msg.author_age : msg.author_age + "歳"}
                    </span>
                  )}
                  {msg.author_allergens && msg.author_allergens.length > 0 && (
                    <div className="flex gap-0.5">
                      {msg.author_allergens.slice(0,3).map(a => {
                        const emoji = a.includes("卵") ? "🥚" : a.includes("乳") ? "🥛" : a.includes("小麦") ? "🌾" : "🌱";
                        return (
                          <span key={a} className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5">
                            {emoji}{a}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 rounded-[20px] rounded-bl-[4px] bg-white border border-[var(--color-border-light)] text-[var(--color-text)] shadow-sm break-words whitespace-pre-wrap text-[14px] leading-relaxed max-w-full">
                  {msg.image_url && (
                    <div className="mb-2 -mx-1 -mt-1 rounded-t-[14px] overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.image_url} alt="attached" className="w-[200px] aspect-square object-cover bg-[var(--color-surface-warm)]" />
                    </div>
                  )}
                  {msg.content}
                </div>
                <div className="flex gap-2 items-center mt-1 ml-1">
                  <span className="text-[10px] font-medium text-[var(--color-muted)]">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  
                  {/* Plus button to open Reaction Picker for "their" message */}
                  {!msg.is_optimistic && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveReactionMsg(activeReactionMsg === msg.id ? null : msg.id)}
                        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all border ${
                          activeReactionMsg === msg.id 
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                            : "bg-[var(--color-surface)] text-[var(--color-subtle)] border-[var(--color-border-light)] hover:bg-[var(--color-surface-warm)]"
                        }`}
                        title="リアクションを追加"
                      >
                        <span className="text-[12px] font-bold">+</span>
                      </button>
                      
                      {activeReactionMsg === msg.id && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white/90 backdrop-blur-md border border-[var(--color-border)] shadow-lg rounded-full px-2 py-1.5 flex gap-1 z-50 animate-in fade-in zoom-in duration-200">
                          {AVAILABLE_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleReactionToggle(msg.id, emoji)}
                              className="text-[20px] hover:scale-125 active:scale-90 transition-transform px-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Keep legacy heartbeat for my-message/older ones optionally? We'll replace it completely. */}
                </div>
                
                {/* Reaction Pills Stacked Below the Bubble */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 ml-1">
                    {Array.from(
                      msg.reactions.reduce((acc, r) => {
                        const existing = acc.get(r.reaction_type) || { count: 0, hasReacted: false };
                        existing.count += 1;
                        if (r.user_id === currentUserId) existing.hasReacted = true;
                        acc.set(r.reaction_type, existing);
                        return acc;
                      }, new Map<string, { count: number, hasReacted: boolean }>())
                    ).map(([emoji, data]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReactionToggle(msg.id, emoji)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-all border shadow-sm ${
                          data.hasReacted
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-[var(--color-surface)] border-[var(--color-border-light)] text-[var(--color-text)]"
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="font-bold opacity-80">{data.count}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Fallback for legacy thanks if present but not migrated yet */}
                {msg.thanks_count > 0 && (!msg.reactions || msg.reactions.length === 0) && (
                   <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] mt-1 ml-1 border bg-[var(--color-heart-light)]/50 border-[var(--color-heart)]/30 text-[var(--color-heart)]">
                     ❤️ <span className="font-bold">{msg.thanks_count}</span>
                   </span>
                )}
                
              </div>
            </div>
          </motion.div>
          </div>
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, thankedIds, currentUserId, isLoading, topicInfo, handleThanks]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-bg)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
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
        {/* AI Summary Section */}
        {topicSummary && topicSummary.full_summary && (
          <div className="mx-4 mt-4 mb-2">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-between p-4 rounded-t-2xl bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-accent)]/5 border border-[var(--color-primary)]/15 border-b-0 transition-all"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-[13px] font-bold text-[var(--color-primary)]">AIまとめ</span>
                {topicSummary.allergen_tags && Array.isArray(topicSummary.allergen_tags) && topicSummary.allergen_tags.length > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                    {topicSummary.allergen_tags.slice(0, 3).join("・")}
                  </span>
                )}
                {topicSummary.allergen_tags && !Array.isArray(topicSummary.allergen_tags) && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                    {String(topicSummary.allergen_tags).slice(0, 10)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ChevronDown className={`w-4 h-4 text-[var(--color-primary)] transition-transform ${showSummary ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div className={`absolute top-4 right-4 transition-all z-10 block`}>
               <TopicBookmarkButton summaryId={topicSummary.id} snippetTitle={topicInfo?.title || "お役立ち情報"} snippetContent={topicSummary.summary_snippet || ""} />
            </div>
            {showSummary && (
              <div className="p-4 rounded-b-2xl bg-white border border-[var(--color-primary)]/15 border-t-0 slide-up">
                {topicSummary.summary_snippet && (
                  <p className="text-[14px] font-medium text-[var(--color-text)] leading-relaxed mb-4">
                    {topicSummary.summary_snippet}
                  </p>
                )}
                {/* Render structured full_summary beautifully */}
                <div className="mt-4 border-t border-[var(--color-border-light)] pt-4">
                  <ThemeSummaryRenderer theme={themeInfo} topicSummary={topicSummary} roomSlug={slug} topicId={topicId} />
                </div>
                
                <p className="text-[10px] text-[var(--color-muted)] mt-5 pt-3 border-t border-[var(--color-border-light)] font-medium">
                  ※会話の内容をもとにAIが自動生成した要約です
                </p>
              </div>
            )}
          </div>
        )}

        <div className="py-4">
          <AnimatePresence initial={false}>
            {renderedMessages}
          </AnimatePresence>
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
        {selectedImagePreview && (
          <div className="max-w-3xl mx-auto mb-3">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-[var(--color-border-light)] inline-block">
              <Image src={selectedImagePreview} alt="preview" fill className="object-cover" unoptimized />
              <button
                 onClick={() => {
                   setSelectedImage(null);
                   setSelectedImagePreview(null);
                 }}
                 className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:scale-105 active:scale-95 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto flex gap-2 items-end"
        >
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                 if (file.size > 5 * 1024 * 1024) {
                   setSafetyWarning("画像は5MB以下にしてください");
                   return;
                 }
                 setSelectedImage(file);
                 setSelectedImagePreview(URL.createObjectURL(file));
              }
              // reset input
              if (fileInputRef.current) fileInputRef.current.value = '';
            }} 
          />
          <button
            type="button"
            disabled={isSending}
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-[var(--color-primary)] bg-[var(--color-surface-warm)] hover:bg-[var(--color-primary)]/10 active:scale-95 transition-all border border-[var(--color-primary)]/20 shadow-sm"
          >
            <Camera className="w-[22px] h-[22px]" />
          </button>
          <div className="flex-1 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all overflow-hidden flex items-end min-h-[44px] px-3 py-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              placeholder="メッセージを入力"
              className="w-full bg-transparent border-none outline-none resize-none text-[16px] p-0 text-[var(--color-text)] placeholder-[var(--color-muted)] placeholder:font-medium leading-[1.5] max-h-[120px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return; // Prevent sending during Japanese IME conversion
                if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedImage) || isSending}
            className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all ${
              (newMessage.trim() || selectedImage) && !isSending
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
