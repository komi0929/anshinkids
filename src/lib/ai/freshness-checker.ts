import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash, SYSTEM_PROMPTS } from "@/lib/ai/gemini";

export async function checkFreshness() {
  const supabase = createAdminClient();
  const model = getGeminiFlash();

  const threeMonthsAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Find stale wiki entries
  const { data: staleEntries } = await supabase
    .from("wiki_entries")
    .select("id, title, category, allergen_tags")
    .lt("freshness_checked_at", threeMonthsAgo)
    .limit(5);

  if (!staleEntries || staleEntries.length === 0) return { checked: 0 };

  for (const entry of staleEntries as unknown as {id: string; title: string; category: string; allergen_tags: string[]}[]) {
    // Generate friendly question
    const prompt = `${SYSTEM_PROMPTS.freshnessBot}

以下の情報について質問文を生成してください：
タイトル: ${entry.title}
カテゴリー: ${entry.category}
関連アレルゲン: ${entry.allergen_tags?.join(", ") || "不明"}`;

    const result = await model.generateContent(prompt);
    const botMessage = result.response.text();

    // Find appropriate room
    const categoryToRoomSlug: Record<string, string> = {
      "商品情報": "products",
      "市販品": "products",
      "おやつ": "products",
      "外食": "eating-out",
      "チェーン店": "eating-out",
      "レシピ": "daily-food",
      "負荷試験": "challenge",
      "病院": "challenge",
      "スキンケア": "skin-body",
      "体験記": "milestone",
      "基礎知識": "challenge",
    };

    let targetRoomSlug = "products";
    for (const [keyword, slug] of Object.entries(categoryToRoomSlug)) {
      if (entry.category.includes(keyword) || entry.title.includes(keyword)) {
        targetRoomSlug = slug;
        break;
      }
    }

    const { data: room } = await supabase
      .from("talk_rooms")
      .select("id")
      .eq("slug", targetRoomSlug)
      .single();

    if (room) {
      await supabase.from("messages").insert({
        room_id: room.id,
        content: botMessage.trim(),
        is_system_bot: true,
      });
    }

    // Update freshness check timestamp
    await supabase
      .from("wiki_entries")
      .update({ freshness_checked_at: new Date().toISOString() })
      .eq("id", entry.id);
  }

  return { checked: staleEntries.length };
}
