"use client";

import { useState } from "react";
import { Check } from "@/components/icons";

interface InstantCopyButtonProps {
  text: string;
}

export function InstantCopyButton({ text }: InstantCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // 1. Tactile feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([10, 30, 10]); // Quick double pulse for "Success"
      } catch (err) {}
    }

    // 2. Action
    navigator.clipboard.writeText(text);

    // 3. Visual Feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`mt-3 px-4 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all w-full select-none
        ${copied 
          ? "bg-[var(--color-success)] text-white" 
          : "bg-[var(--color-surface-soft)] text-[var(--color-primary-dark)] hover:bg-[var(--color-primary)]/10"
        }
      `}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      {copied ? (
        <>
          <Check size={16} /> コピー完了
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          回答をコピー（保育園・飲食店用）
        </>
      )}
    </button>
  );
}
