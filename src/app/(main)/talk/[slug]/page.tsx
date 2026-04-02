"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send, MessageCircle, Sparkles, RefreshCw, BookOpen, Clock, ArrowRight, Leaf, Check, AlertTriangle, Phone, ShieldCheck, X, Trash2, Reply, User, Share } from "@/components/icons";
import {
  getActiveMessages,
  postMessage,
  deleteMessage,
  sendThanks,
  removeThanks,
  getRoomPrompts,
  getTalkRoomBySlug,
  getWikiCountForRoom,
  getRelatedWikiEntries,
} from "@/app/actions/messages";
import {
  checkContentSafety,
  EMERGENCY_GUIDANCE,
  COMMUNITY_GUIDELINES,
} from "@/lib/ai/safety-guard";
import { getImpactFeedback } from "@/app/actions/discover";
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

interface RelatedWiki {
  id: string;
  title: string;
  slug: string;
  source_count: number;
}

export default function TalkRoomPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [thankedIds, setThankedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [wikiCount, setWikiCount] = useState(0);
  const [relatedWiki, setRelatedWiki] = useState<RelatedWiki[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gap 1: Post-send feedback toast
  const [showAssetToast, setShowAssetToast] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [impactMessage, setImpactMessage] = useState<string | null>(null);

  // === F2: Emergency banner ===
  const [showEmergency, setShowEmergency] = useState(false);

  // === F3: Safety warning on input ===
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  // === F5: Community guidelines (first-time) ===
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // === F7: Milestone toast ===
  const [milestoneToast, setMilestoneToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const summon = sp.get("summon");
      if (summon) {
        // Sanitize string to prevent UI overflow and strip HTML-like tags (React safely escapes rendering, but textarea formatting should be clean)
        const sanitized = summon.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 200);
        setNewMessage(sanitized);
        // auto-focus textarea
        setTimeout(() => {
          document.querySelector("textarea")?.focus();
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    // Check if guidelines were already accepted and load persisted thanks
    if (typeof window !== "undefined") {
      const accepted = localStorage.getItem("anshin_guidelines_accepted");
      if (accepted) setGuidelinesAccepted(true);
    }
    
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        import("@/app/actions/mypage").then(({ getMyProfile }) => {
          getMyProfile().then(res => {
            if (res.success && res.data && res.data.total_contributions > 0) {
              setGuidelinesAccepted(true);
            }
          });
        });
      }
    });

    loadRoom();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!roomInfo?.id) return;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`room-${roomInfo.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomInfo.id}`,
          },
          () => {
            // Reload messages when a new one is inserted
            loadMessages(roomInfo.id);
          }
        )
        .subscribe();
    } catch {
      // Realtime not available (env not configured), fall back to polling only
    }
    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch { /* cleanup */ }
      }
    };
  }, [roomInfo?.id]);

  async function loadRoom() {
    const result = await getTalkRoomBySlug(slug);
    // id: 'temp-id' means the room is a valid phase 3 theme but not yet seeded in DB.
    // However, users shouldn't be here until it's seeded. We require a real DB id.
    if (result.success && result.data && result.data.id && result.data.id !== 'temp-id') {
      const room = result.data as RoomInfo;
      setRoomInfo(room);
      loadMessages(room.id);
      loadPrompts(room.id);
      loadWikiCount(room.id);
      loadRelatedWiki(room.id);
      // Fallback polling (supplements Realtime for reliability)
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => loadMessages(room.id), 30000);
    } else {
      // 亡霊ルート（旧Phase 2の不要なslug等）への侵入をブロックし、正しいトップにリダイレクト
      window.location.href = "/talk";
    }
  }

  async function loadPrompts(roomId: string) {
    setIsLoadingPrompts(true);
    const result = await getRoomPrompts(roomId);
    if (result.success && result.data) setPrompts(result.data);
    setIsLoadingPrompts(false);
  }

  function refreshPrompts() {
    if (roomInfo?.id) loadPrompts(roomInfo.id);
  }

  async function loadWikiCount(roomId: string) {
    const result = await getWikiCountForRoom(roomId);
    setWikiCount(result.count || 0);
  }

  async function loadRelatedWiki(roomId: string) {
    const result = await getRelatedWikiEntries(roomId);
    if (result.success && result.data) setRelatedWiki(result.data as RelatedWiki[]);
  }

  async function loadMessages(roomId: string) {
    const result = await getActiveMessages(roomId);
    if (result.success) {
      const msgs = (result.data as unknown) as Message[];
      setMessages(msgs);
      const dbThanked = msgs.filter(m => m.has_thanked).map(m => m.id);
      if (dbThanked.length > 0) {
        setThankedIds(prev => {
          const newSet = new Set(prev);
          dbThanked.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    }
    setIsLoading(false);
  }

  const [authError, setAuthError] = useState(false);

  // === F2+F3: Safety-checked message handler ===
  function handleMessageChange(text: string) {
    setNewMessage(text);
    setSafetyWarning(null);

    if (text.length > 10) {
      const safety = checkContentSafety(text);
      if (safety.isEmergency) {
        setShowEmergency(true);
      }
      if (safety.hasDangerousAdvice) {
        setSafetyWarning("⚠️ 医療的な判断を含む可能性があります。「うちの場合は」のような体験談の形で共有していただけると安心です。");
      } else if (safety.hasNegativeContent) {
        setSafetyWarning("💚 あんしんキッズは共感と応援の場です。言葉を少しやさしくしてみませんか？");
      }
    }
  }

  async function handleSend(content?: string) {
    const text = content || newMessage;
    if (!text.trim() || isSending || !roomInfo?.id) return;

    // === F5: Show guidelines on first post ===
    if (!guidelinesAccepted) {
      setShowGuidelines(true);
      return;
    }

    // === F3: Final safety check ===
    const safety = checkContentSafety(text);
    if (safety.hasDangerousAdvice) {
      setSafetyWarning("⚠️ この投稿には医療判断に関わる内容が含まれている可能性があります。「うちの場合は〜でした」のように体験談として書き直してみてください。");
      return;
    }

    setIsSending(true);

    const optimisticMsg: Message = {
      id: "opt-" + Date.now(),
      user_id: currentUserId || "temp",
      content: text,
      is_system_bot: false,
      thanks_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72*3600*1000).toISOString(),
      profiles: { display_name: "あなた", avatar_url: null, trust_score: 0 },
      is_optimistic: true
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 20);

    const result = await postMessage(roomInfo.id, text);
    if (result.success) {
      Haptics.success();
      AudioHaptics.playPop();
      setNewMessage("");
      setTimeout(() => {
        const ta = document.getElementById("message-input") as HTMLTextAreaElement;
        if (ta) ta.style.height = 'auto';
      }, 10);
      setSafetyWarning(null);
      setAuthError(false);
      await loadMessages(roomInfo.id);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      // Gap 1: Asset toast with Impact Feedback
      const count = postCount + 1;
      setPostCount(count);
      setShowAssetToast(true);

      // Fetch real impact data to show instead of generic message
      getImpactFeedback().then(r => {
        if (r.success && r.data?.message) {
          setImpactMessage(r.data.message);
        }
      });
      setTimeout(() => { setShowAssetToast(false); setImpactMessage(null); }, 5000);

      // === F7: Milestone celebrations ===
      const stored = parseInt(typeof window !== "undefined" ? (localStorage.getItem("anshin_post_count") || "0") : "0");
      const newTotal = stored + 1;
      if (typeof window !== "undefined") localStorage.setItem("anshin_post_count", String(newTotal));
      if (newTotal === 1) {
        setTimeout(() => { setMilestoneToast("🎉 初めての投稿！ あなたの声がだれかの助けになります"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
      } else if (newTotal === 5) {
        setTimeout(() => { setMilestoneToast("🌿 5回目の投稿！ 知恵袋がどんどん充実しています"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
      } else if (newTotal === 10) {
        setTimeout(() => { setMilestoneToast("✨ 10回目！ たくさんの親子があなたの知恵に出会っています"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
      } else if (newTotal === 25) {
        setTimeout(() => { setMilestoneToast("💚 25回も！ あなたの体験が、この場所をもっと温かくしています"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
      }
    } else if (result.error === "ログインが必要です") {
      setAuthError(true);
    }
    setIsSending(false);
  }

  function acceptGuidelines() {
    localStorage.setItem("anshin_guidelines_accepted", "true");
    setGuidelinesAccepted(true);
    setShowGuidelines(false);
    // Retry send
    if (newMessage.trim()) handleSend();
  }

  function handlePromptClick(prompt: string) {
    setNewMessage(prompt);
    const textarea = document.querySelector("textarea");
    textarea?.focus();
  }

  function handleReply(msg: Message) {
    const preview = msg.content.slice(0, 15).replace(/\n/g, " ");
    setNewMessage(`> ${preview}...\n`);
    const textarea = document.querySelector("textarea");
    textarea?.focus();
  }

  async function handleDelete(messageId: string) {
    if (!confirm("本当にこの投稿を削除しますか？")) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await deleteMessage(messageId);
  }

  async function handleThanks(messageId: string, event?: React.MouseEvent) {
    Haptics.light();
    if (event && !thankedIds.has(messageId)) {
      AudioHaptics.playTink();
      triggerSensoryBurst(event);
    }
    // Optimistic UI: update immediately, then sync with server
    if (thankedIds.has(messageId)) {
      setThankedIds((prev) => { const n = new Set(prev); n.delete(messageId); return n; });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, thanks_count: Math.max(0, m.thanks_count - 1) } : m));
      removeThanks(messageId).catch(() => {
        // Revert on error
        setThankedIds(prev => new Set(prev).add(messageId));
        if (roomInfo?.id) loadMessages(roomInfo.id);
      });
    } else {
      setThankedIds((prev) => new Set(prev).add(messageId));
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, thanks_count: m.thanks_count + 1 } : m));
      sendThanks(messageId).catch(() => {
        // Revert on error
        setThankedIds(prev => { const n = new Set(prev); n.delete(messageId); return n; });
        if (roomInfo?.id) loadMessages(roomInfo.id);
      });
    }
  }

  function getTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "たった今";
    if (m < 60) return `${m}分前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}時間前`;
    return "1日以上前";
  }

  function getExpiresIn(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / 60000);
    if (h > 0) return `あと${h}時間${m}分`;
    if (m > 0) return `あと${m}分`;
    return "まもなく消えます";
  }

  function getAvatarColor(name: string) {
    const colors = ["from-[#7FA77A] to-[#5C8B56]", "from-[#B8956A] to-[#9A7A52]", "from-[#8B9EBF] to-[#6A7FA0]", "from-[#C2917A] to-[#A87060]", "from-[#9BB88F] to-[#7A9E6E]", "from-[#B8A07A] to-[#9A8560]"];
    const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  const handleShareSOS = async (msg: Message) => {
    const textSnippet = msg.content.substring(0, 40) + "...";
    const shareData = {
      title: "教えて！あんしんキッズ",
      text: `誰か分かる人いませんか？😭\n「${textSnippet}」\n`,
      url: `${window.location.origin}/share/talk/${msg.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert("リンクをコピーしました📱");
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("シェアエラー", e);
      }
    }
  };

  const renderedMessages = useMemo(() => {
    if (isLoading) {
      return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>;
    }
    
    if (messages.length === 0) {
      return (
        <div className="empty-state py-12">
          <MessageCircle className="w-12 h-12 text-[var(--color-border)] mb-3" />
          <h3 className="text-[16px] font-bold text-[var(--color-text)]">{roomInfo?.name}の話題はまだありません</h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed max-w-[240px]">
            最初の投稿をしてみませんか？<br/>「うちの場合は…」の体験談が大歓迎です！
          </p>
        </div>
      );
    }

    return messages.map((msg) => {
      const isThanked = msg.has_thanked || thankedIds.has(msg.id);
      const isMyMessage = msg.user_id === currentUserId;
      const opacityClass = msg.is_optimistic ? "opacity-60" : "opacity-100 transition-opacity duration-300";

      return (
        <div key={msg.id} className={`fade-in ${msg.is_optimistic ? 'animate-pulse' : ''} ${opacityClass}`}>
          {msg.is_system_bot ? (
            <div className="chat-bubble system">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span className="text-xs">🤖</span>
                <span className="font-semibold text-[11px]">あんしんBot</span>
              </div>
              {msg.content}
            </div>
          ) : (
            <div className="card p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(msg.user_id)} flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden`}>
                  <User className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[13px] text-[var(--color-text)]">参加者</span>
                    <span className="text-[10px] text-[var(--color-subtle)]">{getTimeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-[14px] leading-[1.8] text-[var(--color-text)] whitespace-pre-wrap">{msg.content}</p>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {!isMyMessage && (
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={(e) => handleThanks(msg.id, e)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all border ${
                          isThanked
                            ? "bg-[var(--color-heart-light)] border-[var(--color-heart)]/30 text-[var(--color-heart)]"
                            : "bg-[var(--color-surface)] border-[var(--color-border-light)] text-[var(--color-subtle)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-warm)]"
                        }`}
                        id={`reaction-thanks-${msg.id}`}
                      >
                        <span>❤️</span>
                        <span className="font-medium">ありがとう</span>
                        {msg.thanks_count > 0 && (
                          <span className="font-bold text-[var(--color-heart)]">{msg.thanks_count}</span>
                        )}
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleReply(msg)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all border bg-[var(--color-surface)] border-[var(--color-border-light)] text-[var(--color-subtle)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-warm)]"
                    >
                      <Reply className="w-3 h-3" />
                      <span className="font-medium">返信</span>
                    </motion.button>
                    <span className="ml-auto text-[10px] text-[var(--color-muted)] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {getExpiresIn(msg.expires_at)}
                    </span>
                    {isMyMessage && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          onClick={() => handleShareSOS(msg)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-[var(--color-accent)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 transition-all rounded-full font-bold shadow-sm"
                        >
                          <Share className="w-3 h-3" />
                          SOS外出し
                        </button>
                        <button onClick={() => handleDelete(msg.id)} className="p-1.5 text-[var(--color-muted)] hover:text-red-500 transition-colors rounded-full hover:bg-red-50" aria-label="投稿を削除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, thankedIds, currentUserId, isLoading, roomInfo]);

  const assetMessages = [
    "✨ あなたの声を受け取りました！ AIが次の整理タイミングで知恵袋に反映します",
    "📖 個人情報は除いてAIが要約します。安心してお書きください",
    "🌱 体験が5件集まるとAIが知恵袋を自動で更新します",
    "💚 名前は出ません。あなたの体験だけが、次の誰かの助けになります",
    "✨ 受け取りました！ 知恵袋への反映は投稿が集まった時点で自動で行われます",
  ];

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/talk" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors active:scale-95" id="back-to-rooms">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-bg-warm)] flex items-center justify-center text-lg shadow-sm">
            {roomInfo?.icon_emoji || "💬"}
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[var(--color-text)]">{roomInfo?.name || ""}</h1>
            <p className="text-[12px] font-medium" style={{ color: 'var(--color-subtle)' }}>{roomInfo?.description || "体験や情報を気軽にシェア"}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* === F2: Emergency Banner === */}
        {showEmergency && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 mb-3 slide-up" id="emergency-banner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-[14px] font-extrabold text-red-700">{EMERGENCY_GUIDANCE.title}</h3>
              </div>
              <button onClick={() => setShowEmergency(false)} className="text-red-400 hover:text-red-600" id="close-emergency">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 mb-3">
              {EMERGENCY_GUIDANCE.steps.map((step, i) => (
                <p key={i} className="text-[12px] text-red-700 font-medium">{step}</p>
              ))}
            </div>
            <p className="text-[11px] text-red-600 font-bold">{EMERGENCY_GUIDANCE.important}</p>
            <a
              href="tel:119"
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold text-[14px] hover:bg-red-700 transition-colors"
              id="call-119"
            >
              <Phone className="w-5 h-5" />
              119番に電話する
            </a>
          </div>
        )}

        {/* Gap 2: Two-layer explanation */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-success-light)]/30 border border-[var(--color-border-light)] mb-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-success)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Leaf className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-[var(--color-text)] leading-relaxed font-medium mb-1.5">
                💬 投稿は消えますが、<strong className="text-[var(--color-primary)]">知恵は永久に残ります</strong>
              </p>
              <div className="flex items-center gap-2 text-[10px] text-[var(--color-subtle)]">
                <span className="flex items-center gap-1 bg-[var(--color-surface)] px-2 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5" /> 発言 → 自動消去</span>
                <ArrowRight className="w-2.5 h-2.5 text-[var(--color-muted)]" />
                <span className="flex items-center gap-1 bg-[var(--color-success-light)] px-2 py-0.5 rounded-full text-[var(--color-success-deep)]"><BookOpen className="w-2.5 h-2.5" /> 一次情報 → 知恵袋に永久保存</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gap 3: Related Wiki Articles */}
        {relatedWiki.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-[var(--color-success)]" />
              <span className="text-[11px] font-bold text-[var(--color-text)]">このテーマの知恵袋 ({relatedWiki.length}件)</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
              {relatedWiki.map((wiki) => (
                <Link key={wiki.id} href={`/wiki/${wiki.slug}`} className="flex-shrink-0 px-3.5 py-2.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-success)]/15 hover:border-[var(--color-success)]/40 transition-all shadow-sm group max-w-[200px]">
                  <p className="text-[11px] font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-success-deep)] transition-colors">📖 {wiki.title}</p>
                  <p className="text-[9px] text-[var(--color-muted)] mt-0.5">{wiki.source_count}件の体験から</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {wikiCount > 0 && relatedWiki.length === 0 && (
          <Link href={`/wiki/${slug}`} className="block mb-2" id="wiki-banner">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-success-light)]/60 to-[var(--color-surface-warm)] border border-[var(--color-success)]/15 hover:border-[var(--color-success)]/30 transition-all hover:shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center"><BookOpen className="w-4 h-4 text-[var(--color-success)]" /></div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">みんなの会話から <strong className="text-[var(--color-success)]">{wikiCount}件</strong> の知恵が生まれました</p>
              </div>
            </div>
          </Link>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="mb-6 fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-success-light)] flex items-center justify-center mx-auto mb-3 text-3xl shadow-sm float">
                {roomInfo?.icon_emoji || "💬"}
              </div>
              <h2 className="text-[16px] font-extrabold text-[var(--color-text)]">「{roomInfo?.name}」について話そう</h2>
              <p className="text-[12px] text-[var(--color-subtle)] mt-1.5 leading-relaxed">まだ投稿がありません。最初の投稿者になりませんか？</p>
            </div>
            <div className="space-y-2.5">
              {isLoadingPrompts ? (
                <>{[1,2,3].map(i => <div key={i} className="shimmer h-14 rounded-2xl" />)}</>
              ) : (
                prompts.map((prompt, i) => (
                  <button key={i} onClick={() => handlePromptClick(prompt)} className="w-full text-left p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all group stagger-item">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 flex items-center justify-center flex-shrink-0"><MessageCircle className="w-4 h-4 text-[var(--color-primary)]" /></div>
                      <span className="text-[13px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors leading-snug">{prompt}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            {!isLoadingPrompts && (
              <button onClick={refreshPrompts} className="flex items-center gap-1.5 mx-auto mt-4 px-4 py-2 rounded-full text-[11px] text-[var(--color-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all" id="refresh-prompts">
                <RefreshCw className="w-3 h-3" /> 別の話題を出す
              </button>
            )}
          </div>
        )}

        {/* Prompt chips */}
        {messages.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
              <span className="text-[10px] font-semibold text-[var(--color-subtle)]">こんな話題で書いてみませんか？</span>
              <button onClick={refreshPrompts} className="ml-auto text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors p-1"><RefreshCw className="w-3 h-3" /></button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {isLoadingPrompts ? <div className="shimmer h-8 w-40 rounded-full flex-shrink-0" /> : (
                prompts.map((prompt, i) => (
                  <button key={i} onClick={() => handlePromptClick(prompt)} className="flex-shrink-0 px-3.5 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all whitespace-nowrap shadow-sm">
                    💬 {prompt.length > 25 ? prompt.slice(0, 25) + "…" : prompt}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {renderedMessages}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Gap 1: Impact Feedback Toast */}
      {showAssetToast && (
        <div className="fixed top-16 left-4 right-4 z-50 slide-up">
          <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)] text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-white" /></div>
              <div className="flex-1">
                <p className="text-[12px] font-bold">投稿しました！</p>
                <p className="text-[11px] text-white/90 leading-snug mt-0.5">
                  {impactMessage || assetMessages[postCount % assetMessages.length]}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === F7: Milestone Toast === */}
      {milestoneToast && (
        <div className="fixed top-16 left-4 right-4 z-50 slide-up">
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
            <p className="text-[13px] font-bold text-center">{milestoneToast}</p>
          </div>
        </div>
      )}

      {/* Auth Error */}
      {authError && (
        <div className="px-4 py-3 bg-[var(--color-warning-light)] border-t border-[var(--color-warning)]/20">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <p className="text-[12px] text-[var(--color-text-secondary)]">💬 投稿するにはログインが必要です</p>
            <a href="/login" className="btn-primary !py-1.5 !px-4 !text-[12px] flex-shrink-0" id="login-from-chat">ログインする</a>
          </div>
        </div>
      )}

      {/* === F3: Safety Warning === */}
      {safetyWarning && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 leading-snug flex-1">{safetyWarning}</p>
            <button onClick={() => setSafetyWarning(null)} className="text-amber-400 hover:text-amber-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm p-4 safe-bottom">
        <div className="flex gap-3 items-end max-w-lg mx-auto">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="体験をざざっと書くだけでOK ✍️"
              className="input-field w-full resize-none max-h-32 transition-none"
              rows={1}
              id="message-input"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              onFocus={() => {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
              }}
              onKeyDown={(e) => { 
                if (e.key === "Enter" && !e.shiftKey) { 
                  e.preventDefault(); 
                  if (!isSending) handleSend(); 
                } 
              }}
            />
            <p className="mt-1 text-[11px] font-medium leading-snug" style={{ color: 'var(--color-muted)' }}>💬 書き込みは一定期間後に消えますが、AIが知恵袋に知識として残します</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()} 
            disabled={!newMessage.trim() || isSending || authError || !!safetyWarning} 
            className="btn-primary flex-shrink-0" id="message-send">
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* === F5: Community Guidelines Modal === */}
      {showGuidelines && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0" onClick={(e) => { if (e.target === e.currentTarget) setShowGuidelines(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGuidelines(false)} />
          <div className="relative w-full max-w-md mx-auto bg-[var(--color-surface)] rounded-3xl shadow-2xl slide-up max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col mb-[env(safe-area-inset-bottom,0px)]">
            <div className="p-5 flex justify-between items-center border-b border-[var(--color-border-light)] bg-white sticky top-0 z-10 shrink-0 rounded-t-3xl">
              <h2 className="text-[17px] font-extrabold text-[var(--color-text)] flex-1 text-center pr-6">
                {COMMUNITY_GUIDELINES.title}
              </h2>
              <button onClick={() => setShowGuidelines(false)} className="w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center text-[var(--color-subtle)] hover:bg-gray-200 absolute right-4">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto pb-24">
              <div className="space-y-3 mb-5">
                {COMMUNITY_GUIDELINES.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--color-surface-warm)]">
                    <span className="text-xl">{rule.emoji}</span>
                    <div>
                      <h4 className="text-[13px] font-bold text-[var(--color-text)]">{rule.title}</h4>
                      <p className="text-[11px] text-[var(--color-subtle)] mt-0.5 leading-relaxed">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-center text-[var(--color-text-secondary)] leading-relaxed mb-6 px-2">
                {COMMUNITY_GUIDELINES.agreement}
              </p>
              <button onClick={acceptGuidelines} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 shadow-md" id="accept-guidelines">
                <ShieldCheck className="w-5 h-5" /> 理解して投稿する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
