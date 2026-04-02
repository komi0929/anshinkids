import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash, SYSTEM_PROMPTS } from "@/lib/ai/gemini";
import { SchemaType } from "@google/generative-ai";

export async function checkFreshness() {
  const supabase = createAdminClient();
  const model = getGeminiFlash(SYSTEM_PROMPTS.freshnessBot);

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
    const prompt = `以下の情報について質問文を生成してください：
タイトル: ${entry.title}
カテゴリー: ${entry.category}
関連アレルゲン: ${entry.allergen_tags?.join(", ") || "不明"}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            question: {
              type: SchemaType.STRING,
              description: "生成された質問文の文字列"
            }
          },
          required: ["question"]
        },
        temperature: 0.5,
      }
    });
    
    let botMessage = "";
    try {
      const parsed = JSON.parse(result.response.text());
      botMessage = parsed.question || "";
    } catch {
      botMessage = `【定期】「${entry.title}」について、最近何か変わったことはありましたか？`;
    }

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
      .maybeSingle();

    if (room && botMessage) {
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
