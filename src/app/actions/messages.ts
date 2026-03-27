"use server";

import { createClient } from "@/lib/supabase/server";

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
      // Demo mode with default rooms
      return {
        success: true,
        data: [
          { id: "1", slug: "egg-challenge", name: "卵負荷試験", description: "卵の負荷試験の体験談", icon_emoji: "🥚", sort_order: 1 },
          { id: "2", slug: "milk-challenge", name: "乳負荷試験", description: "牛乳・乳製品の負荷試験", icon_emoji: "🥛", sort_order: 2 },
          { id: "3", slug: "wheat-challenge", name: "小麦負荷試験", description: "小麦の負荷試験", icon_emoji: "🌾", sort_order: 3 },
          { id: "4", slug: "snacks", name: "市販品おやつ", description: "アレルギー対応の市販おやつ", icon_emoji: "🍪", sort_order: 4 },
          { id: "5", slug: "eating-out", name: "外食・チェーン店", description: "外食時のアレルギー対応", icon_emoji: "🍽️", sort_order: 5 },
          { id: "6", slug: "nursery", name: "保育園・幼稚園", description: "給食対応", icon_emoji: "🏫", sort_order: 6 },
          { id: "7", slug: "recipes", name: "代替レシピ", description: "アレルゲンフリーの代替レシピ", icon_emoji: "👩‍🍳", sort_order: 7 },
          { id: "8", slug: "skincare", name: "スキンケア", description: "アトピー・湿疹のケア", icon_emoji: "🧴", sort_order: 8 },
          { id: "9", slug: "hospital", name: "病院・主治医", description: "病院選び", icon_emoji: "🏥", sort_order: 9 },
          { id: "10", slug: "mental", name: "メンタルケア", description: "親の心のケア", icon_emoji: "💚", sort_order: 10 },
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
