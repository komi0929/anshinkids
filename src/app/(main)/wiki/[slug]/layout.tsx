import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  let title = "記事が見つかりません";
  let description = "あんしんキッズ 知恵袋";
  let keywords = ["アレルギー", "あんしんキッズ", "知恵袋"];

  if (supabase) {
    const { data: entry } = await supabase
      .from("wiki_entries")
      .select("title, summary, allergen_tags")
      .eq("slug", params.slug)
      .single();

    if (entry) {
      title = `${entry.title} | あんしんキッズ知恵袋`;
      description = entry.summary || `${entry.title}についてのみんなの体験談と知恵のまとめです。`;
      if (entry.allergen_tags && Array.isArray(entry.allergen_tags)) {
        keywords = [...entry.allergen_tags, ...keywords];
      }
    }
  }

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'あんしんキッズ',
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function WikiArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
