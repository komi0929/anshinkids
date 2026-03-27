import { getTalkRooms } from "@/app/actions/messages";
import Link from "next/link";

export default async function TalkRoomsPage() {
  const { data: rooms } = await getTalkRooms();

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">トークルーム</h1>
        <p className="page-subtitle">
          24時間で消える安心の空間。気軽に情報を共有できます
        </p>
      </div>

      {/* Ephemeral Notice */}
      <div className="mx-4 mb-4 p-4 rounded-xl bg-[var(--color-success-light)] border border-[var(--color-success)]/20">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🌿</span>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              投稿は24時間でリセットされます
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              あなたの体験は自動的にAIの辞書に吸収され、未来のママ・パパの助けになります。発言が残り続ける心配はありません。
            </p>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="px-4 space-y-3 pb-4">
        {rooms.map((room, index) => (
          <Link
            key={room.id || index}
            href={`/talk/${room.slug}`}
            className="card card-active block p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-warm)] flex items-center justify-center text-2xl flex-shrink-0">
                {room.icon_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[15px] text-[var(--color-text)]">
                  {room.name}
                </h3>
                <p className="text-xs text-[var(--color-subtle)] mt-0.5 truncate">
                  {room.description}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-[var(--color-muted)] flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
