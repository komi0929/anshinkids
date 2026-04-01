"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send, MessageCircle, Sparkles, RefreshCw, BookOpen, Clock, ArrowRight, Leaf, Check, AlertTriangle, Phone, ShieldCheck, X } from "@/components/icons";
import {
  getActiveMessages,
  postMessage,
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
    // Check if guidelines were already accepted (must be in useEffect to avoid hydration mismatch)
    if (typeof window !== "undefined") {
      const accepted = localStorage.getItem("anshin_guidelines_accepted");
      if (accepted) setGuidelinesAccepted(true);
    }
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
    if (result.success && result.data) {
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
      // DB lookup failed — seed the room via server action, then retry
      // First set fallback display info immediately
      const CANONICAL_ROOMS: Record<string, { name: string; description: string; icon_emoji: string }> = {
        "daily-food": { name: "毎日のごはん", description: "献立・代替食材・お弁当のリアルな工夫", icon_emoji: "🍚" },
        "products": { name: "使ってよかった市販品", description: "おやつ・パン・調味料のクチコミ", icon_emoji: "🛒" },
        "eating-out": { name: "外食・おでかけ", description: "チェーン店・旅行・イベントの対応", icon_emoji: "🍽️" },
        "school-life": { name: "園・学校との連携", description: "給食・面談・行事の乗り切り方", icon_emoji: "🏫" },
        "challenge": { name: "負荷試験の体験談", description: "準備・当日の流れ・結果後の変化", icon_emoji: "🧪" },
        "skin-body": { name: "肌とからだのケア", description: "アトピー・保湿・スキンケアの工夫", icon_emoji: "🧴" },
        "family": { name: "気持ち・家族・まわり", description: "不安・理解・パートナーや祖父母との関わり", icon_emoji: "👨‍👩‍👧" },
        "milestone": { name: "食べられた！の記録", description: "克服・成長のうれしい報告", icon_emoji: "🌱" },
      };
      const canonical = CANONICAL_ROOMS[slug];
      setRoomInfo({
        id: "",
        name: canonical?.name || slug,
        description: canonical?.description || "体験や情報を気軽にシェア",
        icon_emoji: canonical?.icon_emoji || "💬",
      });
      setIsLoading(false);
      // Set default prompts for canonical rooms when DB is not seeded
      if (canonical) {
        setPrompts(getDefaultPrompts(slug));
        setIsLoadingPrompts(false);
      }
    }
  }

  function getDefaultPrompts(roomSlug: string): string[] {
    const defaults: Record<string, string[]> = {
      "daily-food": ["みんな朝ごはんは何を食べさせてる？", "代替食材で一番使えるのは？", "お弁当のアレルギー対応どうしてる？"],
      "products": ["最近見つけたアレルギー対応おやつは？", "スーパーで買える卵不使用のパンある？", "調味料で気をつけてることは？"],
      "eating-out": ["アレルギー対応してくれたお店教えて！", "旅行先でのごはんどうしてる？", "ファミレスで安心して頼めるメニューは？"],
      "school-life": ["給食の対応、園にどう相談した？", "遠足のお弁当で困ったことある？", "先生への伝え方のコツは？"],
      "challenge": ["負荷試験の前に準備したことは？", "当日の流れを教えて！", "試験後に食べられるようになったものは？"],
      "skin-body": ["保湿剤は何を使ってる？", "お風呂の入り方で工夫してることは？", "アトピーが悪化したときどうしてる？"],
      "family": ["周りに理解してもらうために何をした？", "祖父母への説明で困ったことは？", "不安になったときどうしてる？"],
      "milestone": ["食べられるようになったもの教えて！", "克服までどのくらいかかった？", "成長を感じた瞬間は？"],
    };
    return defaults[roomSlug] || ["このテーマについて体験を教えてください", "困ったことや知りたいことは？", "おすすめの情報があれば共有してください"];
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
    if (result.success) setMessages(result.data as Message[]);
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
    const result = await postMessage(roomInfo.id, text);
    if (result.success) {
      setNewMessage("");
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
        setTimeout(() => { setMilestoneToast("🎉 初めての投稿！ あなたの声がコミュニティの力になります"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
      } else if (newTotal === 5) {
        setTimeout(() => { setMilestoneToast("🌿 5投稿達成！ あなたの知恵がどんどん蓄積されています"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
      } else if (newTotal === 10) {
        setTimeout(() => { setMilestoneToast("⭐ 10投稿！ あなたはコミュニティの大切な柱です"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
      } else if (newTotal === 25) {
        setTimeout(() => { setMilestoneToast("🥇 25投稿達成！ あなたはゴールド貢献者です"); setTimeout(() => setMilestoneToast(null), 5000); }, 4500);
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

  async function handleThanks(messageId: string) {
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

  const assetMessages = [
    "🌱 あなたの体験が、未来の誰かの道しるべになります",
    "✨ AIが知恵として整理し、知恵袋に反映します",
    "📖 投稿は消えても、中の5件で知恵は永久に残ります",
    "💚 同じ悩みを持つ親子を救う力になります",
    "🌿 あなたの声が、コミュニティの資産になっています",
  ];

  return (
    <div className="flex flex-col h-screen">
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
            <p className="text-[12px] font-medium" style={{ color: 'var(--color-subtle)' }}>体験や情報を気軽にシェア</p>
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
          <Link href="/wiki" className="block mb-2" id="wiki-banner">
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
        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="fade-in">
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
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(msg.profiles?.display_name || "匿名")} flex items-center justify-center text-[13px] text-white font-bold flex-shrink-0 shadow-sm`}>
                      {msg.profiles?.display_name?.[0] || "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[13px] text-[var(--color-text)]">{msg.profiles?.display_name || "匿名ユーザー"}</span>
                        {msg.profiles?.trust_score && msg.profiles.trust_score > 30 && (
                          <span className="trust-badge trust-high">✓ 信頼</span>
                        )}
                        <span className="text-[10px] text-[var(--color-subtle)]">{getTimeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-[14px] leading-[1.8] text-[var(--color-text)] whitespace-pre-wrap">{msg.content}</p>

                      {/* Thanks button — the only real reaction */}
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        <button
                          onClick={() => handleThanks(msg.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all border ${
                            thankedIds.has(msg.id)
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
                        </button>
                        <span className="ml-auto text-[10px] text-[var(--color-muted)] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {getExpiresIn(msg.expires_at)}
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
              className="input-field w-full resize-none max-h-32"
              rows={1}
              id="message-input"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <p className="mt-1 text-[11px] font-medium leading-snug" style={{ color: 'var(--color-muted)' }}>💬 投稿は消去 → 5件でAIが知恵袋に永久保存</p>
          </div>
          <button onClick={() => handleSend()} disabled={!newMessage.trim() || isSending} className="btn-primary !p-3 !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-4" id="send-message">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* === F5: Community Guidelines Modal === */}
      {showGuidelines && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowGuidelines(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-4 bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-[18px] font-extrabold text-[var(--color-text)] text-center mb-4">
                {COMMUNITY_GUIDELINES.title}
              </h2>
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
              <p className="text-[12px] text-center text-[var(--color-text-secondary)] leading-relaxed mb-5 px-2">
                {COMMUNITY_GUIDELINES.agreement}
              </p>
              <button onClick={acceptGuidelines} className="btn-primary w-full flex items-center justify-center gap-2" id="accept-guidelines">
                <ShieldCheck className="w-4 h-4" /> 理解して投稿する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
