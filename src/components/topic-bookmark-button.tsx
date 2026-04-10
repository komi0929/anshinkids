"use client";

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleTopicSummaryBookmark, checkBookmarkedSnippets } from "@/app/actions/wiki";

export default function TopicBookmarkButton({ 
  summaryId, 
  snippetTitle, 
  snippetContent 
}: { 
  summaryId: string; 
  snippetTitle: string; 
  snippetContent: string;
}) {
  const [isBookmarked, setIsBookmarked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkBookmarkedSnippets(summaryId).then((res) => {
      if (res.success && res.data) {
        setIsBookmarked(res.data.includes(snippetTitle));
      } else {
        setIsBookmarked(false);
      }
    });
  }, [summaryId, snippetTitle]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    setIsLoading(true);
    
    // Optistic UI
    const previous = isBookmarked;
    setIsBookmarked(!previous);

    const result = await toggleTopicSummaryBookmark(summaryId, snippetTitle, snippetContent || "まとめがありません");
    
    if (!result.success) {
      // Revert on failure
      setIsBookmarked(previous);
      alert(result.error);
    }
    setIsLoading(false);
  }

  // Don't render until we know the state (to avoid flash)
  if (isBookmarked === null) return <div className="w-8 h-8 pointer-events-none" />;

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
        isBookmarked 
          ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]" 
          : "bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
      }`}
      aria-label={isBookmarked ? "ブックマーク解除" : "ブックマークに保存"}
      title={isBookmarked ? "ブックマーク解除" : "ブックマークに保存"}
    >
      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
    </button>
  );
}
