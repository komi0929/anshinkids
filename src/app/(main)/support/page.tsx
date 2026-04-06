"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export default function SupportPage() {
  return (
    <div className="fade-in pb-4">
      {/* Top action bar */}
      <div className="flex justify-between items-center px-5 pt-6 pb-2">
        <div>
          <h1 className="text-[24px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight break-keep text-balance">
            運営・サポート
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            あんしんキッズをより良くするためのサポート窓口です
          </p>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <Link
            href="/about"
            className="flex items-center justify-between p-4 hover:bg-[var(--color-surface-warm)] transition-colors border-b border-[var(--color-border-light)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                <span className="text-sm">🍀</span>
              </div>
              <div>
                <div className="text-[14px] font-bold text-[var(--color-text)] mb-0.5">あんしんキッズとは</div>
                <div className="text-[11px] text-[var(--color-subtle)]">サービスの仕組み・安心ポイント</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-muted)]" />
          </Link>
          <a
            href="mailto:support@anshin-kids.app?subject=アプリへのアイデア・バグ報告"
            className="flex items-center justify-between p-4 hover:bg-[var(--color-surface-warm)] transition-colors border-b border-[var(--color-border-light)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <span className="text-sm">💡</span>
              </div>
              <div>
                <div className="text-[14px] font-bold text-[var(--color-text)] mb-0.5">アイデア・バグ報告</div>
                <div className="text-[11px] text-[var(--color-subtle)]">アプリをもっと良くするためのご意見</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-muted)]" />
          </a>
          <a
            href="mailto:partner@anshin-kids.app?subject=活動への協賛・支援について"
            className="flex items-center justify-between p-4 hover:bg-[var(--color-surface-warm)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                <span className="text-sm">🤝</span>
              </div>
              <div>
                <div className="text-[14px] font-bold text-[var(--color-text)] mb-0.5">この活動を支援する</div>
                <div className="text-[11px] text-[var(--color-subtle)]">プロジェクトへのご意見・ご参画</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-muted)]" />
          </a>
        </div>
      </div>
    </div>
  );
}
