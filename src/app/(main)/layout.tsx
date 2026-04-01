"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import OnboardingWizard, { isOnboardingComplete } from "@/components/onboarding-wizard";
import { MessageCircle, Book, Sparkles, User, LogIn } from "@/components/icons";

const navItems = [
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

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) setIsLoggedIn(!!user);
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [pathname]);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
  }

  function handleOnboardingSkip() {
    setShowOnboarding(false);
  }

  return (
    <div className="min-h-screen pb-[72px]">
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {children}

      {/* Bottom Navigation */}
      <nav className="bottom-nav" id="main-navigation" role="navigation" aria-label="メインナビゲーション">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map((item) => {
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
