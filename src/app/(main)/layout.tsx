"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import OnboardingWizard, { isOnboardingComplete } from "@/components/onboarding-wizard";
import { Home, MessageCircle, Book, Sparkles, User, LogIn } from "@/components/icons";
import { ImpactToast } from "@/components/ui/ImpactToast";

const navItems = [
  { href: "/home", label: "ホーム", Icon: Home },
  { href: "/talk", label: "みんなの声", Icon: MessageCircle },
  { href: "/wiki", label: "知恵袋", Icon: Book },
  { href: "/concierge", label: "AI相談", Icon: Sparkles },
  { href: "/mypage", label: "マイページ", Icon: User },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return !isOnboardingComplete();
  });
  const [helpfulVotes, setHelpfulVotes] = useState<number>(0);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOffline() { setIsOffline(true); }
    function handleOnline() { setIsOffline(false); }
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (typeof navigator !== "undefined" && !navigator.onLine) setIsOffline(true);

    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) {
          setIsLoggedIn(!!user);
          if (user) {
            import("@/app/actions/mypage").then(({ getMyProfile }) => {
              getMyProfile().then(res => {
                if (cancelled) return;
                if (res.success && res.data) {
                  const dataObj = res.data as Record<string, unknown>;
                  setHelpfulVotes((dataObj.total_helpful_votes as number) || 0);
                  // If we have profile data with tags/children, they have onboarded!
                  if ((res.data.children_profiles && (res.data.children_profiles as unknown[]).length > 0) || 
                      (res.data.allergen_tags && res.data.allergen_tags.length > 0)) {
                    setShowOnboarding(false);
                    localStorage.setItem("anshin_onboarding_done", "true");
                  }
                }
              });
            });
          }
        }
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    }
    check();
    return () => { 
      cancelled = true; 
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
  }

  function handleOnboardingSkip() {
    setShowOnboarding(false);
  }

  return (
    <div className="min-h-[100dvh] pb-[72px] max-w-md mx-auto relative bg-[var(--color-bg)] shadow-md">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold text-center py-1.5 z-50 animate-in slide-in-from-top flex items-center justify-center gap-2">
          <span>⚠️ ネットワーク接続がありません</span>
        </div>
      )}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {helpfulVotes > 0 && <ImpactToast currentHelpfulVotes={helpfulVotes} />}

      {children}

      {/* Bottom Navigation */}
      <nav className="bottom-nav" id="main-navigation" role="navigation" aria-label="メインナビゲーション">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map((item) => {
            // マイページは未ログイン時は非表示（ログインボタンとスワップする）
            if (item.href === "/mypage" && isLoggedIn === false) {
              return null;
            }

            const isComingSoon = item.href === "/concierge";
            
            if (isComingSoon) {
              return (
                <div
                  key={item.href}
                  className="nav-item opacity-50 cursor-not-allowed select-none relative"
                  id={`nav-${item.href.slice(1)}`}
                  aria-label={`${item.label}（準備中）`}
                >
                  <item.Icon size={22} className="text-gray-400" />
                  <span className="text-gray-400">{item.label}</span>
                  <div className="absolute -top-1 -right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-sm transform -rotate-6 border border-white whitespace-nowrap">
                    準備中
                  </div>
                </div>
              );
            }

            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                id={`nav-${item.href.slice(1)}`}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <item.Icon size={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isLoggedIn === false && (
            <Link
              href="/login"
              className="nav-item"
              style={{ color: "var(--color-primary)" }}
              id="nav-login"
              aria-label="ログイン"
            >
              <LogIn size={22} />
              <span>ログイン</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
