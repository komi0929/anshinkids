"use client";

import { useState } from "react";
import { Heart, BookOpen, TrendingUp, LogOut, Check, Loader2, Sparkles, Settings, X, Share } from "@/components/icons";
import { deleteMyAccount, updateMyProfile } from "@/app/actions/mypage";
import { motion } from "framer-motion";

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
  
  if (!name || typeof name !== "string") {
    return <div className="w-full h-full bg-gradient-to-br from-[#8B9EBF] to-[#6A7FA0] text-white font-extrabold flex items-center justify-center text-3xl rounded-2xl">👤</div>;
  }
  
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

interface RecommendedWikiData {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MyPageClient({ initialData }: { initialData: any }) {
  const [profile, setProfile] = useState<Profile | null>(initialData?.data?.profile || null);
  const [contributions, setContributions] = useState<Contribution[]>(initialData?.data?.contributions || []);
  const [impact, setImpact] = useState<ImpactData | null>(initialData?.data?.impact || null);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>(initialData?.data?.bookmarks || []);
  const [recommendedWikis, setRecommendedWikis] = useState<RecommendedWikiData[]>(initialData?.data?.recommendedWikis || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // === F6: Privacy controls ===
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number; totalDays: number } | null>(initialData?.data?.streak || null);
  const initErrText = initialData?.error || "";
  const initIsAuthErr = initErrText.includes("ログイン") || initErrText.includes("認証") || initErrText.includes("DB未接続");
  const [hasError, setHasError] = useState(initialData?.success === false && !initIsAuthErr);
  const [errorMsg, setErrorMsg] = useState(initIsAuthErr ? "" : "接続エラーが発生しました。ページを再読み込みしてください。");

  // Profile Basic Info Edit Modal
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editName, setEditName] = useState((initialData?.data?.profile as any)?.display_name || "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editAvatar, setEditAvatar] = useState<string | null>((initialData?.data?.profile as any)?.avatar_url || null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  async function loadData() {
    setIsLoading(true);
    const { getFullMyPageData } = await import("@/app/actions/mypage");
    const result = await getFullMyPageData();
    if (result.success && result.data) {
      const d = result.data;
      if (d.profile) {
        setProfile(d.profile as unknown as Profile);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEditName((d.profile as any).display_name || "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEditAvatar((d.profile as any).avatar_url);
      }
      setBookmarks(d.bookmarks as unknown as BookmarkData[]);
      setStreakData(d.streak as { currentStreak: number; longestStreak: number; totalDays: number } | null);
      if (d.contributions) setContributions(d.contributions as unknown as Contribution[]);
      if (d.impact) setImpact(d.impact as unknown as ImpactData);
    } else {
      const errText = result.error || "";
      // Auth-related errors → show login prompt (profile stays null)
      if (errText.includes("ログイン") || errText.includes("認証") || errText.includes("DB未接続")) {
        setHasError(false); // Let the !profile fallback handle it
      } else {
        setHasError(true);
        setErrorMsg("接続エラーが発生しました。ページを再読み込みしてください。");
      }
    }
    setIsLoading(false);
  }

  // Save function is now handled purely inside OnboardingWizard. Update UI optimistically to prevent 5-second reload wait.
  function handleWizardComplete(prefs: UserPreferences) {
    setIsEditing(false);
    if (profile) {
      setProfile({
        ...profile,
        children_profiles: prefs.children as unknown as ChildProfile[]
      });
    }
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
      setShowProfileEdit(false);
      setIsSavingProfile(false);
      if (profile) setProfile({ ...profile, display_name: editName.trim(), avatar_url: editAvatar });
    } else {
      setIsSavingProfile(false);
      alert(result.error || "設定の保存に失敗しました");
    }
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
    } else {
      setIsDeleting(false);
      alert(result.error || "アカウントの削除に失敗しました。");
    }
  }

  const handleShareImpact = async () => {
    if (!impact) return;
    const shareText = `あんしんキッズで、私の体験が「${impact.articlesHelped}件のまとめ記事」として採用され、「${impact.thanks}人」のパパ・ママから感謝されました！\nアレルギーを持つ親子に役立つコミュニティです✨\n#あんしんキッズ #食物アレルギー`;
    const url = `${window.location.origin}/`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "あんしんキッズでの貢献",
          text: shareText,
          url: url
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      alert("実績をコピーしました！SNSでシェアしましょう。");
    }
  };

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

  if (hasError && errorMsg) {
    return (
      <div className="fade-in">
        <div className="empty-state mt-16">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-primary)]/10 flex items-center justify-center mb-2 shadow-sm">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3>エラーが発生しました</h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-2">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            ページを再読み込み
          </button>
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

  return (
    <div className="fade-in pb-4">
      {/* Top action bar */}
      <div className="flex justify-between items-center px-5 pt-6 pb-2">
        <div>
          <h1 className="text-[24px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight break-keep text-balance">
            マイページ
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 font-medium">
            あなたの回答が、みんなのまとめ記事になります。
          </p>
        </div>

      </div>

      {isEditing && (
        <OnboardingWizard
          initialPrefs={getMigratedInitialPrefs()}
          onSkip={() => setIsEditing(false)}
          onComplete={handleWizardComplete}
        />
      )}

      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="px-4 mb-4"
      >
        <div className="bg-white/90 backdrop-blur-md border border-[var(--color-border-light)] rounded-[32px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 relative shrink-0">
                    {renderAvatar(profile.avatar_url, profile.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-black text-[var(--color-text)] truncate">{profile.display_name}</h2>
                  </div>
                </div>
                <button onClick={() => setShowProfileEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface-warm)] hover:bg-[var(--color-border-light)] text-[11px] font-bold text-[var(--color-text-secondary)] rounded-full transition-colors flex-shrink-0">
                  <Settings className="w-3.5 h-3.5" /> 変更
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }} className="bg-[var(--color-surface-warm)] rounded-[20px] p-4 text-center border border-[var(--color-border-light)] transform transition-transform hover:scale-105">
                  <BookOpen className="w-5 h-5 text-[var(--color-text)] mx-auto mb-2 opacity-50" />
                  <div className="text-[20px] font-black text-[var(--color-text)] leading-none">{profile.total_contributions}</div>
                  <div className="text-[10px] font-bold text-[var(--color-subtle)] mt-1.5 break-keep text-balance line-clamp-2 leading-tight">発言回数</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="bg-rose-50/70 rounded-[20px] p-4 text-center border border-rose-100 transform transition-transform hover:scale-105">
                  <Heart className="w-5 h-5 text-rose-400 mx-auto mb-2" />
                  <div className="text-[20px] font-black text-rose-600 leading-none">{profile.total_thanks_received}</div>
                  <div className="text-[10px] font-bold text-rose-400 mt-1.5 break-keep text-balance line-clamp-2 leading-tight">いいね</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="bg-emerald-50/70 rounded-[20px] p-4 text-center border border-emerald-100 transform transition-transform hover:scale-105">
                  <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                  <div className="text-[20px] font-black text-emerald-600 leading-none">{contributions.length}</div>
                  <div className="text-[10px] font-bold text-emerald-500 mt-1.5 break-keep text-balance line-clamp-2 leading-tight">まとめ記事へ採用</div>
                </motion.div>
              </div>

              {/* Streak */}
              {streakData && streakData.totalDays > 0 && (
                <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-[var(--color-warning)]/30">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🔥</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-[var(--color-warning)]">
                        {streakData.currentStreak > 0 ? `${streakData.currentStreak}日連続で遊びにきてるね！` : `通算${streakData.totalDays}日参加`}
                      </p>
                      <p className="text-[10px] text-[var(--color-warning)]">
                        最長 {streakData.longestStreak}日連続アクセス
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
              <div className="mt-5 pt-4 border-t border-[var(--color-border-light)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-black text-[var(--color-text-secondary)]">登録されているお子さま情報</p>
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-warm)] hover:bg-[var(--color-border-light)] transition-colors px-3 py-1.5 rounded-full">
                    <Settings className="w-3.5 h-3.5" /> 変更
                  </button>
                </div>
                <div className="space-y-2">
                  {getMigratedInitialPrefs().children.length === 0 ? (
                    <p className="text-[12px] font-bold text-[var(--color-muted)] bg-[var(--color-surface-warm)] p-3 rounded-2xl">未設定</p>
                  ) : (
                    getMigratedInitialPrefs().children.map((child, idx) => (
                      <div key={child.id || idx} className="bg-[var(--color-surface-warm)] rounded-2xl p-3 flex flex-col gap-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/40 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center justify-between z-10">
                          <span className="font-extrabold text-[13px] text-[var(--color-text)]">{child.name}</span>
                          {child.ageGroup && <span className="text-[10px] font-black bg-white/80 px-2.5 py-1 rounded-full text-[var(--color-subtle)]">{child.ageGroup}才</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 z-10">
                          {child.allergens.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-white shadow-sm rounded-full text-[11px] font-bold text-[var(--color-text)]">{tag}</span>
                          ))}
                          {child.customAllergens.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-white border border-dashed border-[var(--color-border)] rounded-full text-[11px] font-bold text-[var(--color-text-secondary)]">{tag}</span>
                          ))}
                          {child.allergens.length === 0 && child.customAllergens.length === 0 && (
                            <span className="text-[11px] font-bold text-[var(--color-muted)]">アレルギー登録なし</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
        </div>
      </motion.div>

      {/* === F8: Visual Impact Dashboard (Bento UI) === */}
      {impact && (impact.articlesHelped > 0 || (impact.recentImpacts && impact.recentImpacts.length > 0)) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="px-4 mb-6"
        >
          <h3 className="text-[16px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2 break-keep text-balance">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            みんなへのお役立ち
          </h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] mb-4 leading-relaxed font-medium">
            あなたの回答は、同じ悩みを抱える親御さんのための大切なまとめ記事として残ります。
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-green-50 border border-green-100 flex flex-col justify-between h-28 shadow-sm relative overflow-hidden group hover:border-[var(--color-success)]/40 transition-colors">
              <div className="absolute -right-2 -bottom-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">📖</div>
              <p className="text-[11px] font-bold text-[var(--color-text-secondary)]">まとめ記事への採用</p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-extrabold text-[var(--color-success-deep)]">{impact.articlesHelped}</span>
                <span className="text-[11px] font-semibold text-[var(--color-success)] mb-1">件</span>
              </div>
            </div>
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-pink-50 border border-pink-100 flex flex-col justify-between h-28 shadow-sm relative overflow-hidden group hover:border-[var(--color-heart)]/40 transition-colors">
              <div className="absolute -right-2 -bottom-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">❤️</div>
              <p className="text-[11px] font-bold text-[var(--color-text-secondary)]">あなたの情報で助かった親御さん</p>
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
                       <Check className="w-3 h-3" /> まとめ記事に採用されました
                     </p>
                     <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1.5 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors break-keep text-balance">
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

          <div className="mt-4 flex justify-center">
             <button
                onClick={handleShareImpact}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[var(--color-border)] shadow-sm text-[var(--color-text)] font-semibold text-[13px] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
             >
                <Share className="w-4 h-4" />
                自分の貢献実績をSNSでシェア
             </button>
          </div>
        </motion.div>
      )}

      {/* === F9: Bookmarked Snippets (Micro-Bookmarking) === */}
      {bookmarks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="px-4 mb-6"
        >
          <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2 break-keep text-balance">
            <span className="text-xl">🔖</span>
            お気に入り
          </h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] mb-3 font-medium">
            お気に入りの情報にいつでもアクセスできます。
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
                    {bm.wiki_entries.category} / {bm.wiki_entries.title.replace("【みんなの知恵袋】", "").trim()}
                  </p>
                  <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1.5 leading-tight break-keep text-balance">
                    {bm.snippet_title}
                  </h4>
                  <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed bg-[var(--color-surface-warm)] p-2.5 rounded-xl">
                    {bm.snippet_content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* === F10: Recommended Wiki Entries (Age/Allergen Context) === */}
      {recommendedWikis.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="px-4 mb-6"
        >
          <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2 break-keep text-balance">
            <span className="text-xl">✨</span>
            あなたへの特別なおすすめ
          </h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] mb-3 font-medium">
            設定されたお子様の年齢やアレルギー情報に基づき、いま役立つ知恵袋を厳選しました。
          </p>
          <div className="space-y-3">
            {recommendedWikis.map((wiki) => (
              <Link
                key={wiki.id}
                href={`/wiki/${wiki.slug}`}
                className="block p-4 rounded-2xl bg-gradient-to-br from-[#FFFBF0] to-white border border-[#FBECC8] hover:border-[#F2D696] hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#FFF3D6] to-transparent rounded-bl-[32px] opacity-50 pointer-events-none" />
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[10px] text-[#A67C00]/80 mb-1.5 flex items-center gap-1 font-bold">
                    <BookOpen className="w-3 h-3" />
                    {wiki.category}
                  </p>
                  <h4 className="text-[14px] font-bold text-[#805F00] mb-1.5 leading-tight break-keep text-balance group-hover:text-[#A67C00] transition-colors">
                    {wiki.title.replace("【みんなの知恵袋】", "").trim()}
                  </h4>
                  <p className="text-[12px] text-[#A67C00]/70 line-clamp-2 leading-relaxed font-medium">
                    {wiki.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Contributions Fallback list (Historical data not in top 3 Bento UI) */}
      {contributions.length > 0 && !(impact && impact.recentImpacts && impact.recentImpacts.length > 0) && (
        <div className="px-4 pb-4">
          <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2 break-keep text-balance">
            <span className="text-lg">🌱</span>
            今までのお話し
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
                        <h4 className="font-bold text-[14px] text-[var(--color-text)] break-keep text-balance">
                          {((contrib.wiki_entries as Record<string, string>).title || "").replace("【みんなの知恵袋】", "").trim()}
                        </h4>
                      )}
                      <p className="text-[12px] text-[var(--color-subtle)] mt-1 line-clamp-2 leading-relaxed">
                        あなたの体験: 「{contrib.original_message_snippet}」
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-[var(--color-muted)] bg-[var(--color-surface-warm)] px-2 py-0.5 rounded-full">
                          {new Date(contrib.extracted_at).toLocaleDateString("ja-JP")}に反映
                        </span>
                        <span className="text-[10px] text-[var(--color-success)] font-semibold">
                          まとめ記事を確認する →
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
          <div className="bg-white rounded-[32px] p-6 text-center border border-[var(--color-border-light)]">
            <div className="w-14 h-14 rounded-[20px] bg-[var(--color-surface-warm)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-border-light)]">
              <Sparkles className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </div>
            <p className="text-[15px] text-[var(--color-text)] mb-1.5 font-black tracking-tight leading-tight break-keep text-balance">
              まだまとめ記事に採用された発言はありません
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed font-medium mb-6 break-keep text-balance">
              トークルームで話題に参加すると、AIが知見を抽出し、まとめ記事へと進化させます。
            </p>
            <Link href="/talk" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[var(--color-text)] text-white text-[14px] font-black hover:scale-[1.02] active:scale-[0.98] transition-transform">
              <span className="text-lg">💬</span> トークルームへ行く
            </Link>
          </div>
         </div>
      )}



      {/* === F6: Privacy & Data Controls === */}
      <div className="px-4 pb-4">
        <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2 break-keep text-balance">
          <span className="text-lg">🔒</span>
          プライバシー設定
        </h3>

        {/* Data Info */}
        <div className="card p-4 mb-3">
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-3 font-medium">
            あんしんキッズは、プライバシー優先のシステム設計です。
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              <span>トークルームの投稿は一定時間経過後に自動消去されます</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              <span>まとめ記事には一切の個人情報を残しません</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <Check className="w-3 h-3 text-[var(--color-success)] flex-shrink-0" />
              <span>LINE上の友だち情報等をシステムが取得することはありません</span>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="card p-4 border-[var(--color-danger)]/30">
          <h4 className="text-[13px] font-bold text-[var(--color-danger)] mb-2 break-keep text-balance">⚠️ アカウントとデータの削除</h4>
          <p className="text-[11px] text-[var(--color-subtle)] leading-relaxed mb-3">
            すべてのデータ（プロフィール、共有記録）を完全に削除します。
            まとめ記事に匿名化済みの情報は残りますが、あなたへの紐付けは解除されます。
          </p>
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[var(--color-danger-light)]0 border border-[var(--color-danger)]/30">
                <p className="text-[12px] text-red-700 font-bold mb-1">本当に削除しますか？</p>
                <p className="text-[10px] text-[var(--color-danger)]">この操作は取り消せません。</p>
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
              className="w-full p-2.5 rounded-xl border border-[var(--color-danger)]/30 text-[12px] text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]0 transition-all"
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
            <h2 className="text-[18px] font-extrabold text-[var(--color-text)] mb-5 text-center break-keep text-balance">プロフィール編集</h2>
            
            <div className="mb-5">
              <label className="block text-[12px] font-bold text-[var(--color-subtle)] mb-2">アイコン</label>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 shrink-0 shadow-sm relative">
                  {renderAvatar(editAvatar, editName || profile?.display_name || "👤")}
                  {editAvatar && (
                    <button onClick={() => setEditAvatar(null)} className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center border text-[var(--color-muted)] shadow-md hover:text-[var(--color-danger)] z-10 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-[var(--color-muted)] leading-relaxed mb-2">
                    自由に写真を追加するか、お好みの絵文字を選択できます。
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface-warm)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-primary)] transition-colors rounded-lg text-[11px] font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)] cursor-pointer">
                    <span className="text-sm">📸</span> 写真を選択
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const img = new window.Image();
                          img.onload = () => {
                            const canvas = document.createElement("canvas");
                            const maxSize = 200;
                            let { width, height } = img;
                            if (width > height) {
                              if (width > maxSize) {
                                height = Math.round(height * maxSize / width);
                                width = maxSize;
                              }
                            } else {
                              if (height > maxSize) {
                                width = Math.round(width * maxSize / height);
                                height = maxSize;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              setEditAvatar(canvas.toDataURL("image/jpeg", 0.7));
                            }
                          };
                          img.src = e.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["👦", "👧", "👨", "👩", "🐻", "🐶", "🐱", "🐰", "🐼", "🐨", "🦊", "🦁"].map(emoji => (
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
                placeholder="表示名（例：ゆいママ）"
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
