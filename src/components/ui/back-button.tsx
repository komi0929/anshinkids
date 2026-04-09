"use client";

import { ArrowLeft } from "@/components/icons";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-surface-warm)] hover:bg-[var(--color-border-light)] transition-colors active:scale-95"
      id="back-from-about"
      aria-label="戻る"
    >
      <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
    </button>
  );
}
