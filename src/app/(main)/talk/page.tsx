"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, ArrowRight, Plus, X, Loader2 } from "@/components/icons";
import { getTalkRooms, findSimilarRooms, createTalkRoom } from "@/app/actions/messages";
import { getTrendingTopics, getPersonalizedWikiEntries, getContributionStreak, getWeeklyDigest } from "@/app/actions/discover";

interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  sort_order: number;
}

interface SimilarRoom {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
}

interface TrendingTopic {
  slug: string;
  name: string;
  icon_emoji: string;
  messageCount: number;
  thanksTotal: number;
}

interface PersonalizedEntry {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  source_count: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

interface DigestData {
  newArticles: Array<{ title: string; slug: string; summary: string }>;
  newArticleCount: number;
  messageCount: number;
  uniqueContributors: number;
}

const EMOJI_OPTIONS = [
  "💬", "🥚", "🥛", "🌾", "🍪", "🍽️", "🏫", "👩‍🍳", "🧴", "🏥",
  "💚", "🍞", "🥜", "🦐", "🐟", "🍎", "🧀", "🍫", "🥦", "💊",
  "🩺", "📋", "🎒", "✈️", "🎂", "🧒", "👶", "🤱", "🏠", "🔬",
];

type ModalStep = "closed" | "input" | "checking" | "similar" | "creating";

export default function TalkRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<ModalStep>("closed");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [similarRooms, setSimilarRooms] = useState<SimilarRoom[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === v2: Self-evolving platform features ===
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [personalizedWiki, setPersonalizedWiki] = useState<PersonalizedEntry[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);

  useEffect(() => {
    // Load rooms
    getTalkRooms().then(({ data }) => {
      if (data) setRooms(data as Room[]);
      setIsLoading(false);
    });
    // Load discovery data in parallel (non-blocking)
    getTrendingTopics().then(r => { if (r.success) setTrending(r.data as TrendingTopic[]); });
    getPersonalizedWikiEntries().then(r => {
      if (r.success) {
        setPersonalizedWiki(r.data as PersonalizedEntry[]);
        setIsPersonalized(r.isPersonalized || false);
      }
    });
    getContributionStreak().then(r => { if (r.success && r.data) setStreak(r.data); });
    getWeeklyDigest().then(r => { if (r.success && r.data) setDigest(r.data as DigestData); });
  }, []);

  // Derive recommended rooms from current rooms (no setState in effect)
  const recommendedRooms = (() => {
    if (rooms.length === 0 || typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("anshin_user_preferences");
      if (!stored) return [];
      const prefs = JSON.parse(stored);
      if (!prefs.interests || prefs.interests.length === 0) return [];
      return rooms.filter((r) => (prefs.interests as string[]).includes(r.slug));
    } catch { return []; }
  })();

  function openModal() {
    setStep("input");
    setNewName("");
    setNewDesc("");
    setNewEmoji("💬");
    setSimilarRooms([]);
    setError(null);
  }

  function closeModal() {
    setStep("closed");
  }

  async function handleCheckSimilar() {
    if (!newName.trim()) {
      setError("テーマ名を入力してください");
      return;
    }
    setError(null);
    setStep("checking");

    const result = await findSimilarRooms(newName, newDesc);
    if (result.data && result.data.length > 0) {
      setSimilarRooms(result.data as SimilarRoom[]);
      setStep("similar");
    } else {
      await handleCreate();
    }
  }

  async function handleCreate() {
    setStep("creating");
    const result = await createTalkRoom(newName, newDesc, newEmoji);
    if (result.success && result.data) {
      closeModal();
      // Reload rooms
      const { data } = await getTalkRooms();
      if (data) setRooms(data as Room[]);
    } else {
      setError(result.error || "作成に失敗しました");
      setStep("input");
    }
  }

  return (
    <div className="fade-in">
      {/* Clean Header */}
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-[26px] font-black tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          みんなの声
        </h1>
        <p className="text-[14px] font-medium mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          食物アレルギーの実体験をテーマ別にシェアする場所
        </p>
      </div>

      {/* === Streak Banner (logged-in users only) === */}
      {streak && streak.currentStreak > 0 && (
        <div className="px-4 mb-4 slide-up">
          <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="text-2xl">🔥</div>
            <div className="flex-1">
              <p className="text-[14px] font-bold" style={{ color: 'var(--color-text)' }}>
                {streak.currentStreak}日連続で貢献中！
              </p>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                通算{streak.totalDays}日 · 最長{streak.longestStreak}日ストリーク
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(streak.currentStreak, 7) }).map((_, i) => (
                <div key={i} className={`w-2 h-${2 + Math.min(i, 4)} rounded-full bg-amber-400`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === Weekly Digest Banner === */}
      {digest && digest.messageCount > 0 && (
        <div className="px-4 mb-4 slide-up">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📊</span>
              <span className="text-[14px] font-bold" style={{ color: 'var(--color-text)' }}>今週のコミュニティ</span>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-[20px] font-black" style={{ color: 'var(--color-primary)' }}>{digest.messageCount}</p>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-subtle)' }}>件の投稿</p>
              </div>
              <div>
                <p className="text-[20px] font-black" style={{ color: 'var(--color-primary)' }}>{digest.uniqueContributors}</p>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-subtle)' }}>人が参加</p>
              </div>
              <div>
                <p className="text-[20px] font-black" style={{ color: 'var(--color-primary)' }}>{digest.newArticleCount}</p>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-subtle)' }}>新記事</p>
              </div>
            </div>
            {digest.newArticles.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--color-subtle)' }}>🆕 新しい知恵袋記事</p>
                {digest.newArticles.slice(0, 2).map((a) => (
                  <Link key={a.slug} href={`/wiki/${a.slug}`} className="block text-[13px] font-semibold hover:underline truncate mb-1" style={{ color: 'var(--color-primary)' }}>
                    → {a.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Trending Topics === */}
      {trending.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🔥</span>
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--color-text)' }}>いま盛り上がっている</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {trending.map((t) => (
              <Link
                key={t.slug}
                href={`/talk/${t.slug}`}
                className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                id={`trending-${t.slug}`}
              >
                <span className="text-lg">{t.icon_emoji}</span>
                <div>
                  <p className="text-[13px] font-bold whitespace-nowrap" style={{ color: 'var(--color-text)' }}>{t.name}</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--color-subtle)' }}>
                    {t.messageCount}件の投稿 · ❤️{t.thanksTotal}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info chip */}
      <div className="px-5 mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            投稿は自動消去、会話の知恵はAIが知恵袋に保存
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div className="px-5 mb-3 section-header">
        <h2>
          <MessageCircle size={16} className="text-[var(--color-primary)]" />
          トークルーム
        </h2>
        {rooms.length > 0 && (
          <span className="counter">{rooms.length}件</span>
        )}
      </div>

      {/* Room List */}
      <div className="px-4 space-y-3 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer h-[80px] rounded-2xl" />
            ))}
          </div>
        ) : (
          rooms.map((room, index) => {
            const isRecommended = recommendedRooms.some((r) => r.slug === room.slug);
            return (
              <Link
                key={room.id || index}
                href={`/talk/${room.slug}`}
                className={`card card-tilt card-active block p-4 stagger-item group ${isRecommended ? "ring-1 ring-[var(--color-primary)]/20 bg-[var(--color-surface-warm)]/30" : ""}`}
                id={`talk-room-${room.slug}`}
              >
                <div className="flex items-center gap-4">
                  {/* Emoji container with subtle gradient */}
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[var(--color-surface-warm)] to-white flex items-center justify-center text-[24px] flex-shrink-0 shadow-sm border border-[var(--color-border-light)] group-hover:scale-105 transition-transform">
                    {room.icon_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[15px] group-hover:text-[var(--color-primary)] transition-colors" style={{ color: 'var(--color-text)' }}>
                        {room.name}
                      </h3>
                      {isRecommended && (
                        <span className="text-[9px] font-bold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-2 py-0.5 rounded-full flex-shrink-0">
                          おすすめ
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-medium mt-0.5 truncate leading-relaxed" style={{ color: 'var(--color-subtle)' }}>
                      {room.description}
                    </p>
                  </div>
                  {/* Clean arrow */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                    <ArrowRight size={14} className="text-[var(--color-muted)] group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })
        )}

        {/* Add New Theme Button — clean card style */}
        <button
          onClick={openModal}
          id="propose-theme-button"
          className="w-full p-4 card-dashed group stagger-item"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[var(--color-surface-warm)] group-hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors border border-[var(--color-border-light)]">
              <Plus size={20} className="text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] transition-colors" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-[14px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                テーマを提案する
              </h3>
              <p className="text-[11px] text-[var(--color-subtle)] mt-0.5">
                「こんなテーマほしい！」をみんなと一緒に
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* === Personalized Wiki Recommendations === */}
      {personalizedWiki.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span className="text-sm">{isPersonalized ? "✨" : "📖"}</span>
            <h2 className="text-[14px] font-bold" style={{ color: 'var(--color-text)' }}>
              {isPersonalized ? "あなたへのおすすめ記事" : "人気の知恵袋記事"}
            </h2>
          </div>
          <div className="space-y-2">
            {personalizedWiki.slice(0, 3).map((entry) => (
              <Link
                key={entry.id}
                href={`/wiki/${entry.slug}`}
                className="card card-active block p-3.5 group"
                id={`personalized-wiki-${entry.slug}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-surface-warm)] flex items-center justify-center text-sm flex-shrink-0">
                    📖
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold group-hover:text-[var(--color-primary)] transition-colors truncate" style={{ color: 'var(--color-text)' }}>{entry.title}</h4>
                    <p className="text-[12px] font-medium truncate mt-0.5" style={{ color: 'var(--color-subtle)' }}>{entry.summary}</p>
                  </div>
                  <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--color-muted)' }}>{entry.source_count}件</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {step !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="absolute inset-0 bg-[var(--color-text)]/40 backdrop-blur-sm" />

          <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-surface)] rounded-t-3xl px-6 pt-6 pb-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                {step === "similar" ? "似たテーマがあります" : "新しいテーマを提案"}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors"
                id="close-modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-8">
              {(step === "input" || step === "checking") && (
                <div className="space-y-5">
                  <p className="text-[12px] text-[var(--color-text-secondary)] -mt-1 leading-relaxed">
                    あなたが話したいテーマを教えてください。<br />
                    みんなが集まって、知恵をつくっていく場になります。
                  </p>

                  {/* Emoji Picker */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2">
                      アイコン
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setNewEmoji(emoji)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                            newEmoji === emoji
                              ? "bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)] scale-110"
                              : "bg-[var(--color-surface-warm)] hover:scale-105"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5">
                      テーマ名 <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="例: ナッツアレルギー、旅行時の対応..."
                      className="input-field"
                      maxLength={50}
                      autoFocus
                      id="theme-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5">
                      どんな話をしたい？
                    </label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="例: ナッツアレルギーの子の外食先、習い事での対応など..."
                      className="input-field resize-none"
                      rows={3}
                      maxLength={200}
                      id="theme-desc-input"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] p-3 rounded-xl" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleCheckSimilar}
                    disabled={step === "checking" || !newName.trim()}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50"
                    id="create-theme-button"
                  >
                    {step === "checking" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        照らし合わせ中...
                      </>
                    ) : (
                      "このテーマをつくる"
                    )}
                  </button>
                </div>
              )}

              {step === "similar" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20">
                    <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                      「<strong>{newName}</strong>」に近いテーマが
                      すでにあります！こちらで話してみませんか？
                    </p>
                  </div>

                  <div className="space-y-2">
                    {similarRooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/talk/${room.slug}`}
                        onClick={closeModal}
                        className="card card-active block p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-warm)] flex items-center justify-center text-xl flex-shrink-0">
                            {room.icon_emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[14px] text-[var(--color-text)]">
                              {room.name}
                            </h4>
                            <p className="text-[11px] text-[var(--color-subtle)] truncate">
                              {room.description}
                            </p>
                          </div>
                          <ArrowRight size={16} className="text-[var(--color-muted)] flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[var(--color-border-light)]">
                    <p className="text-[11px] text-[var(--color-subtle)] text-center mb-3">
                      それでも新しくつくりたい場合 ↓
                    </p>
                    <button
                      onClick={handleCreate}
                      className="btn-secondary w-full text-center text-[13px]"
                    >
                      「{newName}」を新しくつくる
                    </button>
                  </div>
                </div>
              )}

              {step === "creating" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 size={32} className="text-[var(--color-primary)] animate-spin mb-3" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    みんなの場をつくっています...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
