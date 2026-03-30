"use client";

import { useState, useEffect } from "react";
import { Leaf, ChevronRight, Check, Sparkles } from "lucide-react";

const ALLERGENS = [
  { id: "egg", label: "卵", emoji: "🥚" },
  { id: "milk", label: "乳", emoji: "🥛" },
  { id: "wheat", label: "小麦", emoji: "🌾" },
  { id: "peanut", label: "落花生", emoji: "🥜" },
  { id: "nuts", label: "ナッツ類", emoji: "🌰" },
  { id: "shrimp", label: "えび", emoji: "🦐" },
  { id: "crab", label: "かに", emoji: "🦀" },
  { id: "soba", label: "そば", emoji: "🍜" },
  { id: "soy", label: "大豆", emoji: "🫘" },
  { id: "sesame", label: "ごま", emoji: "🫒" },
  { id: "fruit", label: "果物", emoji: "🍎" },
];

const AGE_OPTIONS = [
  { id: "0-1", label: "0〜1歳", sub: "離乳食期" },
  { id: "1-3", label: "1〜3歳", sub: "幼児食期" },
  { id: "3-6", label: "3〜6歳", sub: "園児" },
  { id: "6-12", label: "6〜12歳", sub: "小学生" },
  { id: "12+", label: "12歳以上", sub: "中高生〜" },
];

const INTERESTS = [
  { id: "shopping", label: "安全な市販品を知りたい", emoji: "🛒" },
  { id: "eating-out", label: "外食できるお店を探したい", emoji: "🍽️" },
  { id: "medical", label: "通院・治療について知りたい", emoji: "🏥" },
  { id: "daily-food", label: "毎日の献立のヒントがほしい", emoji: "🍚" },
  { id: "school-life", label: "園・学校への伝え方を知りたい", emoji: "🏫" },
  { id: "concern", label: "同じ悩みの人と話したい", emoji: "💚" },
];

export interface UserPreferences {
  allergens: string[];
  ageGroup: string;
  interests: string[];
}

const STORAGE_KEY = "anshin_user_preferences";
const ONBOARDING_DONE_KEY = "anshin_onboarding_done";

export function getUserPreferences(): UserPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_DONE_KEY) === "true";
}

interface OnboardingWizardProps {
  onComplete: (prefs: UserPreferences) => void;
  onSkip: () => void;
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Restore previous selections if any
    const existing = getUserPreferences();
    if (existing) {
      setSelectedAllergens(existing.allergens);
      setSelectedAge(existing.ageGroup);
      setSelectedInterests(existing.interests);
    }
  }, []);

  function toggleAllergen(id: string) {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleNext() {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Complete
      const prefs: UserPreferences = {
        allergens: selectedAllergens,
        ageGroup: selectedAge,
        interests: selectedInterests,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      localStorage.setItem(ONBOARDING_DONE_KEY, "true");
      setShowAnimation(true);
      setTimeout(() => onComplete(prefs), 1200);
    }
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_DONE_KEY, "true");
    onSkip();
  }

  const canProceed =
    step === 0 ? selectedAllergens.length > 0 :
    step === 1 ? selectedAge !== "" :
    selectedInterests.length > 0;

  if (showAnimation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-lg scale-in">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-[20px] font-extrabold text-[var(--color-text)] mb-2">
            準備完了！
          </h2>
          <p className="text-[14px] text-[var(--color-subtle)]">
            あなたに合った情報をお届けします 🌿
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] safe-bottom" role="dialog" aria-label="はじめの設定">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleSkip}
            className="text-[12px] text-[var(--color-subtle)] hover:text-[var(--color-text-secondary)] transition-colors py-2 px-1"
            aria-label="スキップしてはじめる"
          >
            スキップ
          </button>
          <span className="text-[11px] text-[var(--color-muted)] font-medium">
            {step + 1} / 3
          </span>
        </div>
        <div className="h-1.5 bg-[var(--color-border-light)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)] rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {step === 0 && (
          <div className="fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-sm">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-[18px] font-extrabold text-[var(--color-text)]">
                  お子さまのアレルゲンは？
                </h1>
                <p className="text-[12px] text-[var(--color-subtle)]">
                  あとから変更できます（複数選択OK）
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-5">
              {ALLERGENS.map((allergen) => {
                const selected = selectedAllergens.includes(allergen.id);
                return (
                  <button
                    key={allergen.id}
                    onClick={() => toggleAllergen(allergen.id)}
                    className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                      selected
                        ? "border-[var(--color-primary)] bg-[var(--color-success-light)] shadow-sm"
                        : "border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                    }`}
                    aria-pressed={selected}
                    aria-label={`${allergen.label}${selected ? "（選択済み）" : ""}`}
                  >
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <span className="text-2xl block mb-1">{allergen.emoji}</span>
                    <span className="text-[12px] font-bold text-[var(--color-text)]">{allergen.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <h1 className="text-[18px] font-extrabold text-[var(--color-text)] mb-1">
              お子さまの年齢は？
            </h1>
            <p className="text-[12px] text-[var(--color-subtle)] mb-5">
              年齢に合った情報をお届けします
            </p>

            <div className="space-y-2.5">
              {AGE_OPTIONS.map((age) => {
                const selected = selectedAge === age.id;
                return (
                  <button
                    key={age.id}
                    onClick={() => setSelectedAge(age.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between ${
                      selected
                        ? "border-[var(--color-primary)] bg-[var(--color-success-light)] shadow-sm"
                        : "border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <div>
                      <span className="text-[15px] font-bold text-[var(--color-text)]">{age.label}</span>
                      <span className="text-[12px] text-[var(--color-subtle)] ml-2">{age.sub}</span>
                    </div>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h1 className="text-[18px] font-extrabold text-[var(--color-text)] mb-1">
              一番知りたいことは？
            </h1>
            <p className="text-[12px] text-[var(--color-subtle)] mb-5">
              あなたに合ったコンテンツを優先表示します（複数選択OK）
            </p>

            <div className="space-y-2.5">
              {INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                      selected
                        ? "border-[var(--color-primary)] bg-[var(--color-success-light)] shadow-sm"
                        : "border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="text-xl flex-shrink-0">{interest.emoji}</span>
                    <span className="text-[14px] font-bold text-[var(--color-text)] flex-1">{interest.label}</span>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 pt-3 border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={step === 2 ? "設定を完了してはじめる" : "次のステップへ進む"}
        >
          {step === 2 ? (
            <>
              <Sparkles className="w-4 h-4" />
              あんしんキッズをはじめる
            </>
          ) : (
            <>
              次へ
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
