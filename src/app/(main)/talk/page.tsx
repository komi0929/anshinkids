import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "@/components/icons";
import { getTalkRooms } from "@/app/actions/messages";


interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  sort_order: number;
}

function TalkSkeleton() {
  return (
    <div className="fade-in px-5 pt-8 w-full max-w-2xl mx-auto">
      <div className="shimmer h-10 w-48 rounded-xl mb-6"></div>
      <div className="shimmer h-[80px] w-full rounded-2xl mb-3"></div>
      <div className="shimmer h-[80px] w-full rounded-2xl mb-3"></div>
      <div className="shimmer h-[80px] w-full rounded-2xl mb-3"></div>
    </div>
  );
}

async function TalkContent() {
  const roomsRes = await getTalkRooms().catch(() => ({ success: false, data: null }));
  const rooms = (roomsRes.success && roomsRes.data ? roomsRes.data : []) as Room[];

  return (
    <div className="fade-in w-full max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-[24px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight break-keep text-balance">
          テーマ一覧
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
          気になるテーマを選んで、知恵を読む・会話に参加する
        </p>
      </div>

      {/* Room List */}
      <div className="px-4 space-y-3 pb-4">
        {rooms.map((room, index) => (
          <Link
            key={room.id || index}
            href={`/talk/${room.slug}`}
            prefetch={true}
            className="block p-5 rounded-2xl bg-white shadow-sm border border-[var(--color-border-light)] transition-all hover:shadow-sm active:scale-[0.98] stagger-item group"
            id={`talk-room-${room.slug}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--color-bg)] flex items-center justify-center text-[28px] flex-shrink-0  group-hover:scale-105 transition-transform">
                {room.icon_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[15px] text-[var(--color-text)] group-hover:text-[var(--color-primary-dark)] transition-colors break-keep text-balance">
                  {room.name}
                </h3>
                <p className="text-[13px] text-[var(--color-subtle)] font-medium mt-1 truncate leading-relaxed">
                  {room.description}
                </p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-all">
                <ArrowRight size={14} className="text-[var(--color-muted)] group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>
        ))}
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
