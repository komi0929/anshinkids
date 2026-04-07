"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import OnboardingWizard, { isOnboardingComplete } from "@/components/onboarding-wizard";
import { MessageCircle, User, LogIn, Settings } from "@/components/icons";

const navItems = [
  { href: "/talk", label: "テーマ一覧", Icon: MessageCircle },
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

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setIsLoggedIn(!!user);

        if (!isOnboardingComplete()) {
          setShowOnboarding(true);
        }

        // Check if user has already onboarded via profile data
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("allergen_tags, children_profiles")
            .eq("id", user.id)
            .maybeSingle();

          if (!cancelled && profile) {
            const cp = profile.children_profiles as unknown[];
            const at = profile.allergen_tags as string[];
            if ((cp && cp.length > 0) || (at && at.length > 0)) {
              setShowOnboarding(false);
              localStorage.setItem("anshin_onboarding_done", "true");
            }
          }
        }
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
  }

  function handleOnboardingSkip() {
    setShowOnboarding(false);
  }

  // Hide footer on topic detail pages (chat view)
  const isTalkDetail = /^\/talk\/[^/]+\/[^/]+/.test(pathname);

  return (
    <div className={`min-h-[100dvh] ${isTalkDetail ? "" : "pb-[72px]"} max-w-md mx-auto relative bg-[var(--color-bg)] shadow-md`}>
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {children}

      {/* Bottom Navigation */}
      {!showOnboarding && !isTalkDetail && (
        <nav className="bottom-nav" id="main-navigation" role="navigation" aria-label="メインナビゲーション">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {navItems.map((item) => {
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
      )}
    </div>
  );
}
