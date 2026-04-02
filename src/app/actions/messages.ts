"use server";

import { createClient } from "@/lib/supabase/server";
import { THEMES, THEME_BY_SLUG } from "@/lib/themes";
import { ActionResponse, CommonSchemas } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function getRoomPrompts(roomId: string): Promise<ActionResponse<string[]>> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    const { data } = await supabase
      .from("talk_rooms")
      .select("conversation_prompts")
      .eq("id", roomId)
      .maybeSingle();

    return { success: true, data: (data?.conversation_prompts as string[]) || [] };
  } catch (err) {
    console.error("[getRoomPrompts]", err);
    return { success: false, error: "取得に失敗しました" };
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
      .maybeSingle();

    const currentPrompts = (room?.conversation_prompts as string[]) || [];
    // API depletion protection / runaway prevention:
    // Only replenish if strictly needed, and apply a 20% random check to throttle burst messages
    if (currentPrompts.length >= 2 || Math.random() > 0.2) return;

    const { GoogleGenerativeAI, SchemaType } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: "あなたは食物アレルギーを持つ子供の親のコミュニティのファシリテーターです。"
    });

    const prompt = `以下のトークルームに新しい「問いかけ」を2つ追加生成してください。
ルーム名: ${roomName}
ルーム説明: ${roomDesc}

既存の問いかけ（重複しないように）:
${currentPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

ルール:
- 既存と重複しない、斬新な切り口の問いかけにする
- 保護者が体験を共有したくなるカジュアルなトーンにする
- 各質問は40文字以内、医療的な判断は避ける`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING,
            description: "生成された新しい質問"
          }
        },
        temperature: 0.8,
      }
    });
    let newPrompts: string[] = [];
    try {
      newPrompts = JSON.parse(result.response.text());
    } catch (e) {
      console.error("AI JSON Parse Error:", e);
    }

    if (newPrompts && Array.isArray(newPrompts) && newPrompts.length > 0) {
      const merged = [...currentPrompts, ...newPrompts.slice(0, 2)];
      await supabase.from("talk_rooms").update({ conversation_prompts: merged }).eq("id", roomId);
    }
  } catch (err) {
    console.error("[replenishRoomPrompts]", err);
  }
}

export async function postMessage(roomId: string, content: string): Promise<ActionResponse> {
  try {
    const validRoom = CommonSchemas.UUID.safeParse(roomId);
    if (!validRoom.success) return { success: false, error: "不正なルーム指定です" };
    
    const validContent = CommonSchemas.ChatMessage.safeParse(content);
    if (!validContent.success) return { success: false, error: validContent.error.issues[0]?.message || "不正なメッセージです" };

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

    const { data: room } = await supabase.from("talk_rooms").select("name, description").eq("id", validRoom.data).maybeSingle();
    if (room) {
      replenishRoomPrompts(roomId, room.name, room.description || "").catch((err) => console.error("[Background Error] replenishRoomPrompts", err));
    }

    import("@/lib/ai/threshold-extractor")
      .then(({ checkExtractionThresholds }) => checkExtractionThresholds())
      .catch((err) => console.error("[Background Error] checkExtractionThresholds", err));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[postMessage]", err);
    return { success: false, error: "投稿に失敗しました" };
  }
}

export async function sendThanks(messageId: string): Promise<ActionResponse> {
  try {
    const validMessage = CommonSchemas.UUID.safeParse(messageId);
    if (!validMessage.success) return { success: false, error: "無効なメッセージです" };
    
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { data: msg } = await supabase.from("messages").select("user_id, room_id").eq("id", validMessage.data).maybeSingle();
    if (!msg) return { success: false, error: "メッセージが見つかりません" };
    if (msg.user_id === user.id) return { success: false, error: "自分の投稿には「ありがとう」できません" };

    const { error } = await supabase.from("message_thanks").insert({
      message_id: messageId,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") return { success: false, error: "すでに感謝しています" };
      throw error;
    }

    try {
      if (msg.room_id) {
        const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        await supabase.from("messages").update({ expires_at: newExpiry }).eq("room_id", msg.room_id);
      }
    } catch (err) {
      console.error("[sendThanks] Expiry extension failed", err);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[sendThanks]", err);
    return { success: false, error: "操作に失敗しました" };
  }
}

export async function deleteMessage(messageId: string): Promise<ActionResponse> {
  try {
    const validMessage = CommonSchemas.UUID.safeParse(messageId);
    if (!validMessage.success) return { success: false, error: "無効なメッセージです" };

    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", user.id);
    if (error) throw error;
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[deleteMessage]", err);
    return { success: false, error: "削除に失敗しました" };
  }
}

export async function removeThanks(messageId: string): Promise<ActionResponse> {
  try {
    const validMessage = CommonSchemas.UUID.safeParse(messageId);
    if (!validMessage.success) return { success: false, error: "無効なメッセージです" };

    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase.from("message_thanks").delete().eq("message_id", messageId).eq("user_id", user.id);
    if (error) throw error;
    
    revalidatePath("/", "layout");
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

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }) // Fetch newest first
      .limit(100);

    if (error) throw error;
    
    // Reverse to display chronologically (oldest at top, newest at bottom)
    const recentData = (data || []).reverse();

    let thankedIds: string[] = [];
    if (user && recentData.length > 0) {
      const msgIds = recentData.map(m => m.id);
      const { data: thanksData } = await supabase
        .from("message_thanks")
        .select("message_id")
        .eq("user_id", user.id)
        .in("message_id", msgIds);
        
      if (thanksData) thankedIds = thanksData.map(t => t.message_id);
    }

    const enhancedData = recentData.map(msg => ({
      ...msg,
      has_thanked: thankedIds.includes(msg.id)
    }));

    return { success: true, data: enhancedData };
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
      .maybeSingle();

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
    if (!supabase) return { success: false, error: "無効なDB接続" };

    const { data: room } = await supabase.from("talk_rooms").select("slug").eq("id", roomId).maybeSingle();
    if (!room || !room.slug) return { success: false, error: "対象のルームが見つかりません" };

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
    if (!supabase) return { success: false, error: "DB接続エラー" };

    const { data: room } = await supabase.from("talk_rooms").select("slug").eq("id", roomId).maybeSingle();
    if (!room || !room.slug) return { success: false, error: "ルームが見つかりません" };

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


