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

export async function getTalkRooms() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      // Demo mode with default rooms (8 balanced categories)
      return {
        success: true,
        data: [
          { id: "1", slug: "challenge", name: "負荷試験", description: "卵・乳・小麦などの負荷試験の体験談", icon_emoji: "🧪", sort_order: 1 },
          { id: "2", slug: "snacks", name: "市販品おやつ", description: "アレルギー対応の市販おやつ", icon_emoji: "🍪", sort_order: 2 },
          { id: "3", slug: "eating-out", name: "外食・チェーン店", description: "外食時のアレルギー対応", icon_emoji: "🍽️", sort_order: 3 },
          { id: "4", slug: "nursery", name: "保育園・幼稚園", description: "給食対応", icon_emoji: "🏫", sort_order: 4 },
          { id: "5", slug: "recipes", name: "代替レシピ", description: "アレルゲンフリーの代替レシピ", icon_emoji: "👩‍🍳", sort_order: 5 },
          { id: "6", slug: "skincare", name: "スキンケア", description: "アトピー・湿疹のケア", icon_emoji: "🧴", sort_order: 6 },
          { id: "7", slug: "hospital", name: "病院・主治医", description: "病院選び", icon_emoji: "🏥", sort_order: 7 },
          { id: "8", slug: "mental", name: "メンタルケア", description: "親の心のケア", icon_emoji: "💚", sort_order: 8 },
        ],
      };
    }

    const { data, error } = await supabase
      .from("talk_rooms")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error("[getTalkRooms]", err);
    return { success: true, data: [] };
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
