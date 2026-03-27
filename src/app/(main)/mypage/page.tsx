"use client";

import { useState, useEffect } from "react";
import { Heart, BookOpen, TrendingUp, Award, LogOut, Pencil, Check, X, Loader2 } from "lucide-react";
import { getMyProfile, updateMyProfile, getMyContributions } from "@/app/actions/mypage";
import { logoutAction } from "@/app/actions/auth";

const ALLERGEN_OPTIONS = ["卵", "乳", "小麦", "そば", "落花生", "えび", "かに", "ナッツ", "大豆", "ごま", "果物"];

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  trust_score: number;
  total_contributions: number;
  total_thanks_received: number;
  allergen_tags: string[];
  child_age_months: number | null;
}

interface Contribution {
  id: string;
  original_message_snippet: string;
  extracted_at: string;
  wiki_entries: Record<string, string> | null;
}

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAllergens, setEditAllergens] = useState<string[]>([]);
  const [editAge, setEditAge] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [profileResult, contribResult] = await Promise.all([
      getMyProfile(),
      getMyContributions(),
    ]);

    if (profileResult.success && profileResult.data) {
      const p = profileResult.data as Profile;
      setProfile(p);
      setEditName(p.display_name);
      setEditAllergens(p.allergen_tags || []);
      setEditAge(p.child_age_months ? String(p.child_age_months) : "");
    }

    if (contribResult.success && contribResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setContributions(contribResult.data as any as Contribution[]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave() {
    if (!editName.trim()) return;
    setIsSaving(true);
    const result = await updateMyProfile({
      display_name: editName.trim(),
      allergen_tags: editAllergens,
      child_age_months: editAge ? parseInt(editAge) : null,
    });
    if (result.success) {
      setIsEditing(false);
      await loadData();
    }
    setIsSaving(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutAction();
  }

  function getTrustLabel(score: number) {
    if (score >= 70) return { label: "ゴールド", color: "text-amber-600", bg: "bg-amber-50", icon: "🥇" };
    if (score >= 40) return { label: "シルバー", color: "text-[var(--color-subtle)]", bg: "bg-[var(--color-surface-warm)]", icon: "🥈" };
    return { label: "ブロンズ", color: "text-[var(--color-accent)]", bg: "bg-[var(--color-warning-light)]", icon: "🥉" };
  }

  if (isLoading) {
    return (
      <div className="fade-in">
        <div className="px-5 pt-8 pb-5">
          <div className="shimmer h-7 w-40 rounded-lg mb-2" />
          <div className="shimmer h-4 w-64 rounded-lg" />
        </div>
        <div className="px-4">
          <div className="shimmer h-48 rounded-2xl mb-4" />
          <div className="shimmer h-24 rounded-2xl mb-3" />
          <div className="shimmer h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fade-in">
        <div className="empty-state mt-16">
          <div className="text-5xl mb-2">🔐</div>
          <h3>ログインが必要です</h3>
          <p>マイページを見るにはログインしてください</p>
          <a
            href="/login"
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            LINEでログイン
          </a>
        </div>
      </div>
    );
  }

  const trustInfo = getTrustLabel(profile.trust_score);

  return (
    <div className="fade-in pb-4">
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">
          わたしの記録 🌿
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
          あなたの貢献は、ちゃんとみんなの役に立っています
        </p>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <div className="card p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-bold text-[var(--color-text)]">プロフィール編集</h3>
                <button onClick={() => setIsEditing(false)} className="text-[var(--color-subtle)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">ニックネーム</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  お子さまのアレルゲン
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map((allergen) => (
                    <button
                      key={allergen}
                      onClick={() =>
                        setEditAllergens((prev) =>
                          prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        editAllergens.includes(allergen)
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  お子さまの月齢（月）
                </label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="input-field"
                  min={0}
                  max={216}
                  placeholder="例: 36（3歳の場合）"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!editName.trim() || isSaving}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>) : (<><Check className="w-4 h-4" /> 保存する</>)}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-light)] to-[var(--color-primary)] flex items-center justify-center text-2xl text-white font-bold">
                  {profile.display_name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--color-text)]">
                      {profile.display_name}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${trustInfo.color} ${trustInfo.bg}`}>
                      <Award className="w-3 h-3" />
                      {trustInfo.label}
                    </span>
                    <span className="text-xs text-[var(--color-subtle)]">
                      信頼度 {profile.trust_score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--color-surface-warm)] rounded-xl p-3 text-center">
                  <BookOpen className="w-4 h-4 text-[var(--color-primary)] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[var(--color-text)]">
                    {profile.total_contributions}
                  </div>
                  <div className="text-[10px] text-[var(--color-subtle)]">
                    共有数
                  </div>
                </div>
                <div className="bg-[var(--color-success-light)] rounded-xl p-3 text-center">
                  <Heart className="w-4 h-4 text-[var(--color-success)] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[var(--color-text)]">
                    {profile.total_thanks_received}
                  </div>
                  <div className="text-[10px] text-[var(--color-subtle)]">
                    ありがとう
                  </div>
                </div>
                <div className="bg-[var(--color-warning-light)] rounded-xl p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-[var(--color-warning)] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[var(--color-text)]">
                    {contributions.length}
                  </div>
                  <div className="text-[10px] text-[var(--color-subtle)]">
                    知恵に反映
                  </div>
                </div>
              </div>

              {/* Allergen Tags */}
              {(profile.allergen_tags?.length > 0 || profile.child_age_months) && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
                  <p className="text-xs text-[var(--color-subtle)] mb-2">お子さまのアレルゲン</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergen_tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[var(--color-surface-warm)] rounded-full text-xs font-medium text-[var(--color-text-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {profile.child_age_months && (
                      <span className="px-3 py-1 bg-[var(--color-surface-warm)] rounded-full text-xs text-[var(--color-subtle)]">
                        {Math.floor(profile.child_age_months / 12)}歳{profile.child_age_months % 12}ヶ月
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Contributions */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <span className="text-base">🌱</span>
          あなたの声が役に立っています
        </h3>
        <p className="text-[12px] text-[var(--color-subtle)] mb-4">
          あなたの投稿が「みんなの知恵」に反映され、他のママ・パパの助けになっています
        </p>

        {contributions.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-[13px] text-[var(--color-text-secondary)] mb-1 font-medium">
              まだ知恵に反映された投稿はありません
            </p>
            <p className="text-[12px] text-[var(--color-subtle)]">
              「みんなの声」で体験を共有すると、<br/>AIがあなたの知恵を整理して残してくれます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map((contrib) => (
              <div key={contrib.id} className="card p-4 slide-up">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🌱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {contrib.wiki_entries && (
                      <h4 className="font-medium text-[14px] text-[var(--color-text)]">
                        {contrib.wiki_entries.title}
                      </h4>
                    )}
                    <p className="text-[12px] text-[var(--color-subtle)] mt-1 line-clamp-2">
                      あなたの投稿: 「{contrib.original_message_snippet}」
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-[var(--color-muted)]">
                        {new Date(contrib.extracted_at).toLocaleDateString("ja-JP")}に反映
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="px-4 pb-8 pt-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full p-3 rounded-xl border border-[var(--color-border)] text-[13px] text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)] hover:text-[var(--color-danger)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "ログアウト中..." : "ログアウト"}
        </button>
      </div>
    </div>
  );
}
