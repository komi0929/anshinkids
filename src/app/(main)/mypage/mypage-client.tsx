"use client";

import { useState, useEffect } from "react";
import { BookOpen, LogOut, Check, Loader2, Sparkles, Settings, X, ChevronRight, ChevronDown, Bell, Bookmark } from "@/components/icons";
import { deleteMyAccount, updateMyProfile } from "@/app/actions/mypage";
import { getPersonalizedWikiEntries } from "@/app/actions/discover";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";
import Image from "next/image";
import OnboardingWizard, { UserPreferences, ChildProfile } from "@/components/onboarding-wizard";
import TopicBookmarkButton from "@/components/topic-bookmark-button";

function renderAvatar(avatar_url: string | null, name: string, rounded = "rounded-full") {
  if (avatar_url && (avatar_url.startsWith("http") || avatar_url.startsWith("data:image"))) {
    return (
      <Image 
        src={avatar_url} 
        alt={name || ""} 
        fill 
        unoptimized 
        className={`object-cover ${rounded}`} 
      />
    );
  }
  if (avatar_url && avatar_url.length <= 4) return <div className={`w-full h-full bg-gradient-to-br from-[#E8D5C4] to-[#C9D6C8] flex items-center justify-center text-2xl ${rounded}`}>{avatar_url}</div>;
  const colors = ["from-[#7FA77A] to-[#5C8B56]", "from-[#B8956A] to-[#9A7A52]", "from-[#8B9EBF] to-[#6A7FA0]", "from-[#C2917A] to-[#A87060]", "from-[#9BB88F] to-[#7A9E6E]", "from-[#B8A07A] to-[#9A8560]"];
  
  if (!name || typeof name !== "string") {
    return <div className={`w-full h-full bg-gradient-to-br from-[#8B9EBF] to-[#6A7FA0] text-white font-extrabold flex items-center justify-center text-xl ${rounded}`}>👤</div>;
  }
  
  const hash = name?.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
  const bg = colors[hash % colors.length];
  return <div className={`w-full h-full bg-gradient-to-br ${bg} text-white font-extrabold flex items-center justify-center text-xl ${rounded}`}>{name?.[0] || "👤"}</div>;
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

// ─── Onboarding Step: Welcome & Profile Setup ────────────────────────
function OnboardingWelcome({ profile, onNext, onSkipAll }: {
  profile: Profile;
  onNext: (name: string, avatar: string | null) => void;
  onSkipAll: () => void;
}) {
  const [editName, setEditName] = useState(profile.display_name || "");
  const [editAvatar, setEditAvatar] = useState<string | null>(profile.avatar_url || null);

  const isFromLine = profile.avatar_url?.includes("profile.line-scdn.net") || 
                     profile.avatar_url?.includes("obs.line-scdn.net");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-5 py-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl">🌿</span>
        </div>
        <h1 className="text-[22px] font-extrabold text-[var(--color-text)] mb-2 break-keep text-balance">
          ようこそ、あんしんキッズへ！
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed font-medium break-keep text-balance">
          まずは簡単な初期設定をしましょう。<br/>
          2ステップですぐに完了します。
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-soft mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 relative shrink-0 rounded-full overflow-hidden shadow-sm">
            {renderAvatar(editAvatar, editName || profile.display_name, "rounded-full")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold text-[var(--color-text)] truncate">{editName || profile.display_name}</p>
            {isFromLine && (
              <p className="text-[11px] text-[var(--color-primary)] font-bold mt-0.5">
                LINEのアカウント情報で登録されました
              </p>
            )}
          </div>
        </div>

        {isFromLine && (
          <div className="p-3.5 rounded-2xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15 mb-4">
            <p className="text-[12px] text-[var(--color-text)] leading-relaxed font-medium break-keep text-balance">
              💡 <strong>アイコンやお名前はLINEのものがそのまま使われています。</strong>
              他のユーザーにも表示されるため、気になる方はここで変更できます。
            </p>
          </div>
        )}
        
        {/* Name Edit */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-[var(--color-subtle)] mb-1.5">表示名</label>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            maxLength={20}
            className="w-full text-[14px] px-4 py-3 rounded-xl border border-[var(--color-border-light)] focus:border-[var(--color-primary)] focus:outline-none transition-colors bg-[var(--color-surface-warm)]"
            placeholder="表示名（例：ゆいママ）"
          />
        </div>

        {/* Avatar Edit */}
        <div>
          <label className="block text-[12px] font-bold text-[var(--color-subtle)] mb-1.5">アイコン</label>
          <div className="flex items-center gap-2 mb-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface-warm)] hover:bg-[var(--color-border-light)] transition-colors rounded-xl text-[12px] font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)] cursor-pointer">
              <span className="text-sm">📸</span> 写真を選択
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const img = new window.Image();
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      const maxSize = 200;
                      let { width, height } = img;
                      if (width > height) { if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; } }
                      else { if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; } }
                      canvas.width = width; canvas.height = height;
                      const ctx = canvas.getContext("2d");
                      if (ctx) { ctx.drawImage(img, 0, 0, width, height); setEditAvatar(canvas.toDataURL("image/jpeg", 0.7)); }
                    };
                    img.src = ev.target?.result as string;
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
            {editAvatar && editAvatar !== profile.avatar_url && (
              <button onClick={() => setEditAvatar(profile.avatar_url)} className="text-[11px] text-[var(--color-muted)] underline">元に戻す</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {["👦", "👧", "👨", "👩", "🐻", "🐶", "🐱", "🐰", "🐼", "🐨", "🦊", "🦁"].map(emoji => (
              <button key={emoji} onClick={() => setEditAvatar(emoji)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${editAvatar === emoji ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-110" : "border-[var(--color-border-light)] bg-white hover:bg-[var(--color-surface-warm)]"}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onNext(editName.trim() || profile.display_name, editAvatar)}
        className="w-full py-4 rounded-full bg-[var(--color-primary)] text-white text-[15px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform mb-3 shadow-glow"
      >
        次へ：お子さまの情報を登録
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        onClick={onSkipAll}
        className="w-full py-3 text-[13px] text-[var(--color-muted)] font-medium hover:text-[var(--color-text-secondary)] transition-colors"
      >
        あとで設定する
      </button>
    </motion.div>
  );
}

// ─── Onboarding Step 2: Child Info (using existing wizard) ───────────
function OnboardingChildSetup({ initialPrefs, onComplete, onSkip }: {
  initialPrefs: UserPreferences;
  onComplete: (prefs: UserPreferences) => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="px-5 pt-5 pb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-[var(--color-surface-warm)] border border-emerald-100">
          <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-2 break-keep text-balance">
            🌟 お子さまの情報を登録すると…
          </h3>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="break-keep text-balance"><strong>同じアレルギーの先輩ママ・パパの知恵</strong>が自動で届きます</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="break-keep text-balance"><strong>年齢に合わせた情報</strong>（離乳食、給食、外食…）をおすすめ</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="break-keep text-balance">トークルームであなたの投稿に<strong>アレルギー情報を自動表示</strong>し、同じ悩みの方と繋がりやすく</span>
            </li>
          </ul>
        </div>
      </div>
      <OnboardingWizard
        initialPrefs={initialPrefs}
        onSkip={onSkip}
        onComplete={onComplete}
      />
    </motion.div>
  );
}

// ─── Onboarding Complete Animation ───────────────────────────────────
function OnboardingComplete() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--color-bg)]"
    >
      <div className="text-center fade-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-lg scale-in">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-[20px] font-extrabold text-[var(--color-text)] mb-2 break-keep text-balance">準備完了！</h2>
        <p className="text-[14px] text-[var(--color-subtle)] break-keep text-balance">トークルームへご案内します 🌿</p>
      </div>
    </motion.div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MyPageClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialData?.data?.profile || null);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>(initialData?.data?.bookmarks || []);
  const [recommendedWikis, setRecommendedWikis] = useState<RecommendedWikiData[]>(initialData?.data?.recommendedWikis || []);
  const [isFetchingRecommended, setIsFetchingRecommended] = useState(!initialData?.data?.recommendedWikis || initialData?.data?.recommendedWikis?.length === 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChildInfo, setShowChildInfo] = useState(false);
  const initErrText = initialData?.error || "";
  const initIsAuthErr = initErrText.includes("ログイン") || initErrText.includes("認証") || initErrText.includes("DB未接続");
  const [hasError, setHasError] = useState(initialData?.success === false && !initIsAuthErr);
  const [errorMsg] = useState(initIsAuthErr ? "" : "接続エラーが発生しました。ページを再読み込みしてください。");
  const [isBootstrapping, setIsBootstrapping] = useState(!initialData);

  // Instant Navigation Bootstrapper
  useEffect(() => {
    if (!initialData) {
      import("@/app/actions/mypage").then(m => m.getFullMyPageData()).then((res: any) => {
        if (res.success && res.data) {
          setProfile(res.data.profile);
          setBookmarks(res.data.bookmarks);
          if (res.data.profile) {
            getPersonalizedWikiEntries().then((recRes: any) => {
              if (recRes.success && recRes.data) setRecommendedWikis(recRes.data);
              setIsFetchingRecommended(false);
            }).catch(() => setIsFetchingRecommended(false));
          }
        } else {
          if (!res.error?.includes("ログイン")) {
             setHasError(true);
          }
          setIsFetchingRecommended(false);
        }
        setIsBootstrapping(false);
      });
    }
  }, [initialData]);

  // Deferred recommendation fetching
  useEffect(() => {
    if (initIsAuthErr || !profile || isBootstrapping) return;
    if (recommendedWikis.length === 0) {
      getPersonalizedWikiEntries().then(res => {
         if (res.success && res.data) setRecommendedWikis(res.data);
         setIsFetchingRecommended(false);
      }).catch(() => setIsFetchingRecommended(false));
    }
  }, [profile, initIsAuthErr, isBootstrapping]);

  // Profile Edit Modal state
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editName, setEditName] = useState((initialData?.data?.profile as any)?.display_name || "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editAvatar, setEditAvatar] = useState<string | null>((initialData?.data?.profile as any)?.avatar_url || null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ─── Onboarding State ─────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData?.data?.profile) return;
    const p = initialData.data.profile;
    const hasChildData = (p.children_profiles && Array.isArray(p.children_profiles) && p.children_profiles.length > 0) ||
                         (p.allergen_tags && Array.isArray(p.allergen_tags) && p.allergen_tags.length > 0);
    if (localStorage.getItem("anshin_onboarding_done") === "true") return;
    if (!hasChildData) setOnboardingStep("welcome");
  }, [initialData]);

  async function handleWelcomeNext(name: string, avatar: string | null) {
    if (profile && (name !== profile.display_name || avatar !== profile.avatar_url)) {
      setIsSavingProfile(true);
      const result = await updateMyProfile({ display_name: name, avatar_url: avatar });
      if (result.success && profile) {
        setProfile({ ...profile, display_name: name, avatar_url: avatar });
        setEditName(name);
        setEditAvatar(avatar);
      }
      setIsSavingProfile(false);
    }
    setOnboardingStep("child-setup");
  }

  function handleSkipOnboarding() {
    localStorage.setItem("anshin_onboarding_done", "true");
    setOnboardingStep("complete");
    setTimeout(() => { router.push("/talk"); }, 1200);
  }

  function handleWizardComplete(prefs: UserPreferences) {
    setIsEditing(false);
    if (profile) {
      setProfile({ ...profile, children_profiles: prefs.children as unknown as ChildProfile[] });
    }
    if (onboardingStep === "child-setup") {
      localStorage.setItem("anshin_onboarding_done", "true");
      setOnboardingStep("complete");
      setTimeout(() => { router.push("/talk"); }, 1200);
    }
  }

  function getMigratedInitialPrefs(): UserPreferences {
    if (!profile) return { children: [], interests: [] };
    if (profile.children_profiles && profile.children_profiles.length > 0) {
      return { children: profile.children_profiles, interests: [] };
    }
    if (profile.allergen_tags && profile.allergen_tags.length > 0) {
      let ageGroup = "";
      if (profile.child_age_months !== null) {
        if (profile.child_age_months >= 72) ageGroup = "6-12";
        else if (profile.child_age_months >= 36) ageGroup = "3-6";
        else if (profile.child_age_months >= 12) ageGroup = "1-3";
        else ageGroup = "0-1";
      }
      return {
        children: [{ id: "child-migrated", name: "1人目", allergens: profile.allergen_tags, customAllergens: [], ageGroup }],
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
    localStorage.removeItem("anshin_user_preferences");
    localStorage.removeItem("anshin_onboarding_done");
    localStorage.removeItem("anshin_post_count");
    await logoutAction();
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    const result = await deleteMyAccount();
    if (result.success) {
      localStorage.removeItem("anshin_post_count");
      localStorage.removeItem("anshin_guidelines_accepted");
      localStorage.removeItem("anshin_onboarding_done");
      window.location.href = "/login";
    } else {
      setIsDeleting(false);
      alert(result.error || "アカウントの削除に失敗しました。");
    }
  }

  // ─── Onboarding Screens ───────────────────────────────────────────
  if (onboardingStep === "complete") return <OnboardingComplete />;

  if (onboardingStep === "welcome" && profile) {
    return (
      <AnimatePresence mode="wait">
        <OnboardingWelcome key="welcome" profile={profile} onNext={handleWelcomeNext} onSkipAll={handleSkipOnboarding} />
      </AnimatePresence>
    );
  }

  if (onboardingStep === "child-setup" && profile) {
    return (
      <AnimatePresence mode="wait">
        <OnboardingChildSetup key="child-setup" initialPrefs={getMigratedInitialPrefs()} onComplete={handleWizardComplete} onSkip={handleSkipOnboarding} />
      </AnimatePresence>
    );
  }

  // ─── Loading / Error / Login States ───────────────────────────────
  if (isBootstrapping) {
    return (
      <div className="w-full min-h-[100dvh] bg-[var(--color-background)] pb-24 fade-in">
         <div className="px-5 pt-8 pb-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="shimmer w-12 h-12 rounded-full" />
              <div className="flex-1"><div className="shimmer w-28 h-5 rounded-lg mb-1.5" /><div className="shimmer w-20 h-3 rounded-lg" /></div>
            </div>
         </div>
         <div className="px-4 space-y-3">
           <div className="shimmer h-6 w-32 rounded-lg" />
           <div className="shimmer h-24 rounded-2xl" />
           <div className="shimmer h-24 rounded-2xl" />
         </div>
      </div>
    );
  }

  if (hasError && errorMsg && !isBootstrapping) {
    return (
      <div className="fade-in">
        <div className="empty-state mt-16">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-primary)]/10 flex items-center justify-center mb-2 shadow-sm">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3>エラーが発生しました</h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-2">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6 inline-flex items-center gap-2">ページを再読み込み</button>
        </div>
      </div>
    );
  }

  if (!profile && !isBootstrapping) {
    return (
      <div className="fade-in">
        <div className="empty-state mt-16">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-primary)]/10 flex items-center justify-center mb-2 shadow-sm">
            <span className="text-3xl">🔐</span>
          </div>
          <h3 className="break-keep text-balance">ログインが必要です</h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-2 leading-relaxed">マイページの閲覧にはアカウントが必要です。</p>
          <Link href="/login" className="btn-primary mt-6 inline-flex items-center gap-2" id="mypage-login-cta">ログインする</Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const hasProfileData = (profile.children_profiles && profile.children_profiles.length > 0) ||
                         (profile.allergen_tags && profile.allergen_tags.length > 0);

  // ════════════════════════════════════════════════════════════════════
  //  Reader-First MyPage
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="fade-in pb-4">
      {/* ─── Compact Profile Strip ─────────────────────────────── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 relative shrink-0 rounded-full overflow-hidden shadow-sm border border-[var(--color-border-light)]">
              {renderAvatar(profile.avatar_url, profile.display_name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-extrabold text-[var(--color-text)] truncate">{profile.display_name}</h1>
              <p className="text-[11px] text-[var(--color-subtle)] font-medium">マイページ</p>
            </div>
          </div>
          <button 
            onClick={() => setShowProfileEdit(true)} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-soft hover:shadow-md transition-shadow text-[var(--color-subtle)]"
            aria-label="プロフィール編集"
          >
            <Settings className="w-5 h-5 text-[var(--color-subtle)]" />
          </button>
        </div>
      </div>

      {/* Wizard overlay when editing child info */}
      {isEditing && (
        <OnboardingWizard
          initialPrefs={getMigratedInitialPrefs()}
          onSkip={() => setIsEditing(false)}
          onComplete={handleWizardComplete}
        />
      )}

      {/* ─── Section 1: おまもりノート (Bookmarks) ─────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="px-4 mb-5"
      >
        <h2 className="text-[16px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Bookmark className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          おまもりノート
        </h2>
        
        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-[32px] p-6 text-center shadow-soft">
            <div className="w-14 h-14 rounded-full bg-[var(--color-bg)] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <span className="text-2xl">🔖</span>
            </div>
            <p className="text-[14px] text-[var(--color-text)] font-bold mb-1 break-keep text-balance">
              まだブックマークがありません
            </p>
            <p className="text-[12px] text-[var(--color-subtle)] leading-relaxed mb-4 break-keep text-balance">
              まとめ記事の中で気になった情報の<br/>🔖ボタンを押すと、ここに保存されます。
            </p>
            <Link href="/wiki" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-primary)] hover:underline">
              まとめ記事を読む <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {bookmarks.map((bm) => (
              <Link
                key={bm.id}
                href={`/wiki/${bm.wiki_entries.slug}`}
                className="block p-5 rounded-[28px] bg-white hover:shadow-md transition-all shadow-soft group"
              >
                <p className="text-[10px] text-[var(--color-subtle)] mb-1 flex items-center gap-1 font-bold">
                  <BookOpen className="w-3 h-3" />
                  {bm.wiki_entries.category}
                </p>
                <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1.5 leading-snug group-hover:text-[var(--color-primary)] transition-colors break-keep text-balance">
                  {bm.snippet_title}
                </h4>
                <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed bg-[var(--color-surface-warm)] p-2.5 rounded-xl">
                  {bm.snippet_content}
                </p>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Section 2: おすすめ記事 (Recommendations) ─────────── */}
      {isFetchingRecommended ? (
        <div className="px-4 mb-5 fade-in">
           <div className="shimmer h-5 w-40 rounded-lg mb-3" />
           <div className="space-y-2.5">
             <div className="shimmer h-24 rounded-[20px]" />
             <div className="shimmer h-24 rounded-[20px]" />
           </div>
        </div>
      ) : recommendedWikis.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
          className="px-4 mb-5"
        >
          <h2 className="text-[16px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-500" />
            あなたへのおすすめ
          </h2>
          {!hasProfileData && (
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50/60 to-[var(--color-surface-warm)] border border-amber-100/50">
              <p className="text-[11px] text-amber-700 font-medium break-keep text-balance">
                💡 <button onClick={() => setIsEditing(true)} className="underline font-bold">お子さまの情報を登録</button>すると、アレルギーや年齢に合った記事が自動的におすすめされます。
              </p>
            </div>
          )}
          <div className="space-y-2.5">
            {recommendedWikis.map((wiki) => {
              const url = wiki.slug.startsWith("/talk/") ? wiki.slug : `/wiki/${wiki.slug}`;
              const isRecent = wiki.slug.startsWith("/talk/");
              return (
                <Link
                  key={wiki.id}
                  href={url}
                  className="block p-5 rounded-[28px] bg-white hover:shadow-md transition-all group relative overflow-hidden shadow-soft"
                >
                  <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-[#FFF3D6] to-transparent rounded-bl-[28px] opacity-50 pointer-events-none" />
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#A67C00]/80 flex items-center gap-1 font-bold mb-1">
                          <BookOpen className="w-3 h-3" />
                          {wiki.category}
                        </p>
                        <h4 className="text-[14px] font-bold text-[#805F00] leading-snug break-keep text-balance group-hover:text-[#A67C00] transition-colors">
                          {wiki.title.replace("【みんなの知恵袋】", "").trim()}
                        </h4>
                      </div>
                      {isRecent && (
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 relative z-20" onClick={(e) => e.preventDefault()}>
                          <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold shadow-sm">NEW</span>
                          <TopicBookmarkButton summaryId={wiki.id} snippetTitle={wiki.title} snippetContent={wiki.summary} />
                        </div>
                      )}
                    </div>
                    <p className="text-[12px] text-[#A67C00]/70 line-clamp-2 leading-relaxed font-medium mt-1">
                      {wiki.summary}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      ) : hasProfileData ? null : (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 mb-5"
        >
          <div className="bg-gradient-to-br from-amber-50/80 to-white rounded-[24px] p-5 text-center border border-amber-100/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-12 h-12 rounded-[16px] bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-[14px] text-[var(--color-text)] font-bold mb-1 break-keep text-balance">
              あなた専用のおすすめを表示
            </p>
            <p className="text-[12px] text-[var(--color-subtle)] leading-relaxed mb-4 break-keep text-balance">
              お子さまのアレルギーや年齢を登録すると、<br/>ぴったりの情報が自動配信されます。
            </p>
            <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-text)] text-white text-[13px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform">
              お子さま情報を登録する
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Section 3: お子さま情報 (Collapsible) ────────────── */}
      {hasProfileData && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring" }}
          className="px-4 mb-4"
        >
          <button 
            onClick={() => setShowChildInfo(!showChildInfo)}
            className="w-full flex items-center justify-between p-4 rounded-[28px] bg-white shadow-soft transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">👶</span>
              <span className="text-[13px] font-bold text-[var(--color-text)]">登録中のお子さま情報</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {getMigratedInitialPrefs().children.length}名
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[var(--color-subtle)] transition-transform ${showChildInfo ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {showChildInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="pt-2.5 space-y-2">
                  {getMigratedInitialPrefs().children.map((child, idx) => (
                    <div key={child.id || idx} className="bg-[var(--color-surface-warm)] rounded-[16px] p-3.5 border border-[var(--color-border-light)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[13px] text-[var(--color-text)]">{child.name}</span>
                        {child.ageGroup && <span className="text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded-full text-[var(--color-subtle)]">{child.ageGroup}才</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {child.allergens.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-white shadow-sm rounded-full text-[11px] font-bold text-[var(--color-text)]">{tag}</span>
                        ))}
                        {child.customAllergens.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-white border border-dashed border-[var(--color-border)] rounded-full text-[11px] font-bold text-[var(--color-text-secondary)]">{tag}</span>
                        ))}
                        {child.allergens.length === 0 && child.customAllergens.length === 0 && (
                          <span className="text-[11px] font-bold text-[var(--color-muted)]">アレルギー登録なし</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setIsEditing(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold text-[var(--color-primary)] hover:underline">
                    <Settings className="w-3.5 h-3.5" /> 変更する
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── Quick Actions ────────────────────────────────────── */}
      <div className="px-4 mb-5 flex gap-3">
        <Link href="/talk" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-[var(--color-text)] text-white text-[14px] font-black hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md">
          <span>💬</span> トークルームへ
        </Link>
        <Link href="/notifications" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-white text-[var(--color-text)] text-[14px] font-black shadow-soft hover:shadow-md transition-all">
          <Bell className="w-5 h-5 text-[var(--color-text)]" /> 通知履歴
        </Link>
      </div>

      {/* ─── Section 4: 設定・プライバシー (Compact) ──────────── */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-[32px] shadow-soft overflow-hidden">
          {/* Privacy toggle */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-bg)]">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-[13px] font-bold text-[var(--color-text)] mb-0.5">トークでの情報表示</p>
              <p className="text-[10px] text-[var(--color-subtle)] leading-relaxed">
                年齢やアレルギーを投稿の横に表示
              </p>
            </div>
            <button
              onClick={async () => {
                 if (!profile || !profile.children_profiles || profile.children_profiles.length === 0) return;
                 setIsSavingProfile(true);
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 const isCurrentlyPublic = !profile.children_profiles.some(c => (c as any).isPublic === false);
                 const newProfs = profile.children_profiles.map(c => ({...c, isPublic: !isCurrentlyPublic}));
                 setProfile({ ...profile, children_profiles: newProfs as ChildProfile[] });
                 const { updateMyProfile: updateProfileAction } = await import("@/app/actions/mypage");
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 await updateProfileAction({ children_profiles: newProfs as any[] });
                 setIsSavingProfile(false);
              }}
              disabled={isSavingProfile || !profile?.children_profiles || profile.children_profiles.length === 0}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 shadow-inner ${
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (profile?.children_profiles && profile.children_profiles.length > 0 && !profile.children_profiles.some(c => (c as any).isPublic === false)) ? "bg-[var(--color-primary)]" : "bg-gray-300"
              }`}
            >
              <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (profile?.children_profiles && profile.children_profiles.length > 0 && !profile.children_profiles.some(c => (c as any).isPublic === false)) ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
          
          {/* Support link */}
          <Link href="/support" className="flex items-center justify-between p-4 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-warm)] transition-colors">
            <span className="text-[13px] font-bold text-[var(--color-text)]">サポート・ヘルプ</span>
            <ChevronRight className="w-4 h-4 text-[var(--color-subtle)]" />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-between p-4 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-warm)] transition-colors disabled:opacity-50"
          >
            <span className="text-[13px] font-bold text-[var(--color-subtle)] flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? "ログアウト中..." : "ログアウト"}
            </span>
          </button>

          {/* Delete Account */}
          <div className="p-4">
            {showDeleteConfirm ? (
              <div className="space-y-2.5">
                <p className="text-[12px] text-red-600 font-bold">本当に削除しますか？この操作は取り消せません。</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 text-white text-[12px] font-bold disabled:opacity-50"
                  >
                    {isDeleting ? <><Loader2 className="w-3 h-3 animate-spin" /> 削除中...</> : "完全に削除する"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[12px] text-[var(--color-subtle)]"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[12px] text-[var(--color-danger)] font-medium hover:underline"
              >
                アカウントを削除する
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Profile Edit Modal ═══════ */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowProfileEdit(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[var(--color-surface)] rounded-3xl shadow-2xl slide-up p-6">
            <h2 className="text-[18px] font-extrabold text-[var(--color-text)] mb-5 text-center break-keep text-balance">プロフィール編集</h2>
            
            <div className="mb-5">
              <label className="block text-[12px] font-bold text-[var(--color-subtle)] mb-2">アイコン</label>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 shrink-0 shadow-sm relative rounded-full overflow-hidden">
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
                              if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
                            } else {
                              if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
                            }
                            canvas.width = width; canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            if (ctx) { ctx.drawImage(img, 0, 0, width, height); setEditAvatar(canvas.toDataURL("image/jpeg", 0.7)); }
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
