import type { Metadata } from "next";
import { getWikiEntry } from "@/app/actions/wiki";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.anshin.kids";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const result = await getWikiEntry(resolvedParams.slug);
  
  if (result.success && result.data) {
    const title = result.data.title;
    const sourceCount = result.data.source_count || 0;
    const category = result.data.category || "アレルギー・育児";
    const tags = result.data.allergen_tags || [];
    // Answer-first description optimized for AI extraction
    const summary = result.data.summary 
      || `${title}について、${sourceCount}人の親御さんの実体験をもとにまとめた知恵袋です。${category}に関する具体的な体験談・対処法・おすすめ情報を掲載しています。`;
    const pageUrl = `${SITE_URL}/wiki/${resolvedParams.slug}`;
    
    return {
      title,
      description: summary,
      keywords: [...tags, category, "食物アレルギー", "実体験", "親の声", title],
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: `${title} | あんしんキッズ知恵袋`,
        description: `${sourceCount}人の親御さんの実体験に基づく${title}の情報。${summary}`,
        url: pageUrl,
        siteName: "あんしんキッズ",
        locale: "ja_JP",
        type: "article",
        modifiedTime: result.data.updated_at,
        publishedTime: result.data.created_at,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | あんしんキッズ`,
        description: `${sourceCount}人の実体験に基づく知恵袋。${summary}`,
      },
    };
  }
  return { title: 'みんなの知恵袋' };
}

export default function WikiDynamicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
