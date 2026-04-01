"use client";

import { useState, useEffect } from "react";
const _ip = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Heart = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
const BookOpen = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const TrendingUp = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const Award = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>;
const LogOut = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const Pencil = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const Check = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><polyline points="20 6 9 17 4 12" /></svg>;
const X = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const Loader2 = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" /></svg>;
const Sparkles = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M12 3l1.5 4.5H18l-3.5 2.7 1.3 4.3L12 12l-3.8 2.5 1.3-4.3L6 7.5h4.5z" /></svg>;
const Eye = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const MessageCircle = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
import { getMyProfile, updateMyProfile, getMyContributions, getMyImpact, deleteMyAccount } from "@/app/actions/mypage";
import { getContributionStreak } from "@/app/actions/discover";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";

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

interface ImpactData {
  articlesContributed: number;
  totalReaders: number;
  aiAnswersReferenced: number;
  trustDelta: number;
}

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAllergens, setEditAllergens] = useState<string[]>([]);
  const [editAge, setEditAge] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // === F6: Privacy controls ===
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number; totalDays: number } | null>(null);

  async function loadData() {
    setIsLoading(true);
    const [profileResult, contribResult, impactResult] = await Promise.all([
      getMyProfile(),
      getMyContributions(),
      getMyImpact(),
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

    if (impactResult.success && impactResult.data) {
      setImpact(impactResult.data as ImpactData);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
    getContributionStreak().then(r => { if (r.success && r.data) setStreakData(r.data); });
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

  // === F6: Account deletion ===
  async function handleDeleteAccount() {
    setIsDeleting(true);
    const result = await deleteMyAccount();
    if (result.success) {
      localStorage.removeItem("anshin_post_count");
      localStorage.removeItem("anshin_guidelines_accepted");
      window.location.href = "/login";
    }
    setIsDeleting(false);
  }

  function getTrustLabel(score: number) {
    if (score >= 70) return { label: "ゴールド", color: "text-amber-600", bg: "bg-gradient-to-r from-amber-50 to-amber-100/50", icon: "🥇", borderColor: "border-amber-200" };
    if (score >= 40) return { label: "シルバー", color: "text-[var(--color-subtle)]", bg: "bg-gradient-to-r from-[var(--color-surface-warm)] to-gray-100/50", icon: "🥈", borderColor: "border-[var(--color-border)]" };
    return { label: "ブロンズ", color: "text-[var(--color-accent)]", bg: "bg-gradient-to-r from-[var(--color-warning-light)] to-orange-50/50", icon: "🥉", borderColor: "border-[var(--color-accent-light)]" };
  }

  if (isLoading) {
    return (
      <div className="fade-in">
        <div className="px-5 pt-7 pb-5">
          <div className="shimmer h-8 w-40 rounded-xl mb-2" />
          <div className="shimmer h-4 w-64 rounded-lg" />
        </div>
        <div className="px-4">
          <div className="shimmer h-56 rounded-2xl mb-4" />
          <div className="shimmer h-28 rounded-2xl mb-3" />
          <div className="shimmer h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fade-in">
        <div className="empty-state mt-16">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-primary)]/10 flex items-center justify-center mb-2 shadow-sm">
            <span className="text-3xl">🔐</span>
          </div>
          <h3>ログインが必要です</h3>
          <p>マイページを見るにはログインしてください</p>
          <a
            href="/login"
            className="btn-primary mt-6 inline-flex items-center gap-2"
            id="login-from-mypage"
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
      <div className="px-5 pt-7 pb-4">
        <h1 className="text-[24px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight">
          マイページ
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
          あなたの貢献は、ちゃんとみんなの役に立っています
        </p>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-4">
        <div className="card-elevated p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-extrabold text-[var(--color-text)]">プロフィール編集</h3>
                <button onClick={() => setIsEditing(false)} className="text-[var(--color-subtle)] hover:text-[var(--color-text)] transition-colors" id="cancel-edit">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">ニックネーム</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" maxLength={20} id="edit-nickname" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">お子さまのアレルゲン</label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map((allergen) => (
                    <button
                      key={allergen}
                      onClick={() => setEditAllergens((prev) => prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen])}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${editAllergens.includes(allergen) ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]"}`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">お子さまの月齢（月）</label>
                <input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} className="input-field" min={0} max={216} placeholder="例: 36（3歳の場合）" id="edit-age" />
              </div>

              <button onClick={handleSave} disabled={!editName.trim() || isSaving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50" id="save-profile">
                {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>) : (<><Check className="w-4 h-4" /> 保存する</>)}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center text-2xl text-white font-extrabold shadow-md">
                  {profile.display_name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[18px] font-extrabold text-[var(--color-text)]">{profile.display_name}</h2>
                    <button onClick={() => setIsEditing(true)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)] transition-colors" id="edit-profile">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${trustInfo.color} ${trustInfo.bg} border ${trustInfo.borderColor}`}>
                      <Award className="w-3 h-3" />
                      {trustInfo.icon} {trustInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-bg-warm)] rounded-2xl p-3.5 text-center">
                  <BookOpen className="w-4 h-4 text-[var(--color-primary)] mx-auto mb-1.5" />
                  <div className="text-[20px] font-extrabold text-[var(--color-text)]">{profile.total_contributions}</div>
                  <div className="text-[10px] font-medium text-[var(--color-subtle)]">共有数</div>
                </div>
                <div className="bg-gradient-to-br from-[var(--color-heart-light)] to-pink-50/50 rounded-2xl p-3.5 text-center">
                  <Heart className="w-4 h-4 text-[var(--color-heart)] mx-auto mb-1.5" />
                  <div className="text-[20px] font-extrabold text-[var(--color-text)]">{profile.total_thanks_received}</div>
                  <div className="text-[10px] font-medium text-[var(--color-subtle)]">ありがとう</div>
                </div>
                <div className="bg-gradient-to-br from-[var(--color-success-light)] to-green-50/50 rounded-2xl p-3.5 text-center">
                  <TrendingUp className="w-4 h-4 text-[var(--color-success)] mx-auto mb-1.5" />
                  <div className="text-[20px] font-extrabold text-[var(--color-text)]">{contributions.length}</div>
                  <div className="text-[10px] font-medium text-[var(--color-subtle)]">知恵に反映</div>
                </div>
              </div>

              {/* Streak */}
              {streakData && streakData.totalDays > 0 && (
                <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/40">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🔥</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-amber-800">
                        {streakData.currentStreak > 0 ? `${streakData.currentStreak}日連続で貢献中！` : `通算${streakData.totalDays}日参加`}
                      </p>
                      <p className="text-[10px] text-amber-600">
                        最長 {streakData.longestStreak}日ストリーク
                      </p>
                    </div>
                    {/* Mini bar chart */}
                    <div className="flex items-end gap-px">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={`w-1.5 rounded-full ${i < Math.min(streakData.currentStreak, 7) ? "bg-amber-400" : "bg-amber-200"}`} style={{ height: `${8 + i * 2}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Allergen Tags */}
              {(profile.allergen_tags?.length > 0 || profile.child_age_months) && (
                <div className="mt-5 pt-5 border-t border-[var(--color-border-light)]">
                  <p className="text-xs font-semibold text-[var(--color-subtle)] mb-2.5">お子さまのアレルゲン</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergen_tags?.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-[var(--color-surface-warm)] rounded-full text-xs font-semibold text-[var(--color-text-secondary)]">{tag}</span>
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

      {/* === Gap 5: Impact Visualization === */}
      {impact && (impact.totalReaders > 0 || impact.aiAnswersReferenced > 0) && (
        <div className="px-4 mb-6">
          <div className="card-elevated p-5 contrib-highlight">
            <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              あなたの声のインパクト
            </h3>
            <div className="space-y-3">
              {impact.totalReaders > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[var(--color-surface-warm)] to-transparent">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-[var(--color-primary)]" />
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug">
                    あなたの体験が <strong className="text-[var(--color-text)]">{impact.totalReaders}人</strong> の親に読まれました
                  </p>
                </div>
              )}
              {impact.aiAnswersReferenced > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[var(--color-success-light)]/50 to-transparent">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-[var(--color-success)]" />
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug">
                    AIコンシェルジュが <strong className="text-[var(--color-text)]">{impact.aiAnswersReferenced}件</strong> の相談であなたの知恵を引用しました
                  </p>
                </div>
              )}
              {impact.trustDelta > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug">
                    あなたの信頼度が <strong className="text-amber-600">+{impact.trustDelta}</strong> 上がりました
                  </p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-[var(--color-muted)] mt-3 text-center">
              🌿 あなたの声が、同じ悩みの親子を救っています
            </p>
          </div>
        </div>
      )}

      {/* Contributions */}
      <div className="px-4 pb-4">
        <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-1.5 flex items-center gap-2">
          <span className="text-lg">🌱</span>
          あなたの声が知恵になった記録
        </h3>
        <p className="text-[12px] text-[var(--color-subtle)] mb-4 leading-relaxed">
          あなたの投稿がAIによって整理され、知恵袋の記事として保存されています
        </p>

        {contributions.length === 0 ? (
          <div className="card-elevated p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-surface-warm)] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Sparkles className="w-7 h-7 text-[var(--color-success)]" />
            </div>
            <p className="text-[14px] text-[var(--color-text)] mb-1 font-bold">
              まだ知恵に反映された投稿はありません
            </p>
            <p className="text-[12px] text-[var(--color-subtle)] leading-relaxed mb-4">
              「みんなの声」で体験を共有すると、<br/>AIがあなたの知恵を整理して残してくれます
            </p>
            <Link href="/talk" className="btn-primary inline-flex items-center gap-2" id="go-talk-from-mypage">
              💬 みんなの声で話してみる
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map((contrib) => (
              <Link
                key={contrib.id}
                href={contrib.wiki_entries ? `/wiki/${(contrib.wiki_entries as Record<string, string>).slug}` : "/wiki"}
                className="card p-4 stagger-item block hover:border-[var(--color-success)]/30 transition-all"
                id={`contrib-${contrib.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-success-light)] to-green-100/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-lg">🌱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {contrib.wiki_entries && (
                      <h4 className="font-bold text-[14px] text-[var(--color-text)]">
                        {(contrib.wiki_entries as Record<string, string>).title}
                      </h4>
                    )}
                    <p className="text-[12px] text-[var(--color-subtle)] mt-1 line-clamp-2 leading-relaxed">
                      あなたの投稿: 「{contrib.original_message_snippet}」
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-[var(--color-muted)] bg-[var(--color-surface-warm)] px-2 py-0.5 rounded-full">
                        {new Date(contrib.extracted_at).toLocaleDateString("ja-JP")}に反映
                      </span>
                      <span className="text-[10px] text-[var(--color-success)] font-semibold">
                        知恵袋で公開中 →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* === F7: Contribution Streak === */}
      <div className="px-4 mb-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-sm">
              <span className="text-xl">🔥</span>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[var(--color-text)]">
                投稿ストリーク
              </p>
              <p className="text-[11px] text-[var(--color-subtle)]">
                {(() => {
                  const count = parseInt(typeof window !== "undefined" ? localStorage.getItem("anshin_post_count") || "0" : "0");
                  if (count === 0) return "まだ投稿がありません。最初の一歩を踏み出しましょう！";
                  if (count < 5) return `${count}投稿 — いい調子です！5投稿で次のマイルストーン 🌱`;
                  if (count < 10) return `${count}投稿 — 素晴らしい！10投稿でスターバッジ ⭐`;
                  if (count < 25) return `${count}投稿 — コミュニティの大切な柱です！25投稿でゴールド 🥇`;
                  return `${count}投稿 — ゴールド貢献者！あなたの知恵がたくさんの家族を救っています 🏅`;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* === F6: Privacy & Data Controls === */}
      <div className="px-4 pb-4">
        <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <span className="text-lg">🔒</span>
          プライバシー設定
        </h3>

        {/* Data Info */}
        <div className="card p-4 mb-3">
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
            あんしんキッズでは、あなたのデータを大切に扱います。
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              <span>投稿は自動的に消去されますが、知恵は永久に残ります</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              <span>知恵袋の記事は匿名化されて保存されます</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              <span>LINEの友だちリストにはアクセスしません</span>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="card p-4 border-red-200/50">
          <h4 className="text-[13px] font-bold text-[var(--color-danger)] mb-2">⚠️ アカウントとデータの削除</h4>
          <p className="text-[11px] text-[var(--color-subtle)] leading-relaxed mb-3">
            すべてのデータ（プロフィール、投稿履歴、貢献記録）を完全に削除します。
            知恵袋に匿名化済みの情報は残りますが、あなたへの紐付けは解除されます。
          </p>
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-[12px] text-red-700 font-bold mb-1">本当に削除しますか？</p>
                <p className="text-[10px] text-red-600">この操作は取り消せません。</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  id="confirm-delete"
                >
                  {isDeleting ? <><Loader2 className="w-3 h-3 animate-spin" /> 削除中...</> : "完全に削除する"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[12px] text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)]"
                  id="cancel-delete"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-2.5 rounded-xl border border-red-200 text-[12px] text-red-500 hover:bg-red-50 transition-all"
              id="show-delete"
            >
              アカウントを削除する
            </button>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-8 pt-2">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full p-3.5 rounded-2xl border border-[var(--color-border)] text-[13px] text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)] hover:text-[var(--color-danger)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          id="logout-button"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "ログアウト中..." : "ログアウト"}
        </button>
      </div>
    </div>
  );
}
