"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { THEMES } from "@/lib/themes";

/**
 * Phase 3: Architecture Pivot
 * 8本のMega-Wiki記事をシードし、既存の細かい記事はアーカイブする。
 */
export async function seedMegaWikis() {
 try {
 const supabase = createAdminClient();
 if (!supabase) return { success: false, error: "Admin client not available" };

 // 1. 既存の薄い記事（is_mega_wiki = false または theme_slug なし）を非公開にする
 const { error: archiveError } = await supabase
 .from("wiki_entries")
 .update({ is_public: false })
 .or('is_mega_wiki.eq.false,is_mega_wiki.is.null');

 if (archiveError) {
 console.error("[seedMegaWikis] Archive error:", archiveError);
 return { success: false, error: archiveError.message };
 }

 // 2. 8本のMega-Wikiをシード
 let insertedCount = 0;
 
 for (const theme of THEMES) {
 const megaWikiSlug = `mega-${theme.slug}`;
 
 const { data: existing } = await supabase
 .from("wiki_entries")
 .select("id")
 .eq("slug", megaWikiSlug)
 .maybeSingle();

 if (!existing) {
 const { error: insertError } = await supabase
 .from("wiki_entries")
 .insert({
 slug: megaWikiSlug,
 title: `【総合】${theme.name}`,
 summary: `${theme.name}に関するみんなのヒント集・体験談の総合まとめです。`,
 category: theme.name,
 theme_slug: theme.slug,
 is_mega_wiki: true,
 is_public: true,
 sections: [], // 初期状態は空配列
 });

 if (insertError) {
 console.error(`[seedMegaWikis] Insert error for ${theme.slug}:`, insertError);
 } else {
 insertedCount++;
 }
 } else {
 // Ensure it's public and correctly flagged if already exists
 await supabase
 .from("wiki_entries")
 .update({ is_public: true, is_mega_wiki: true, theme_slug: theme.slug })
 .eq("id", existing.id);
 }
 }

 return {
 success: true,
 message: `${insertedCount}件のMega-Wikiをシードし、旧記事をアーカイブしました`,
 inserted: insertedCount,
 };
 } catch (err) {
 console.error("[seedMegaWikis]", err);
 return { success: false, error: "Mega-Wikiシードに失敗しました" };
 }
}

/**
 * Talk Room テーマを「実体験を聞きたい」軸で更新
 * 負荷試験は1テーマに統一。通院・治療の曖昧カテゴリは廃止。
 */
export async function updateTalkRoomThemes() {
 try {
 const supabase = createAdminClient();
 if (!supabase) return { success: false, error: "Admin client not available" };

 // Deactivate old rooms
 await supabase
 .from("talk_rooms")
 .update({ is_active: false })
 .eq("is_active", true);

 // Upsert new rooms
 for (const room of THEMES) {
 const { data: existing } = await supabase
 .from("talk_rooms")
 .select("id")
 .eq("slug", room.slug)
 .maybeSingle();

 if (existing) {
 await supabase
 .from("talk_rooms")
 .update({ ...room, is_active: true })
 .eq("id", existing.id);
 } else {
 await supabase
 .from("talk_rooms")
 .insert({ ...room, is_active: true });
 }
 }

 return {
 success: true,
 message: `${THEMES.length}件のテーマを更新しました`,
 };
 } catch (err) {
 console.error("[updateTalkRoomThemes]", err);
 return { success: false, error: "テーマ更新に失敗しました" };
 }
}

