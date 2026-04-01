"use client";

import { useState, useEffect } from "react";
import { Heart, BookOpen, TrendingUp, Award, LogOut, Pencil, Check, Loader2, Sparkles, Eye, MessageCircle, Settings, Bell, X } from "@/components/icons";
import { getMyProfile, getMyContributions, getMyImpact, deleteMyAccount, updateMyProfile } from "@/app/actions/mypage";
import { getImpactFeedback, getContributionStreak } from "@/app/actions/discover";
import { getMyBookmarks } from "@/app/actions/wiki";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";
import Image from "next/image";
import OnboardingWizard, { UserPreferences, ChildProfile } from "@/components/onboarding-wizard";

function renderAvatar(avatar_url: string | null, name: string) {
  if (avatar_url && avatar_url.startsWith("http")) {
    return (
      <Image 
        src={avatar_url} 
        alt={name || ""} 
        fill 
        unoptimized 
        className="object-cover rounded-2xl" 
      />
    );
  }
  if (avatar_url && avatar_url.length <= 4) return <span className="text-3xl">{avatar_url}</span>;
  const colors = ["from-[#7FA77A] to-[#5C8B56]", "from-[#B8956A] to-[#9A7A52]", "from-[#8B9EBF] to-[#6A7FA0]", "from-[#C2917A] to-[#A87060]", "from-[#9BB88F] to-[#7A9E6E]", "from-[#B8A07A] to-[#9A8560]"];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bg = colors[hash % colors.length];
  return <div className={`w-full h-full bg-gradient-to-br ${bg} text-white font-extrabold flex items-center justify-center text-3xl rounded-2xl`}>{name?.[0] || "👤"}</div>;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  trust_score: number;
  total_contributions: number;
  total_thanks_received: number;
  allergen_tags: string[];
  child_age_months: number | null;
  children_profiles?: ChildProfile[];
}

interface Contribution {
  id: string;
  original_message_snippet: string;
  extracted_at: string;
  wiki_entries: Record<string, string> | null;
}

// Ensure type matches what getImpactFeedback returns
interface ImpactData {
  articlesHelped: number;
  totalSourcesInArticles: number;
  thanks: number;
  trustScore: number;
  message: string;
  recentImpacts?: {
    title: string;
    slug: string;
    category: string;
    snippet: string;
    trustScore: number;
    extractedAt: string;
  }[];
}

interface BookmarkData {
  id: string;
  snippet_title: string;
  snippet_content: string;
  created_at: string;
  wiki_entries: { id: string; title: string; slug: string; category: string };
}

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // === F6: Privacy controls ===
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number; totalDays: number } | null>(null);

  // Profile Basic Info Edit Modal
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const [profileResult, contribResult, impactResult, bookmarksResult] = await Promise.all([
      getMyProfile(),
      getMyContributions(),
      getImpactFeedback(), // Changed from getMyImpact for richer Visual Data
      getMyBookmarks(),
    ]);

    if (profileResult.success && profileResult.data) {
      const p = profileResult.data as Profile;
      setProfile(p);
      setEditName(p.display_name);
      setEditAvatar(p.avatar_url);
    }

    if (contribResult.success && contribResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setContributions(contribResult.data as any as Contribution[]);
    }

    if (impactResult.success && impactResult.data) {
      setImpact(impactResult.data as unknown as ImpactData);
    }

    if (bookmarksResult.success && bookmarksResult.data) {
      setBookmarks(bookmarksResult.data as unknown as BookmarkData[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (!mounted) return;
      loadData();
      getContributionStreak().then(r => { if (r.success && r.data && mounted) setStreakData(r.data); });
    }, 0);
    return () => { mounted = false; };
  }, []);

  // Save function is now handled purely inside OnboardingWizard, we just need to reload
  async function handleWizardComplete() {
    setIsEditing(false);
    await loadData();
  }

  function getMigratedInitialPrefs(): UserPreferences {
    if (!profile) return { children: [], interests: [] };
    if (profile.children_profiles && profile.children_profiles.length > 0) {
      return { children: profile.children_profiles, interests: [] }; /* interests typically mapped elsewhere or locally */
    }
    // Migrate legacy tags
    if (profile.allergen_tags && profile.allergen_tags.length > 0) {
      let ageGroup = "";
      if (profile.child_age_months !== null) {
        if (profile.child_age_months >= 72) ageGroup = "6-12";
        else if (profile.child_age_months >= 36) ageGroup = "3-6";
        else if (profile.child_age_months >= 12) ageGroup = "1-3";
        else ageGroup = "0-1";
      }
      return {
        children: [{
          id: "child-migrated",
          name: "1人目",
          allergens: profile.allergen_tags,
          customAllergens: [],
          ageGroup
        }],
        interests: []
      };
    }
    return { children: [], interests: [] };
  }

  async function handleSaveProfileInfo() {
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    const result = await updateMyProfile({ display_name: editName.trim(), avatar_url: editAvatar });
    if (result.success) {
      await loadData();
      setShowProfileEdit(false);
    }
    setIsSavingProfile(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    // 状態の二重管理（Façade）を防ぎ、別端末や別ユーザーログイン時のデータ漏洩を遮断する
    localStorage.removeItem("anshin_user_preferences");
    localStorage.removeItem("anshin_onboarding_done");
    localStorage.removeItem("anshin_post_count");
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
      {/* Top action bar */}
      <div className="flex justify-between items-center px-5 pt-6 pb-2">
        <div>
          <h1 className="text-[24px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight">
            マイページ
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            あなたの貢献は、ちゃんとみんなの役に立っています
          </p>
        </div>
        <Link href="/notifications" className="w-10 h-10 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-border-light)] transition-colors relative" aria-label="通知を見る">
          <Bell className="w-5 h-5 text-[var(--color-text)]" />
          {(impact && (impact.thanks > 0)) && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-[var(--color-heart)] rounded-full border-2 border-[var(--color-surface)] animate-pulse"></span>
          )}
        </Link>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-4">
        <div className="card-elevated p-6">
          {isEditing ? (
            <OnboardingWizard
              initialPrefs={getMigratedInitialPrefs()}
              onSkip={() => setIsEditing(false)}
              onComplete={handleWizardComplete}
            />
          ) : (
            <>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 shadow-md relative group shrink-0">
                  {renderAvatar(profile.avatar_url, profile.display_name)}
                  <button onClick={() => setShowProfileEdit(true)} className="absolute bottom-[-6px] right-[-6px] w-7 h-7 bg-white rounded-full flex items-center justify-center border border-[var(--color-border)] shadow-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[18px] font-extrabold text-[var(--color-text)] truncate">{profile.display_name}</h2>
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

              {/* Multi-Child Allergen Tags */}
              <div className="mt-5 pt-5 border-t border-[var(--color-border-light)] space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-[var(--color-subtle)]">登録されているお子さま情報</p>
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors bg-[var(--color-surface-warm)] px-2.5 py-1.5 rounded-lg">
                    <Settings className="w-3.5 h-3.5" /> 変更
                  </button>
                </div>
                {getMigratedInitialPrefs().children.length === 0 && (
                  <p className="text-[12px] text-[var(--color-muted)]">アレルゲン情報が未設定です。右上のボタンから設定してください。</p>
                )}
                {getMigratedInitialPrefs().children.map((child, idx) => (
                  <div key={child.id || idx} className="bg-[var(--color-surface-warm)] rounded-xl p-3 border border-[var(--color-border-light)]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-[13px] text-[var(--color-text)]">{child.name}</span>
                      {child.ageGroup && <span className="text-[10px] bg-white border border-[var(--color-border-light)] px-2 py-0.5 rounded-full text-[var(--color-subtle)]">{child.ageGroup}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {child.allergens.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white border border-[var(--color-border-light)] rounded-md text-[11px] font-bold text-[var(--color-text-secondary)]">{tag}</span>
                      ))}
                      {child.customAllergens.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white border border-dashed border-[var(--color-border)] rounded-md text-[11px] font-bold text-[var(--color-text-secondary)]">{tag}</span>
                      ))}
                      {child.allergens.length === 0 && child.customAllergens.length === 0 && (
                        <span className="text-[11px] text-[var(--color-muted)]">アレルゲン設定なし</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* === F8: Visual Impact Dashboard (Bento UI) === */}
      {impact && (impact.articlesHelped > 0 || (impact.recentImpacts && impact.recentImpacts.length > 0)) && (
        <div className="px-4 mb-6">
          <h3 className="text-[16px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            貢献の証明（Proof of Impact）
          </h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">
            ここで共有していただいた体験は消えずに、すでに多くの保護者を支える「知恵袋の資産」として活躍しています。
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-green-50 border border-green-100 flex flex-col justify-between h-28 shadow-sm relative overflow-hidden group hover:border-[var(--color-success)]/40 transition-colors">
              <div className="absolute -right-2 -bottom-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">📖</div>
              <p className="text-[11px] font-bold text-[var(--color-text-secondary)]">反映された記事</p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-extrabold text-[var(--color-success-deep)]">{impact.articlesHelped}</span>
                <span className="text-[11px] font-semibold text-[var(--color-success)] mb-1">件</span>
              </div>
            </div>
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-pink-50 border border-pink-100 flex flex-col justify-between h-28 shadow-sm relative overflow-hidden group hover:border-[var(--color-heart)]/40 transition-colors">
              <div className="absolute -right-2 -bottom-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">❤️</div>
              <p className="text-[11px] font-bold text-[var(--color-text-secondary)]">みんなからの感謝</p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-extrabold text-[var(--color-heart)]">{impact.thanks}</span>
                <span className="text-[11px] font-semibold text-pink-500 mb-1">人</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {impact.recentImpacts && impact.recentImpacts.map((imp, idx) => (
              <Link 
                key={idx}
                href={`/wiki/${imp.slug}`}
                className="block p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 flex items-center justify-center flex-shrink-0">
                     <BookOpen className="w-5 h-5 text-[var(--color-primary)] opacity-80" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[10px] text-[var(--color-success)] font-bold mb-1 flex items-center gap-1">
                       <Check className="w-3 h-3" /> 知恵袋に採用されました
                     </p>
                     <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1.5 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                       {imp.title}
                     </h4>
                     <div className="text-[12px] bg-[var(--color-surface-warm)] rounded-xl p-2.5 text-[var(--color-text-secondary)] leading-relaxed relative">
                       <div className="absolute left-0 top-1/2 -mt-1.5 -ml-1.5 border-[6px] border-transparent border-r-[var(--color-surface-warm)]" />
                       <span className="font-semibold opacity-70">あなたの体験:</span><br/>
                       「{imp.snippet.length > 40 ? imp.snippet.slice(0, 40) + "..." : imp.snippet}」
                     </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* === F9: Bookmarked Snippets (Micro-Bookmarking) === */}
      {bookmarks.length > 0 && (
        <div className="px-4 mb-6">
          <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <span className="text-xl">🔖</span>
            お気に入り
          </h3>
          <p className="text-[12px] text-[var(--color-subtle)] mb-3 leading-relaxed">
            保存した役立つ知恵にいつでもアクセスできます。
          </p>
          <div className="space-y-3">
            {bookmarks.map((bm) => (
              <Link
                key={bm.id}
                href={`/wiki/${bm.wiki_entries.slug}`}
                className="block p-4 rounded-2xl bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[var(--color-subtle)] mb-1.5 flex items-center gap-1 group-hover:text-[var(--color-primary)] transition-colors">
                    <BookOpen className="w-3 h-3" />
                    {bm.wiki_entries.category} / {bm.wiki_entries.title}
                  </p>
                  <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1.5 leading-tight">
                    {bm.snippet_title}
                  </h4>
                  <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed bg-[var(--color-surface-warm)] p-2.5 rounded-xl">
                    {bm.snippet_content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Contributions Fallback list (Historical data not in top 3 Bento UI) */}
      {contributions.length > 0 && !(impact && impact.recentImpacts && impact.recentImpacts.length > 0) && (
        <div className="px-4 pb-4">
          <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <span className="text-lg">🌱</span>
            過去の抽出履歴
          </h3>
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
                          知恵袋を確認する →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
        </div>
      )}

      {contributions.length === 0 && (
         <div className="px-4 pb-6">
          <div className="card-elevated p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-surface-warm)] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Sparkles className="w-7 h-7 text-[var(--color-success)]" />
            </div>
            <p className="text-[14px] text-[var(--color-text)] mb-1 font-bold">
              まだ知恵に反映された投稿はありません
            </p>
            <p className="text-[12px] text-[var(--color-subtle)] leading-relaxed mb-4">
              「みんなの声」で体験を共有すると、<br/>AIがあなたの知恵を整理してプラットフォームの資産として残してくれます
            </p>
            <Link href="/talk" className="btn-primary inline-flex items-center gap-2" id="go-talk-from-mypage">
              💬 みんなの声で話してみる
            </Link>
          </div>
         </div>
      )}

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
                  if (!profile) return "データを読み込み中...";
                  const count = profile.total_contributions;
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

      {/* Profile Basic Auth Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowProfileEdit(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[var(--color-surface)] rounded-3xl shadow-2xl slide-up p-6">
            <h2 className="text-[18px] font-extrabold text-[var(--color-text)] mb-5 text-center">プロフィール編集</h2>
            
            <div className="mb-5">
              <label className="block text-[12px] font-bold text-[var(--color-subtle)] mb-2">アイコン</label>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 shrink-0 shadow-sm relative">
                  {renderAvatar(editAvatar, editName || profile?.display_name || "👤")}
                  {editAvatar && (
                    <button onClick={() => setEditAvatar(null)} className="absolute top-[-4px] right-[-4px] w-5 h-5 bg-white rounded-full flex items-center justify-center border text-[var(--color-muted)] hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 text-[11px] text-[var(--color-muted)] leading-relaxed">
                  下のリストから選ぶか、そのままにしてLINEのアイコン（取得済みの場合）を表示します。
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["👦", "👧", "👨", "👩", "🐻", "🐶", "🐱", "🐰", "🐼", "🐨"].map(emoji => (
                  <button key={emoji} onClick={() => setEditAvatar(emoji)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${editAvatar === emoji ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border-light)] bg-white hover:bg-[var(--color-surface-warm)]"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[12px] font-bold text-[var(--color-subtle)] mb-2">表示名</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={20}
                className="w-full text-[14px] px-4 py-3 rounded-xl border border-[var(--color-border-light)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                placeholder="あんしんユーザー"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveProfileInfo}
                disabled={isSavingProfile || !editName.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3 disabled:opacity-50"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存する"}
              </button>
              <button onClick={() => setShowProfileEdit(false)} className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-[13px] font-bold text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)]">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
