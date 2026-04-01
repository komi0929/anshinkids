"use server";

import { THEME_BY_SLUG } from "@/lib/themes";

/**
 * Phase 3: Topic Summoning — まとめ記事から引用質問を生成
 * 
 * Mega-Wiki内のセクション/項目から、対応するトークルームへの
 * 自動テキストを生成する。
 */
export async function generateSummonText(themeSlug: string, sectionHeading: string, itemTitle: string): Promise<{
  success: boolean;
  text: string;
  roomSlug: string;
}> {
  const theme = THEME_BY_SLUG[themeSlug];
  if (!theme) {
    return { success: false, text: "", roomSlug: "" };
  }

  // 自然な問いかけを生成
  const text = `【知恵袋から】${itemTitle}について、最近の体験を教えてください！ ${sectionHeading}の「${itemTitle}」の情報を更新したいです。`;

  return {
    success: true,
    text,
    roomSlug: themeSlug,
  };
}
