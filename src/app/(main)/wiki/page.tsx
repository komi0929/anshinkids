import { Suspense } from "react";
import { searchWiki } from "@/app/actions/wiki";
import WikiClient from "./wiki-client";

function WikiSkeleton() {
  return (
    <div className="fade-in pb-28 min-h-[100dvh] bg-[var(--color-bg-warm)]">
      <div className="px-5 pt-8 pb-4">
        <div className="shimmer h-8 w-48 rounded-xl mb-4"></div>
        <div className="shimmer h-12 w-full rounded-2xl mb-5"></div>
      </div>
      <div className="px-5 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-[28px] p-6 shadow-sm">
            <div className="shimmer w-3/4 h-6 rounded-md mb-3"></div>
            <div className="shimmer w-full h-4 rounded-md mb-2"></div>
            <div className="shimmer w-5/6 h-4 rounded-md"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function WikiContent() {
  // Server-side initial data fetch — no client round-trip needed
  const result = await searchWiki("", { sortBy: "popular" });
  const initialEntries = result.success ? result.data : [];

  return <WikiClient initialEntries={initialEntries} />;
}

export default function WikiPage() {
  return (
    <Suspense fallback={<WikiSkeleton />}>
      <WikiContent />
    </Suspense>
  );
}
