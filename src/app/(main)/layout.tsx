"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, BookOpen, Sparkles, User, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import OnboardingWizard, { isOnboardingComplete } from "@/components/onboarding-wizard";

const navItems = [
  { href: "/talk", icon: MessageCircle, label: "みんなの声", emoji: "💬" },
  { href: "/wiki", icon: BookOpen, label: "知恵袋", emoji: "📖" },
  { href: "/concierge", icon: Sparkles, label: "AI相談", emoji: "✨" },
  { href: "/mypage", icon: User, label: "マイページ", emoji: "👤" },
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
      {/* Onboarding Wizard — first visit only */}
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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                id={`nav-${item.href.slice(1)}`}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {/* Show login button if not authenticated */}
          {isLoggedIn === false && (
            <Link
              href="/login"
              className="nav-item"
              style={{ color: "var(--color-primary)" }}
              id="nav-login"
              aria-label="ログイン"
            >
              <LogIn aria-hidden="true" />
              <span>ログイン</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
