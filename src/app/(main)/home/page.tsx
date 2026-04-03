import Link from "next/link";
import { Suspense } from "react";
import {
  Sparkles,
  MessageCircle,
  BookOpen,
  Leaf,
  TrendingUp,
  Heart,
  ChevronRight,
  Bookmark,
  ArrowRight,
} from "@/components/icons";
import {
  getEngagementTier,
  getTrendingTopics,
  getPersonalizedWikiEntries,
  getImpactFeedback,
} from "@/app/actions/discover";
import { getMyBookmarks } from "@/app/actions/wiki";

interface TrendingRoom {
  roomId: string;
  slug: string;
  name: string;
  icon_emoji: string;
  messageCount: number;
  thanksTotal: number;
}

export interface WikiEntryPreview {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  allergen_tags: string[];
  avg_trust_score: number;
  source_count: number;
}

export interface BookmarkData {
  id: string;
  snippet_title: string;
  snippet_content: string | null;
  created_at: string;
  wiki_entries: { id: string; title: string; slug: string; category: string };
}
export interface ImpactItem {
  wiki_entry_id: string | null;
  extracted_at: string | null;
  wiki_entries: { title: string; slug: string } | null;
}
export interface ImpactData {
  articlesHelped: number;
  totalSourcesInArticles: number;
  thanks: number;
  trustScore: number;
  message: string;
  recentImpacts: ImpactItem[];
}

function HomeSkeleton() {
  return (
    <div className="fade-in px-5 pt-8 w-full max-w-2xl mx-auto">
      <div className="shimmer h-10 w-48 rounded-xl mb-6"></div>
      <div className="shimmer h-40 w-full rounded-3xl mb-4"></div>
      <div className="shimmer h-32 w-full rounded-3xl mb-4"></div>
    </div>
  );
}

async function HomeContent() {
  const tierRes = await getEngagementTier().catch(() => ({
    success: false,
    data: undefined,
  }));
  const tierData =
    tierRes.success && tierRes.data
      ? (tierRes.data as {
          tier: "guest" | "reader" | "contributor";
          postCount: number;
        })
      : { tier: "guest" as const, postCount: 0 };

  const tier = tierData.tier;

  const [trendRes, recRes, impactRes, bmRes] = await Promise.all([
    getTrendingTopics().catch(() => ({ success: false, data: null })),
    getPersonalizedWikiEntries().catch(() => ({
      success: false,
      data: null,
      isPersonalized: false,
      personalizationLabel: "",
    })),
    tier === "contributor"
      ? getImpactFeedback().catch(() => ({ success: false, data: null }))
      : Promise.resolve({ success: false, data: null }),
    tier !== "guest"
      ? getMyBookmarks().catch(() => ({ success: false, data: null }))
      : Promise.resolve({ success: false, data: [] }),
  ]);

  const trending =
    trendRes.success && trendRes.data ? (trendRes.data as TrendingRoom[]) : [];
  const recommended =
    recRes.success && recRes.data
      ? {
          isPersonalized: !!recRes.isPersonalized,
          personalizationLabel: String(recRes.personalizationLabel || ""),
          data: recRes.data as WikiEntryPreview[],
        }
      : null;
  const impact =
    impactRes.success && impactRes.data
      ? (impactRes.data as unknown as ImpactData)
      : null;
  const bookmarks =
    bmRes.success && bmRes.data ? (bmRes.data as BookmarkData[]) : [];

  return (
    <div className="fade-in pb-12 w-full max-w-2xl mx-auto">
      <div className="page-header border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-md">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold text-[var(--color-text)] tracking-tight break-keep text-balance">
              あんしんキッズ
            </h1>
            <p className="text-[11px] font-bold text-[var(--color-text-secondary)]">
              みんなで育てる知恵袋コミュニティ
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {tier === "guest" && (
          <Link
            href="/login"
            className="block rounded-3xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] p-6 relative overflow-hidden shadow-md group slide-up border border-[var(--color-primary-light)] text-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-inner-soft">
                <Leaf className="w-8 h-8 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-[18px] font-extrabold text-white mb-2 leading-tight break-keep text-balance">
                ようこそ！
                <br />
                子どものアレルギーの知恵を、
                <br />
                みんなで共有しましょう
              </h2>
              <p className="text-[12px] text-white/90 font-medium mb-5 leading-relaxed">
                ログインすると、アレルゲン情報に合わせた「あなた専用の知恵袋」が届き、みんなの投稿にリアクションできるようになります。
              </p>
              <button className="btn-accent w-full max-w-xs mx-auto text-[14px]">
                30秒で始める（無料登録）
              </button>
            </div>
          </Link>
        )}

        {tier !== "guest" && (
          <div className="slide-up relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[20px] font-extrabold text-[var(--color-text)] break-keep text-balance">
                  こんにちは 👋
                </h2>
                <p className="text-[12px] text-[var(--color-text-secondary)] font-medium">
                  {tier === "contributor"
                    ? "今日もコミュニティの資産作りにご協力ありがとうございます"
                    : "プロフィール設定が完了しました。知恵袋を活用しましょう"}
                </p>
              </div>
            </div>

            {tier === "contributor" && impact && (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <Link
                  href="/mypage"
                  className="p-4 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-green-50 border border-green-100 flex flex-col justify-between h-24 shadow-sm relative overflow-hidden group hover:border-[var(--color-success)]/40 transition-colors"
                >
                  <div className="absolute -right-2 -bottom-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">
                    📖
                  </div>
                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)]">
                    反映された知恵
                  </p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-[28px] font-extrabold text-[var(--color-success-deep)] leading-none">
                      {impact.articlesHelped}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--color-success)] mb-1">
                      件
                    </span>
                  </div>
                </Link>
                <Link
                  href="/mypage"
                  className="p-4 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-pink-50 border border-pink-100 flex flex-col justify-between h-24 shadow-sm relative overflow-hidden group hover:border-[var(--color-heart)]/40 transition-colors"
                >
                  <div className="absolute -right-2 -bottom-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">
                    ❤️
                  </div>
                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)]">
                    みんなへのお役立ち
                  </p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-[28px] font-extrabold text-[var(--color-heart)] leading-none">
                      {impact.thanks}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--color-heart)] mb-1">
                      感謝
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}

        {tier === "reader" && (
          <Link
            href="/talk"
            className="block card-elevated p-5 flex items-start gap-4 slide-up border-l-4 border-l-[var(--color-accent)] group hover:bg-[var(--color-surface-warm)] transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-accent-light)] to-[var(--color-accent)] flex items-center justify-center shadow-accent border border-[rgba(255,255,255,0.4)] mt-1">
              <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[var(--color-primary)] mb-1 group-hover:text-[var(--color-accent)] transition-colors break-keep text-balance">
                最初の一歩を踏み出そう
              </h3>
              <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
                些細な疑問や、うまくいった工夫など。あなたの「みんなの声」への投稿が、AIを通じて未来の知恵袋に育ちます。
              </p>
              <div className="text-[11px] font-bold text-[var(--color-accent)] flex items-center gap-1">
                気軽に投稿しにいく <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        )}

        {recommended && recommended.data && recommended.data.length > 0 && (
          <div className="slide-up">
            <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center justify-between break-keep text-balance">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                {recommended.personalizationLabel || "あなたへの特別なおすすめ"}
                {(tier === "guest" || !recommended.isPersonalized) && (
                  <span className="text-[10px] text-[var(--color-subtle)] font-normal ml-1 border rounded px-1.5">
                    全体人気
                  </span>
                )}
              </span>
              <Link
                href="/wiki"
                className="text-[12px] text-[var(--color-subtle)] hover:text-[var(--color-primary)] font-bold flex items-center"
              >
                すべて見る <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </h3>

            <div className="space-y-3">
              {recommended.data.map((item) => (
                <Link
                  key={item.id}
                  href={`/wiki/${item.slug}`}
                  className="block p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-all group"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-surface-warm)] text-[var(--color-muted)]">
                      {item.category}
                    </span>
                    {item.allergen_tags && item.allergen_tags.length > 0 && (
                      <span className="text-[10px] font-bold text-[var(--color-text-secondary)] opacity-80 flex gap-1 line-clamp-1 truncate">
                        {item.allergen_tags
                          .slice(0, 2)
                          .map((t: string) => `#${t}`)
                          .join(" ")}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-[14px] text-[var(--color-text)] leading-snug mb-2 group-hover:text-[var(--color-primary)] transition-colors break-keep text-balance">
                    {item.title}
                  </h4>
                  <div className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 bg-[var(--color-surface-warm)] p-2 rounded-lg border border-[var(--color-border-light)] relative">
                    {item.summary.startsWith("💡") ? (
                      <>
                        <span className="font-bold text-[var(--color-primary)] mr-1">
                          💡抜粋:
                        </span>
                        {item.summary.substring(2)}
                      </>
                    ) : (
                      item.summary
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {trending.length > 0 && (
          <div className="slide-up" style={{ animationDelay: "100ms" }}>
            <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center justify-between break-keep text-balance">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                いま盛り上がっているテーマ
              </span>
              <Link
                href="/talk"
                className="text-[12px] text-[var(--color-subtle)] hover:text-[var(--color-primary)] font-bold flex items-center"
              >
                声を聞く <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </h3>
            <div className="grid gap-3">
              {trending.map((room) => (
                <Link
                  key={room.roomId}
                  href={`/talk/${room.slug}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] hover:border-[var(--color-border)] shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-soft)] border border-[var(--color-border-light)] shadow-inner-soft flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {room.icon_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[14px] text-[var(--color-text)] truncate break-keep text-balance">
                      {room.name}
                    </h4>
                    <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {room.messageCount}件の投稿
                      </span>
                      {room.thanksTotal > 0 && (
                        <span className="flex items-center gap-1 text-[var(--color-heart)]">
                          <Heart className="w-3.5 h-3.5" />
                          {room.thanksTotal}件の感謝
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-muted)] group-hover:text-[var(--color-text)] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {bookmarks.length > 0 && (
          <div className="slide-up pb-4" style={{ animationDelay: "150ms" }}>
            <h3 className="text-[15px] font-extrabold text-[var(--color-text)] mb-3 flex items-center justify-between break-keep text-balance">
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[var(--color-primary)]" />
                最近保存したスニペット
              </span>
              <Link
                href="/mypage"
                className="text-[12px] text-[var(--color-subtle)] font-bold flex items-center hover:text-[var(--color-primary)]"
              >
                すべて見る <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </h3>
            <div className="space-y-3">
              {bookmarks.slice(0, 2).map((bm) => (
                <Link
                  key={bm.id}
                  href={`/wiki/${bm.wiki_entries.slug}`}
                  className="block p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
                >
                  <p className="text-[10px] text-[var(--color-subtle)] mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {bm.wiki_entries.category}{" "}
                    / {bm.wiki_entries.title}
                  </p>
                  <h4 className="text-[13px] font-bold text-[var(--color-text)] mb-1 leading-tight group-hover:text-[var(--color-primary)] transition-colors break-keep text-balance">
                    {bm.snippet_title}
                  </h4>
                  <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-1">
                    {bm.snippet_content}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
