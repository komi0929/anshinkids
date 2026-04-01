"use client";

import { useState } from "react";
import { Leaf, ChevronRight, Check, Sparkles, Plus, X } from "@/components/icons";

export const ALLERGENS_RAW_8 = [
  { id: "egg", label: "卵", emoji: "🥚" },
  { id: "milk", label: "乳", emoji: "🥛" },
  { id: "wheat", label: "小麦", emoji: "🌾" },
  { id: "peanuts", label: "落花生", emoji: "🥜" },
  { id: "soba", label: "そば", emoji: "🍜" },
  { id: "shrimp", label: "えび", emoji: "🦐" },
  { id: "crab", label: "かに", emoji: "🦀" },
  { id: "walnut", label: "くるみ", emoji: "🌰" },
];

export const ALLERGENS_EQUIV_20 = [
  { id: "almond", label: "アーモンド", emoji: "🌰" },
  { id: "abalone", label: "あわび", emoji: "🐚" },
  { id: "squid", label: "いか", emoji: "🦑" },
  { id: "salmon_roe", label: "いくら", emoji: "🟠" },
  { id: "orange", label: "オレンジ", emoji: "🍊" },
  { id: "cashew", label: "カシューナッツ", emoji: "🌰" },
  { id: "kiwi", label: "キウイフルーツ", emoji: "🥝" },
  { id: "beef", label: "牛肉", emoji: "🥩" },
  { id: "sesame", label: "ごま", emoji: "🫒" },
  { id: "salmon", label: "さけ", emoji: "🐟" },
  { id: "mackerel", label: "さば", emoji: "🐟" },
  { id: "soy", label: "大豆", emoji: "🫘" },
  { id: "chicken", label: "鶏肉", emoji: "🍗" },
  { id: "banana", label: "バナナ", emoji: "🍌" },
  { id: "pork", label: "豚肉", emoji: "🥓" },
  { id: "macadamia", label: "マカダミア", emoji: "🌰" },
  { id: "peach", label: "もも", emoji: "🍑" },
  { id: "yam", label: "やまいも", emoji: "🍠" },
  { id: "apple", label: "りんご", emoji: "🍎" },
  { id: "gelatin", label: "ゼラチン", emoji: "🍮" },
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

export interface ChildProfile {
  id: string;
  name: string;
  allergens: string[];
  customAllergens: string[];
  ageGroup: string;
}

export interface UserPreferences {
  children: ChildProfile[];
  interests: string[];
}

const STORAGE_KEY = "anshin_user_preferences";
const ONBOARDING_DONE_KEY = "anshin_onboarding_done";

async function syncPreferencesToProfile(prefs: UserPreferences) {
  const { updateMyProfile } = await import("@/app/actions/mypage");
  await updateMyProfile({
    children_profiles: prefs.children as unknown as Record<string, unknown>[],
  });
}

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
  initialPrefs?: UserPreferences | null;
}

export default function OnboardingWizard({ onComplete, onSkip, initialPrefs }: OnboardingWizardProps) {
  const existingPrefs = typeof window !== "undefined" ? (initialPrefs || getUserPreferences()) : null;

  const [step, setStep] = useState(0);
  const [children, setChildren] = useState<ChildProfile[]>(
    existingPrefs?.children?.length ? existingPrefs.children : [
      { id: Date.now().toString(), name: "1人目", allergens: [], customAllergens: [], ageGroup: "" }
    ]
  );
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(existingPrefs?.interests || []);
  const [showAnimation, setShowAnimation] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const activeChild = children[activeChildIdx];

  function updateActiveChild(updates: Partial<ChildProfile>) {
    setChildren(prev => {
      const copy = [...prev];
      copy[activeChildIdx] = { ...copy[activeChildIdx], ...updates };
      return copy;
    });
  }

  function handleAddChild() {
    setChildren(prev => [
      ...prev,
      { id: Date.now().toString(), name: `${prev.length + 1}人目`, allergens: [], customAllergens: [], ageGroup: "" }
    ]);
    setActiveChildIdx(children.length);
  }

  function handleRemoveChild(index: number) {
    if (children.length <= 1) return;
    setChildren(prev => prev.filter((_, i) => i !== index));
    if (activeChildIdx >= index && activeChildIdx > 0) setActiveChildIdx(activeChildIdx - 1);
  }

  function toggleAllergen(id: string) {
    const list = activeChild.allergens;
    const newAllergens = list.includes(id) ? list.filter(a => a !== id) : [...list, id];
    updateActiveChild({ allergens: newAllergens });
  }

  function addCustomAllergen(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && customInput.trim() !== "") {
      e.preventDefault();
      const val = customInput.trim();
      if (!activeChild.customAllergens.includes(val)) {
        updateActiveChild({ customAllergens: [...activeChild.customAllergens, val] });
      }
      setCustomInput("");
    }
  }

  function removeCustomAllergen(val: string) {
    updateActiveChild({ customAllergens: activeChild.customAllergens.filter(a => a !== val) });
  }

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleNext() {
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const prefs: UserPreferences = {
        children,
        interests: selectedInterests,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      localStorage.setItem(ONBOARDING_DONE_KEY, "true");

      syncPreferencesToProfile(prefs).catch(() => { /* skip */ });

      setShowAnimation(true);
      setTimeout(() => onComplete(prefs), 1200);
    }
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_DONE_KEY, "true");
    onSkip();
  }

  const canProceed =
    step === 0 ? children.every(c => c.allergens.length > 0 || c.customAllergens.length > 0) :
    step === 1 ? children.every(c => c.ageGroup !== "") :
    selectedInterests.length > 0;

  if (showAnimation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-lg scale-in">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-[20px] font-extrabold text-[var(--color-text)] mb-2">準備完了！</h2>
          <p className="text-[14px] text-[var(--color-subtle)]">あなたに合った情報をお届けします 🌿</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] safe-bottom" role="dialog" aria-label="はじめの設定">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleSkip} className="text-[12px] text-[var(--color-subtle)] hover:text-[var(--color-text-secondary)] transition-colors py-2 px-1">スキップ</button>
          <span className="text-[11px] text-[var(--color-muted)] font-medium">{step + 1} / 3</span>
        </div>
        <div className="h-1.5 bg-[var(--color-border-light)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)] rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Child Tabs for Step 0 and 1 */}
        {(step === 0 || step === 1) && (
          <div className="mb-6 fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-sm">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-[18px] font-extrabold text-[var(--color-text)]">
                  {step === 0 ? "お子さまのアレルゲン設定" : "お子さまの年齢設定"}
                </h1>
                <p className="text-[12px] text-[var(--color-subtle)]">あとから変更できます（複数こども対応）</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
              {children.map((child, idx) => (
                <button
                  key={child.id}
                  onClick={() => setActiveChildIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${
                    activeChildIdx === idx ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)]"
                  }`}
                >
                  {child.name}
                  {activeChildIdx === idx && children.length > 1 && (
                    <span onClick={(e) => { e.stopPropagation(); handleRemoveChild(idx); }} className="ml-2 opacity-70 hover:opacity-100">×</span>
                  )}
                </button>
              ))}
              <button
                onClick={handleAddChild}
                className="px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap text-[var(--color-primary)] bg-[var(--color-primary)]/10 flex items-center gap-1 border border-[var(--color-primary)]/20"
              >
                <Plus className="w-3.5 h-3.5" /> 2人目を追加
              </button>
            </div>
          </div>
        )}

        {step === 0 && (
          <div className="fade-in pb-10">
            <h3 className="text-[13px] font-bold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[var(--color-primary)] rounded-full block"></span> 特定原材料8品目
            </h3>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {ALLERGENS_RAW_8.map((allergen) => {
                const selected = activeChild.allergens.includes(allergen.label);
                return (
                  <button
                    key={allergen.id}
                    onClick={() => toggleAllergen(allergen.label)}
                    className={`relative p-3 rounded-2xl border-2 transition-all duration-200 ${
                      selected ? "border-[var(--color-primary)] bg-[var(--color-success-light)] shadow-sm" : "border-[var(--color-border-light)] bg-[var(--color-surface)]"
                    }`}
                  >
                    {selected && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                    <span className="text-xl block mb-1">{allergen.emoji}</span>
                    <span className="text-[11px] font-bold text-[var(--color-text)]">{allergen.label}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="text-[13px] font-bold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[var(--color-accent)] rounded-full block"></span> 特定原材料に準ずるもの20品目
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {ALLERGENS_EQUIV_20.map((allergen) => {
                const selected = activeChild.allergens.includes(allergen.label);
                return (
                  <button
                    key={allergen.id}
                    onClick={() => toggleAllergen(allergen.label)}
                    className={`px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all ${
                      selected ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-[var(--color-border-light)] bg-white text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {selected && "✓ "}{allergen.label}
                  </button>
                );
              })}
            </div>

            <h3 className="text-[13px] font-bold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-gray-400 rounded-full block"></span> その他の自由設定
            </h3>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {activeChild.customAllergens.map((ca, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-surface-warm)] text-[12px] font-bold border border-[var(--color-border-light)]">
                    {ca}
                    <button onClick={() => removeCustomAllergen(ca)} className="w-4 h-4 rounded-full bg-black/5 flex items-center justify-center"><X className="w-2.5 h-2.5 text-[var(--color-text-secondary)]" /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={addCustomAllergen}
                placeholder="食材を入力してEnter..."
                className="w-full text-[13px] px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in pb-10">
            <div className="space-y-2.5">
              {AGE_OPTIONS.map((age) => {
                const selected = activeChild.ageGroup === age.id;
                return (
                  <button
                    key={age.id}
                    onClick={() => updateActiveChild({ ageGroup: age.id })}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between ${
                      selected ? "border-[var(--color-primary)] bg-[var(--color-success-light)] shadow-sm" : "border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                    }`}
                  >
                    <div>
                      <span className="text-[15px] font-bold text-[var(--color-text)]">{age.label}</span>
                      <span className="text-[12px] text-[var(--color-subtle)] ml-2">{age.sub}</span>
                    </div>
                    {selected && <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in pb-10">
            <h1 className="text-[18px] font-extrabold text-[var(--color-text)] mb-1">一番知りたいことは？</h1>
            <p className="text-[12px] text-[var(--color-subtle)] mb-5">あなたに合ったコンテンツを優先設定します</p>
            <div className="space-y-2.5">
              {INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                      selected ? "border-[var(--color-primary)] bg-[var(--color-success-light)] shadow-sm" : "border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-border)]"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{interest.emoji}</span>
                    <span className="text-[14px] font-bold text-[var(--color-text)] flex-1">{interest.label}</span>
                    {selected && <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-3 border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === 2 ? <><Sparkles className="w-4 h-4" />あんしんキッズをはじめる</> : <>次へ <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
