"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X, Sparkles, ArrowRight, Loader2, Users, Clock } from "lucide-react";
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

  // Modal state
  const [step, setStep] = useState<ModalStep>("closed");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [similarRooms, setSimilarRooms] = useState<SimilarRoom[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = async () => {
    const { data } = await getTalkRooms();
    setRooms(data as Room[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {/* Hero Section */}
      <div className="px-5 pt-8 pb-6">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">
          みんなの声 🌱
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
          同じ悩みを持つママ・パパの体験がここに集まります。<br />
          あなたの一言が、誰かの助けになります。
        </p>
      </div>

      {/* Community Stats Banner */}
      <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-success-light)] border border-[var(--color-border-light)]">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm">🐣</div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center text-sm">🌿</div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-warning)]/20 flex items-center justify-center text-sm">🧡</div>
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-medium text-[var(--color-text)]">
              みんなでつくる、アレルギーの知恵袋
            </p>
            <p className="text-[11px] text-[var(--color-subtle)] mt-0.5">
              あなたの経験がAIによって整理され、「みんなの知恵」に変わります
            </p>
          </div>
        </div>
      </div>

      {/* How It Works - Inline Guide */}
      <div className="mx-4 mb-5 flex gap-2">
        <div className="flex-1 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] text-center">
          <div className="text-lg mb-1">💬</div>
          <p className="text-[10px] font-medium text-[var(--color-text)]">体験を共有</p>
          <p className="text-[9px] text-[var(--color-subtle)] mt-0.5">気軽にひとこと</p>
        </div>
        <div className="flex items-center text-[var(--color-muted)]">→</div>
        <div className="flex-1 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] text-center">
          <div className="text-lg mb-1">🤖</div>
          <p className="text-[10px] font-medium text-[var(--color-text)]">AIが整理</p>
          <p className="text-[9px] text-[var(--color-subtle)] mt-0.5">毎晩自動で抽出</p>
        </div>
        <div className="flex items-center text-[var(--color-muted)]">→</div>
        <div className="flex-1 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] text-center">
          <div className="text-lg mb-1">📖</div>
          <p className="text-[10px] font-medium text-[var(--color-text)]">知恵になる</p>
          <p className="text-[9px] text-[var(--color-subtle)] mt-0.5">みんなの役に立つ</p>
        </div>
      </div>

      {/* Ephemeral Notice */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-[var(--color-success-light)]/50 border border-[var(--color-success)]/15">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[var(--color-success)] flex-shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            <span className="font-medium">投稿は24時間で消えます</span> — 気軽に話せて、発言が残る心配なし
          </p>
        </div>
      </div>

      {/* Section Label */}
      <div className="px-5 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">テーマ一覧</span>
        </div>
        <span className="text-[10px] text-[var(--color-muted)]">{rooms.length}テーマ</span>
      </div>

      {/* Room List */}
      <div className="px-4 space-y-2 pb-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer h-[68px] rounded-2xl" />
            ))}
          </div>
        ) : (
          rooms.map((room, index) => (
            <Link
              key={room.id || index}
              href={`/talk/${room.slug}`}
              className="card card-active block p-3.5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-warm)] flex items-center justify-center text-xl flex-shrink-0">
                  {room.icon_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[14px] text-[var(--color-text)]">
                    {room.name}
                  </h3>
                  <p className="text-[11px] text-[var(--color-subtle)] mt-0.5 truncate">
                    {room.description}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-[var(--color-muted)] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        )}

        {/* Add New Theme Button */}
        <button
          onClick={openModal}
          className="w-full p-3.5 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-surface-warm)] group-hover:bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] transition-colors" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-[14px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                テーマを提案する ✨
              </h3>
              <p className="text-[11px] text-[var(--color-subtle)] mt-0.5">
                「こんなテーマほしい！」をみんなと一緒に育てよう
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-surface)] rounded-t-3xl px-6 pt-6 pb-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {step === "similar" ? "💡 似たテーマがあります" : "✨ 新しいテーマを提案"}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-subtle)]" />
              </button>
            </div>

            <div className="px-6 pb-8">
              {(step === "input" || step === "checking") && (
                <div className="space-y-5">
                  <p className="text-[12px] text-[var(--color-text-secondary)] -mt-1 leading-relaxed">
                    あなたが話したいテーマを教えてください。<br />
                    みんなが集まって、一緒に知恵をつくっていく場になります。
                  </p>

                  {/* Emoji Picker */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                      アイコンを選んでね
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setNewEmoji(emoji)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${
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
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
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
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                      どんな話をしたい？
                    </label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="例: ナッツアレルギーの負荷試験や、外出先での注意など..."
                      className="input-field resize-none"
                      rows={3}
                      maxLength={200}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-[var(--color-danger)] bg-red-50 p-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleCheckSimilar}
                    disabled={step === "checking" || !newName.trim()}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {step === "checking" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        みんなのテーマと照らし合わせ中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        このテーマをつくる
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "similar" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20">
                    <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                      「<strong>{newName}</strong>」に近いテーマが
                      すでにあります！こちらで話してみませんか？ 😊
                    </p>
                  </div>

                  <div className="space-y-2">
                    {similarRooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/talk/${room.slug}`}
                        onClick={closeModal}
                        className="card card-active block p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-warm)] flex items-center justify-center text-xl flex-shrink-0">
                            {room.icon_emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[14px] text-[var(--color-text)]">
                              {room.name}
                            </h4>
                            <p className="text-[11px] text-[var(--color-subtle)] truncate">
                              {room.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[var(--color-muted)] flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[var(--color-border-light)]">
                    <p className="text-[11px] text-[var(--color-subtle)] text-center mb-3">
                      それでも新しくつくりたい場合はこちら 👇
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
                  <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-3" />
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
