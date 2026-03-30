"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTalkRooms, findSimilarRooms, createTalkRoom } from "@/app/actions/messages";

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
  const [recommendedRooms, setRecommendedRooms] = useState<Room[]>([]);

  const loadRooms = async () => {
    const { data } = await getTalkRooms();
    if (data) {
      setRooms(data as Room[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (rooms.length === 0) return;
    try {
      const stored = localStorage.getItem("anshin_user_preferences");
      if (!stored) return;
      const prefs = JSON.parse(stored);
      if (!prefs.interests || prefs.interests.length === 0) return;
      const interestSlugs: string[] = prefs.interests;
      const rec = rooms.filter((r) => interestSlugs.includes(r.slug));
      setRecommendedRooms(rec);
    } catch { /* ignore */ }
  }, [rooms]);

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
      await loadRooms();
    } else {
      setError(result.error || "作成に失敗しました");
      setStep("input");
    }
  }

  return (
    <div className="fade-in">
      {/* Hero Section with fluid blob */}
      <div className="blob-bg px-5 pt-8 pb-5">
        <div className="relative z-10">
          {/* Hand-drawn accent */}
          <span className="inline-block text-[13px] font-semibold tracking-wider text-[var(--color-primary)] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            COMMUNITY
          </span>
          <h1 className="text-[28px] font-black text-[var(--color-text)] tracking-tight leading-[1.3]" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="hand-underline">みんなの声</span>
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-2 leading-relaxed max-w-[280px]">
            食物アレルギーの実体験を<br />テーマ別にシェアする場所
          </p>
        </div>
      </div>

      {/* Info chip */}
      <div className="px-5 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
            投稿は24h後にAIが知恵袋へ整理
          </span>
        </div>
      </div>

      {/* Section Label */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-[var(--color-subtle)]" style={{ fontFamily: 'var(--font-mono)' }}>
          THEMES
        </span>
        <span className="text-[10px] text-[var(--color-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
          {rooms.length} ROOMS
        </span>
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
                      <h3 className="font-bold text-[15px] text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                        {room.name}
                      </h3>
                      {isRecommended && (
                        <span className="text-[9px] font-bold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-2 py-0.5 rounded-full flex-shrink-0">
                          おすすめ
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-subtle)] mt-0.5 truncate leading-relaxed">
                      {room.description}
                    </p>
                  </div>
                  {/* Arrow with hand-drawn feel */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-muted)] group-hover:text-white transition-colors">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })
        )}

        {/* Add New Theme Button */}
        <button
          onClick={openModal}
          id="propose-theme-button"
          className="w-full p-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all group stagger-item tape-accent"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[var(--color-surface-warm)] group-hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors border border-[var(--color-border-light)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] transition-colors">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" /></svg>
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
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--color-muted)] flex-shrink-0">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
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
                  <svg className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" /></svg>
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
