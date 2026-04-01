"use server";

import { createClient } from "@/lib/supabase/server";
import { THEMES, THEME_BY_SLUG } from "@/lib/themes";

export async function getRoomPrompts(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    const { data } = await supabase
      .from("talk_rooms")
      .select("conversation_prompts")
      .eq("id", roomId)
      .single();

    return { success: true, data: data?.conversation_prompts || [] };
  } catch (err) {
    console.error("[getRoomPrompts]", err);
    return { success: true, data: [] };
  }
}

async function replenishRoomPrompts(roomId: string, roomName: string, roomDesc: string) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return;

    const supabase = await createClient();
    if (!supabase) return;

    const { data: room } = await supabase
      .from("talk_rooms")
      .select("conversation_prompts")
      .eq("id", roomId)
      .single();

    const currentPrompts = (room?.conversation_prompts as string[]) || [];
    if (currentPrompts.length >= 6) return;

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `あなたは食物アレルギーを持つ子供の親のコミュニティのファシリテーターです。
以下のトークルームに新しい「問いかけ」を2つ追加生成してください。
ルーム名: ${roomName}
ルーム説明: ${roomDesc}

既存の問いかけ（重複しないように）:
${currentPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

ルール:
- 既存と重複しない、斬新な切り口の問いかけにする
- 保護者が体験を共有したくなるカジュアルなトーンにする
- 各質問は40文字以内、医療的な判断は避ける

JSON形式で配列のみ返してください:
["新しい質問1", "新しい質問2"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*?\]/);

    if (match) {
      const newPrompts: string[] = JSON.parse(match[0]);
      const merged = [...currentPrompts, ...newPrompts.slice(0, 2)];
      await supabase.from("talk_rooms").update({ conversation_prompts: merged }).eq("id", roomId);
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

    const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    await supabase.from("messages").update({ expires_at: newExpiry }).eq("room_id", roomId);

    const { data: room } = await supabase.from("talk_rooms").select("name, description").eq("id", roomId).single();
    if (room) {
      replenishRoomPrompts(roomId, room.name, room.description || "").catch(() => {});
    }

    import("@/lib/ai/threshold-extractor")
      .then(({ checkExtractionThresholds }) => checkExtractionThresholds())
      .catch(() => {});

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
      if (error.code === "23505") return { success: false, error: "すでに感謝しています" };
      throw error;
    }

    try {
      const { data: msg } = await supabase.from("messages").select("room_id").eq("id", messageId).single();
      if (msg?.room_id) {
        const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        await supabase.from("messages").update({ expires_at: newExpiry }).eq("room_id", msg.room_id);
      }
    } catch { /* non-critical */ }

    return { success: true };
  } catch (err) {
    console.error("[sendThanks]", err);
    return { success: false, error: "操作に失敗しました" };
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", user.id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("[deleteMessage]", err);
    return { success: false, error: "削除に失敗しました" };
  }
}

export async function removeThanks(messageId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase.from("message_thanks").delete().eq("message_id", messageId).eq("user_id", user.id);
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
      .select("*, profiles:user_id (display_name, avatar_url, trust_score)")
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
    if (!supabase) return { success: true, data: THEMES };

    const { data, error } = await supabase
      .from("talk_rooms")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return { success: true, data };
    }
    return { success: true, data: THEMES };
  } catch (err) {
    console.error("[getTalkRooms]", err);
    return { success: true, data: THEMES };
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

    if (!error && data) return { success: true, data };

    const theme = THEME_BY_SLUG[slug];
    if (theme) {
       // Return constructed stub if not in DB yet (will be created by seed)
       return { success: true, data: { ...theme, id: 'temp-id' } };
    }

    return { success: false, error: "ルームが見つかりません", data: null };
  } catch (err) {
    console.error("[getTalkRoomBySlug]", err);
    return { success: false, error: "ルームが見つかりません", data: null };
  }
}

export async function getWikiCountForRoom(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, count: 0 };

    const { data: room } = await supabase.from("talk_rooms").select("slug").eq("id", roomId).single();
    if (!room || !room.slug) return { success: true, count: 0 };

    const megaSlug = `mega-${room.slug}`;
    const { count } = await supabase
      .from("wiki_entries")
      .select("id", { count: "exact" })
      .eq("slug", megaSlug);
      
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

    const { data: room } = await supabase.from("talk_rooms").select("slug").eq("id", roomId).single();
    if (!room || !room.slug) return { success: true, data: [] };

    const megaSlug = `mega-${room.slug}`;
    const { data } = await supabase
      .from("wiki_entries")
      .select("id, title, slug, source_count, avg_trust_score")
      .eq("slug", megaSlug);
      
    return { success: true, data: data || [] };
  } catch (err) {
    console.error("[getRelatedWikiEntries]", err);
    return { success: true, data: [] };
  }
}

// 類似ルームや個別スレッド検索関数はPhase 3で削除 (不要なUIはあとで消される)
export async function findSimilarRooms() { return { success: true, data: [] }; }
export async function createTalkRoom() { return { success: false, error: "現在は新しいルームを作成できません" }; }
export async function getThreadsForTheme() { return { success: true, data: [] }; }
