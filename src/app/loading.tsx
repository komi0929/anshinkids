import { Loader2 } from "@/components/icons";

export default function Loading() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 fade-in h-screen">
      <div className="space-y-6">
        {/* Faux Header Skeleton */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="shimmer w-14 h-14 rounded-full" />
          <div className="space-y-2">
            <div className="shimmer h-4 w-32 rounded-lg" />
            <div className="shimmer h-3 w-48 rounded-lg" />
          </div>
        </div>

        {/* Faux Content Cards Skeleton replicating 1.5px border Nani style */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border-[1.5px] border-[var(--color-border)] opacity-80 slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="space-y-3">
              <div className="shimmer h-4 w-3/4 rounded-lg" />
              <div className="shimmer h-4 w-5/6 rounded-lg" />
              <div className="shimmer h-4 w-2/3 rounded-lg" />
            </div>
            <div className="flex justify-between items-center mt-6">
              <div className="flex space-x-2">
                <div className="shimmer h-8 w-16 rounded-lg" />
                <div className="shimmer h-8 w-16 rounded-lg" />
              </div>
              <div className="shimmer h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Absolute fallback spinner for extremely long loads */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border-[1.5px] border-[var(--color-border)] shadow-sm">
        <Loader2 className="w-4 h-4 text-[var(--color-primary)] animate-spin" />
        <span className="text-[11px] font-bold text-[var(--color-primary)] tracking-wide">読み込み中...</span>
      </div>
    </div>
  );
}
