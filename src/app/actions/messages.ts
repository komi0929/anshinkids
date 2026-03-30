"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get stored prompts from DB (no AI call).
 * Prompts are pre-seeded and replenished after conversations start.
 */
export async function getRoomPrompts(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    const { data, error } = await supabase
      .from("talk_rooms")
      .select("conversation_prompts")
      .eq("id", roomId)
      .single();

    if (error) throw error;
    const prompts = (data?.conversation_prompts as string[]) || [];
    return { success: true, data: prompts };
  } catch (err) {
    console.error("[getRoomPrompts]", err);
    return { success: true, data: [] };
  }
}

/**
 * Replenish prompts via AI after a conversation starts.
 * Called as a background task after posting a message.
 * Adds new prompts without removing existing ones.
 */
async function replenishRoomPrompts(roomId: string, roomName: string, roomDesc: string) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return;

    const supabase = await createClient();
    if (!supabase) return;

    // Get current prompts
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("conversation_prompts")
      .eq("id", roomId)
      .single();

    const currentPrompts = (room?.conversation_prompts as string[]) || [];
    // Only replenish if we have fewer than 6 prompts
    if (currentPrompts.length >= 6) return;

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `あなたは食物アレルギーを持つ子どもの親のコミュニティのファシリテーターです。

以下のトークルームに新しい「問いかけ」を2つ追加生成してください。

ルーム名: ${roomName}
ルーム説明: ${roomDesc}

既存の問いかけ（重複しないように）:
${currentPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

ルール:
- 既存と重複しない、新鮮な切り口の問いかけにする
- 保護者が体験を共有したくなるカジュアルなトーンにする
- 各質問は40文字以内
- 医療的な判断は避ける

JSON形式で配列のみ返してください:
["新しい質問1", "新しい質問2"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*?\]/);

    if (match) {
      const newPrompts: string[] = JSON.parse(match[0]);
      const merged = [...currentPrompts, ...newPrompts.slice(0, 2)];
      await supabase
        .from("talk_rooms")
        .update({ conversation_prompts: merged })
        .eq("id", roomId);
    }
  } catch (err) {
    console.error("[replenishRoomPrompts]", err);
  }
}

export async function postMessage(roomId: string, content: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      user_id: user.id,
      content: content.trim(),
    });

    if (error) throw error;

    // Replenish prompts in background (don't await)
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("name, description")
      .eq("id", roomId)
      .single();
    if (room) {
      replenishRoomPrompts(roomId, room.name, room.description || "").catch(() => {});
    }

    return { success: true };
  } catch (err) {
    console.error("[postMessage]", err);
    return { success: false, error: "投稿に失敗しました" };
  }
}

export async function sendThanks(messageId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase.from("message_thanks").insert({
      message_id: messageId,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "すでに感謝しています" };
      }
      throw error;
    }
    return { success: true };
  } catch (err) {
    console.error("[sendThanks]", err);
    return { success: false, error: "操作に失敗しました" };
  }
}

export async function removeThanks(messageId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase
      .from("message_thanks")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("[removeThanks]", err);
    return { success: false, error: "操作に失敗しました" };
  }
}

export async function getActiveMessages(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        profiles:user_id (display_name, avatar_url, trust_score)
      `)
      .eq("room_id", roomId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error("[getActiveMessages]", err);
    return { success: true, data: [] };
  }
}

// Canonical Talk Room themes — 実体験を聞きたい軸（Single Source of Truth）
const CANONICAL_ROOMS = [
  { id: "1", slug: "daily-food", name: "毎日のごはん", description: "献立・代替食材・お弁当のリアルな工夫", icon_emoji: "🍚", sort_order: 1 },
  { id: "2", slug: "products", name: "使ってよかった市販品", description: "おやつ・パン・調味料のクチコミ", icon_emoji: "🛒", sort_order: 2 },
  { id: "3", slug: "eating-out", name: "外食・おでかけ", description: "チェーン店・旅行・イベントの対応", icon_emoji: "🍽️", sort_order: 3 },
  { id: "4", slug: "school-life", name: "園・学校との連携", description: "給食・面談・行事の乗り切り方", icon_emoji: "🏫", sort_order: 4 },
  { id: "5", slug: "challenge", name: "負荷試験の体験談", description: "準備・当日の流れ・結果後の変化", icon_emoji: "🧪", sort_order: 5 },
  { id: "6", slug: "skin-body", name: "肌とからだのケア", description: "アトピー・保湿・スキンケアの工夫", icon_emoji: "🧴", sort_order: 6 },
  { id: "7", slug: "family", name: "気持ち・家族・まわり", description: "不安・理解・パートナーや祖父母との関わり", icon_emoji: "👨‍👩‍👧", sort_order: 7 },
  { id: "8", slug: "milestone", name: "食べられた！の記録", description: "克服・成長のうれしい報告", icon_emoji: "🌱", sort_order: 8 },
];

const CANONICAL_SLUGS = new Set(CANONICAL_ROOMS.map(r => r.slug));

export async function getTalkRooms() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: true, data: CANONICAL_ROOMS };
    }

    const { data, error } = await supabase
      .from("talk_rooms")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    // DB rooms exist and ALL canonical slugs are present → use DB data
    if (data && data.length > 0) {
      const dbSlugs = new Set(data.map((r: { slug: string }) => r.slug));
      const allCanonicalPresent = [...CANONICAL_SLUGS].every(s => dbSlugs.has(s));
      if (allCanonicalPresent) {
        // Filter to only canonical slugs and sort correctly
        const canonicalData = data
          .filter((r: { slug: string }) => CANONICAL_SLUGS.has(r.slug))
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
        return { success: true, data: canonicalData };
      }
    }

    // DB has stale themes or is empty → use canonical list
    return { success: true, data: CANONICAL_ROOMS };
  } catch (err) {
    console.error("[getTalkRooms]", err);
    return { success: true, data: CANONICAL_ROOMS };
  }
}

export async function getTalkRoomBySlug(slug: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続", data: null };

    const { data, error } = await supabase
      .from("talk_rooms")
      .select("id, slug, name, description, icon_emoji")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("[getTalkRoomBySlug]", err);
    return { success: false, error: "ルームが見つかりません", data: null };
  }
}

export async function getWikiCountForRoom(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, count: 0 };

    // Count wiki sources that came from messages in this room
    const { count, error } = await supabase
      .from("wiki_sources")
      .select("id", { count: "exact", head: true });

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (err) {
    console.error("[getWikiCountForRoom]", err);
    return { success: true, count: 0 };
  }
}

export async function getRelatedWikiEntries(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    // Get room info to find category matches
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("name, description")
      .eq("id", roomId)
      .single();

    if (!room) return { success: true, data: [] };

    // Map room name/keywords to wiki categories for matching
    const roomName = (room.name || "").toLowerCase();
    const roomDesc = (room.description || "").toLowerCase();
    const keywords = `${roomName} ${roomDesc}`;

    // Search wiki entries that match the room's theme
    let queryBuilder = supabase
      .from("wiki_entries")
      .select("id, title, slug, source_count, avg_trust_score")
      .order("source_count", { ascending: false })
      .limit(5);

    // Build search filter based on room keywords
    const searchTerms: string[] = [];
    if (keywords.includes("卵")) searchTerms.push("卵");
    if (keywords.includes("乳")) searchTerms.push("乳");
    if (keywords.includes("小麦")) searchTerms.push("小麦");
    if (keywords.includes("ごはん") || keywords.includes("献立") || keywords.includes("レシピ") || keywords.includes("料理")) searchTerms.push("レシピ");
    if (keywords.includes("市販") || keywords.includes("おやつ") || keywords.includes("クチコミ")) searchTerms.push("市販");
    if (keywords.includes("外食") || keywords.includes("チェーン") || keywords.includes("旅行")) searchTerms.push("外食");
    if (keywords.includes("園") || keywords.includes("保育") || keywords.includes("学校") || keywords.includes("給食")) searchTerms.push("保育");
    if (keywords.includes("負荷") || keywords.includes("試験")) searchTerms.push("負荷", "病院");
    if (keywords.includes("肌") || keywords.includes("スキン") || keywords.includes("アトピー")) searchTerms.push("スキンケア");
    if (keywords.includes("家族") || keywords.includes("不安") || keywords.includes("理解")) searchTerms.push("家族");
    if (keywords.includes("食べられ") || keywords.includes("克服") || keywords.includes("成長")) searchTerms.push("克服");

    if (searchTerms.length > 0) {
      const orFilter = searchTerms.map(t => `title.ilike.%${t}%`).join(",");
      queryBuilder = queryBuilder.or(orFilter);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error("[getRelatedWikiEntries]", err);
    return { success: true, data: [] };
  }
}

export async function findSimilarRooms(name: string, description: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    // Get all existing rooms
    const { data: rooms } = await supabase
      .from("talk_rooms")
      .select("id, slug, name, description, icon_emoji")
      .eq("is_active", true);

    if (!rooms || rooms.length === 0) return { success: true, data: [] };

    // Use Gemini to find similar rooms
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // Fallback: simple text matching
      const similar = rooms.filter((r) => {
        const rName = (r.name || "").toLowerCase();
        const rDesc = (r.description || "").toLowerCase();
        const qName = name.toLowerCase();
        const qDesc = description.toLowerCase();
        return (
          rName.includes(qName) ||
          qName.includes(rName) ||
          rDesc.includes(qName) ||
          qName.includes(rDesc) ||
          rName.includes(qDesc) ||
          qDesc.includes(rName)
        );
      });
      return { success: true, data: similar };
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `あなたはトークルームの類似性を判定するAIです。

ユーザーが以下のテーマで新しいトークルームを作ろうとしています：
テーマ名: 「${name}」
説明: 「${description}」

既存のトークルーム一覧:
${rooms.map((r, i) => `${i + 1}. 「${r.name}」- ${r.description}`).join("\n")}

上記の既存ルームの中で、ユーザーが作ろうとしているテーマと内容が重複・類似するものがあれば、
その番号をJSON配列で返してください。類似がなければ空配列を返してください。

判定基準:
- 同じアレルゲンについて話している場合は類似
- 同じシチュエーション（外食、保育園等）について話している場合は類似
- テーマの一部が重なる場合は類似

回答は数字の配列のみ（例: [1, 3, 5] ）`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\[[\d\s,]*\]/);

    if (match) {
      const indices: number[] = JSON.parse(match[0]);
      const similarRooms = indices
        .map((i) => rooms[i - 1])
        .filter(Boolean);
      return { success: true, data: similarRooms };
    }

    return { success: true, data: [] };
  } catch (err) {
    console.error("[findSimilarRooms]", err);
    return { success: true, data: [] };
  }
}

export async function createTalkRoom(
  name: string,
  description: string,
  iconEmoji: string
) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    // Generate slug from name
    const slug = name
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 60)
      + "-" + Date.now().toString(36);

    // Get the max sort_order
    const { data: maxOrder } = await supabase
      .from("talk_rooms")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = ((maxOrder?.sort_order as number) || 100) + 1;

    const { data, error } = await supabase
      .from("talk_rooms")
      .insert({
        slug,
        name: name.trim(),
        description: description.trim(),
        icon_emoji: iconEmoji || "💬",
        sort_order: nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("[createTalkRoom]", err);
    return { success: false, error: "ルームの作成に失敗しました" };
  }
}
