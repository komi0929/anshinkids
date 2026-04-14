"use client";

import { Loader2 } from "@/components/icons";

export default function WikiLoading() {
 return (
 <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
 <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
 <p className="text-[14px] font-bold text-[var(--color-text-secondary)]">
 まとめ記事を読み込み中...
 </p>
 </div>
 );
}
