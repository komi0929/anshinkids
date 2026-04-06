"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import OnboardingWizard, { isOnboardingComplete } from "@/components/onboarding-wizard";
import { MessageCircle, Book, User, LogIn, Settings } from "@/components/icons";
import { ImpactToast } from "@/components/ui/ImpactToast";

const navItems = [
  { href: "/wiki", label: "まとめ", Icon: Book },
  { href: "/talk", label: "トークルーム", Icon: MessageCircle },
  { href: "/support", label: "サポート", Icon: Settings },
  { href: "/mypage", label: "マイページ", Icon: User },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<number>(0);
  const [hasUnreadImpact, setHasUnreadImpact] = useState(false);
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
        if (!cancelled && !isOnboardingComplete()) {
          setShowOnboarding(true);
        }
        if (!cancelled) {
          setIsLoggedIn(!!user);
          if (user) {
            import("@/app/actions/mypage").then(({ getMyProfile }) => {
              getMyProfile().then(res => {
                if (cancelled) return;
                if (res.success && res.data) {
                  const dataObj = res.data as Record<string, unknown>;
                  const currentVotes = (dataObj.total_helpful_votes as number) || 0;
                  setHelpfulVotes(currentVotes);
                  const lastSeen = Number(localStorage.getItem("anshin_last_seen_impact") || 0);
                  if (currentVotes > lastSeen) {
                    setHasUnreadImpact(true);
                  }
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

  useEffect(() => {
    if (pathname === "/mypage" && helpfulVotes > 0) {
      localStorage.setItem("anshin_last_seen_impact", helpfulVotes.toString());
      setHasUnreadImpact(false);
    }
  }, [pathname, helpfulVotes]);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
  }

  function handleOnboardingSkip() {
    setShowOnboarding(false);
  }
  const isTalkDetail = pathname.startsWith("/talk/") && pathname.length > "/talk/".length;

  return (
    <div className={`min-h-[100dvh] ${isTalkDetail ? "" : "pb-[72px]"} max-w-md mx-auto relative bg-[var(--color-bg)] shadow-md`}>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-[var(--color-danger-light)]00 text-white text-xs font-bold text-center py-1.5 z-50 animate-in slide-in-from-top flex items-center justify-center gap-2">
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
      {!showOnboarding && !isTalkDetail && (
        <nav className="bottom-nav" id="main-navigation" role="navigation" aria-label="メインナビゲーション">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {navItems.map((item) => {
              // マイページは未ログイン時は非表示（ログインボタンとスワップする）
              if (item.href === "/mypage" && isLoggedIn === false) {
                return null;
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
                  <div className="relative">
                    <item.Icon size={22} />
                    {item.href === "/mypage" && hasUnreadImpact && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-heart)] rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
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
      )}
    </div>
  );
}
