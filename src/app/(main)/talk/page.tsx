import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, ArrowRight } from "@/components/icons";
import { getTalkRooms } from "@/app/actions/messages";
import { getTrendingTopics, getContributionStreak, getWeeklyDigest } from "@/app/actions/discover";
import { getMyProfile } from "@/app/actions/mypage";

interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  sort_order: number;
}

interface TrendingTopic {
  slug: string;
  name: string;
  icon_emoji: string;
  messageCount: number;
  thanksTotal: number;
}


interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

interface DigestData {
  newArticles: Array<{ title: string; slug: string; summary: string }>;
  newArticleCount: number;
  messageCount: number;
  uniqueContributors: number;
}

function TalkSkeleton() {
  return (
    <div className="fade-in px-5 pt-8 w-full max-w-2xl mx-auto">
      <div className="shimmer h-10 w-48 rounded-xl mb-6"></div>
      <div className="shimmer h-24 w-full rounded-2xl mb-4"></div>
      <div className="shimmer h-[80px] w-full rounded-2xl mb-3"></div>
      <div className="shimmer h-[80px] w-full rounded-2xl mb-3"></div>
      <div className="shimmer h-[80px] w-full rounded-2xl mb-3"></div>
    </div>
  );
}

async function TalkContent() {
  // Parallel fetch everything required
  const [roomsRes, profileRes, trendRes, streakRes, digestRes] = await Promise.all([
    getTalkRooms().catch(() => ({ success: false, data: null })),
    getMyProfile().catch(() => ({ success: false, data: null })),
    getTrendingTopics().catch(() => ({ success: false, data: null })),

    getContributionStreak().catch(() => ({ success: false, data: null })),
    getWeeklyDigest().catch(() => ({ success: false, data: null })),
  ]);

  const rooms = (roomsRes.success && roomsRes.data ? roomsRes.data : []) as Room[];
  let recommendedRooms: Room[] = [];
  
  if (profileRes.success && profileRes.data && profileRes.data.interests) {
    const userInterests = profileRes.data.interests as string[];
    if (userInterests.length > 0) {
      recommendedRooms = rooms.filter(r => userInterests.includes(r.slug));
    }
  }

  const trending = trendRes.success && trendRes.data ? trendRes.data as TrendingTopic[] : [];

  const streak = streakRes.success && streakRes.data ? streakRes.data as StreakData : null;
  const digest = digestRes.success && digestRes.data ? digestRes.data as DigestData : null;

  return (
    <div className="fade-in w-full max-w-2xl mx-auto pb-12">
      {/* Clean Header */}
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-[26px] font-black tracking-tight leading-tight break-keep text-balance" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          トークルーム
        </h1>
        <p className="text-[14px] font-medium mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          食物アレルギーの実体験をテーマ別にシェアする場所
        </p>
      </div>

      {/* === Participation Banner (logged-in users only) === */}
      {streak && streak.currentStreak > 0 && (
        <div className="px-4 mb-4 slide-up">
          <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="text-2xl">🌱</div>
            <div className="flex-1">
              <p className="text-[14px] font-bold" style={{ color: 'var(--color-text)' }}>
                {streak.currentStreak}日連続で遊びにきてるね！
              </p>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                通算{streak.totalDays}日参加 · 過去しおり{streak.longestStreak}日
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(streak.currentStreak, 7) }).map((_, i) => (
                <div key={i} className={`w-2 h-${2 + Math.min(i, 4)} rounded-full bg-[var(--color-primary)] opacity-70`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === Weekly Community Activity Banner === */}
      {digest && digest.messageCount > 0 && (
        <div className="px-4 mb-4 slide-up">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🌿</span>
              <span className="text-[14px] font-bold" style={{ color: 'var(--color-text)' }}>今週のみんなの活動</span>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-[20px] font-black" style={{ color: 'var(--color-primary)' }}>{digest.messageCount}</p>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-subtle)' }}>件のお声</p>
              </div>
              <div>
                <p className="text-[20px] font-black" style={{ color: 'var(--color-primary)' }}>{digest.uniqueContributors}</p>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-subtle)' }}>人が参加</p>
              </div>
              <div>
                <p className="text-[20px] font-black" style={{ color: 'var(--color-primary)' }}>{digest.newArticleCount}</p>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--color-subtle)' }}>新しいまとめ</p>
              </div>
            </div>
            {digest.newArticles.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--color-subtle)' }}>🆕 新しいみんなのまとめ</p>
                {digest.newArticles.slice(0, 2).map((a) => (
                  <Link key={a.slug} href={`/wiki/${a.slug}`} className="block text-[13px] font-semibold hover:underline truncate mb-1 whitespace-nowrap" style={{ color: 'var(--color-primary)' }}>
                    → {a.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Trending Topics === */}
      {trending.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🔥</span>
            <h2 className="text-[14px] font-bold break-keep text-balance" style={{ color: 'var(--color-text)' }}>いま盛り上がっている</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {trending.map((t) => (
              <Link
                key={t.slug}
                href={`/talk/${t.slug}`}
                className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                id={`trending-${t.slug}`}
              >
                <span className="text-lg">{t.icon_emoji}</span>
                <div>
                  <p className="text-[13px] font-bold whitespace-nowrap" style={{ color: 'var(--color-text)' }}>{t.name}</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--color-subtle)' }}>
                    {t.messageCount}件のお声 · 💚{t.thanksTotal}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* Info chip */}
      <div className="px-5 mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            あなたのお声は一定時間でリセットされ、会話のヒントはAIが「みんなのまとめ」に保存します
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div className="px-5 mb-3 section-header">
        <h2>
          <MessageCircle size={16} className="text-[var(--color-primary)]" />
          トークルーム
        </h2>
        {rooms.length > 0 && (
          <span className="counter">{rooms.length}件</span>
        )}
      </div>

      {/* Room List */}
      <div className="px-4 space-y-3 pb-4">
        {rooms.map((room, index) => {
          const isRecommended = recommendedRooms.some((r) => r.slug === room.slug);
          return (
            <Link
              key={room.id || index}
              href={`/talk/${room.slug}`}
              className={`card card-tilt card-active block p-4 stagger-item group ${isRecommended ? "ring-1 ring-[var(--color-primary)]/20 bg-[var(--color-surface-warm)]/30" : ""}`}
              id={`talk-room-${room.slug}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[var(--color-surface-warm)] to-white flex items-center justify-center text-[24px] flex-shrink-0 shadow-sm border border-[var(--color-border-light)] group-hover:scale-105 transition-transform">
                  {room.icon_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[15px] group-hover:text-[var(--color-primary)] transition-colors break-keep text-balance" style={{ color: 'var(--color-text)' }}>
                      {room.name}
                    </h3>
                    {isRecommended && (
                      <span className="text-[9px] font-bold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-2 py-0.5 rounded-full flex-shrink-0">
                        おすすめ
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium mt-0.5 truncate leading-relaxed" style={{ color: 'var(--color-subtle)' }}>
                    {room.description}
                  </p>
                </div>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                  <ArrowRight size={14} className="text-[var(--color-muted)] group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>


    </div>
  );
}

export default function TalkRoomsPage() {
  return (
    <Suspense fallback={<TalkSkeleton />}>
      <TalkContent />
    </Suspense>
  );
}
