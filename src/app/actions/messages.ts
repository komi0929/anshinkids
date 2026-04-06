"use server";

import { createClient, createStaticClient } from "@/lib/supabase/server";
import { THEMES, THEME_BY_SLUG } from "@/lib/themes";
import { ActionResponse, CommonSchemas } from "@/types/actions";
import { revalidatePath, unstable_cache } from "next/cache";

// ─── Topic CRUD ───────────────────────────────────────────

export const getTalkRooms = unstable_cache(
  async () => {
    try {
      const supabase = createStaticClient();
      if (!supabase) return { success: true, data: [] };

      const { data, error } = await supabase
        .from("talk_rooms")
        .select(`
          id,
          slug,
          name,
          description,
          icon_emoji,
          sort_order
        `)
        .order("sort_order", { ascending: true });
        
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error("[getTalkRooms]", err);
      return { success: true, data: [] };
    }
  },
  ["talk-rooms-list"],
  { revalidate: 3600, tags: ["talk-rooms"] } // Cache for 1 hour or until invalidated
);

export async function getTalkTopics(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    // Removed mock logic that was overriding talk rooms
    const { data, error } = await supabase
      .from("talk_topics")
      .select(`
        *,
        profiles!talk_topics_creator_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq("room_id", roomId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    
    const enhancedData = data?.map(t => {
      const prof = t.profiles as unknown as { display_name?: string, avatar_url?: string };
      return {
        ...t,
        creator_name: prof?.display_name || "参加者",
        creator_avatar: prof?.avatar_url || null,
        profiles: undefined
      };
    }) || [];
    
    return { success: true, data: enhancedData };
  } catch (err) {
    console.error("[getTalkTopics]", err);
    return { success: true, data: [] };
  }
}

export async function getTalkTopicById(topicId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: null };

    // Removed mock logic
    const { data, error } = await supabase
      .from("talk_topics")
      .select("*")
      .eq("id", topicId)
      .maybeSingle();
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("[getTalkTopicById]", err);
    return { success: false, data: null };
  }
}

export async function createTopic(
  roomId: string,
  title: string
): Promise<ActionResponse & { topicId?: string }> {
  try {
    // Validation
    const validRoom = CommonSchemas.UUID.safeParse(roomId);
    if (!validRoom.success) return { success: false, error: "不正なルーム指定です" };
    if (!title || title.trim().length < 2)
      return { success: false, error: "話題は2文字以上で入力してください" };
    if (title.trim().length > 100)
      return { success: false, error: "話題は100文字以内で入力してください" };

    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { data, error } = await supabase
      .from("talk_topics")
      .insert({ room_id: roomId, title: title.trim(), creator_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true, topicId: data.id };
  } catch (err) {
    console.error("[createTopic]", err);
    return { success: false, error: "トピック作成に失敗しました" };
  }
}

// ─── Topic Messages ───────────────────────────────────────

export async function getTopicMessages(topicId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        profiles!messages_user_id_fkey (
          display_name,
          avatar_url,
          trust_score,
          allergen_tags
        )
      `)
      .eq("topic_id", topicId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const recentData = (data || []).reverse();
    let thankedIds: string[] = [];
    if (user && recentData.length > 0) {
      const msgIds = recentData.map((m) => m.id);
      const { data: thanksData } = await supabase
        .from("message_thanks")
        .select("message_id")
        .eq("user_id", user.id)
        .in("message_id", msgIds);
      if (thanksData) thankedIds = thanksData.map((t) => t.message_id);
    }
    const enhancedData = recentData.map((msg) => {
      const prof = msg.profiles as unknown as { display_name?: string, avatar_url?: string, trust_score?: number, allergen_tags?: string[] };
      return {
        ...msg,
        has_thanked: thankedIds.includes(msg.id),
        author_name: prof?.display_name || "参加者",
        author_avatar: prof?.avatar_url || null,
        author_trust: prof?.trust_score || 0,
        author_allergens: prof?.allergen_tags || [],
        profiles: undefined
      };
    });
    return { success: true, data: enhancedData };
  } catch (err) {
    console.error("[getTopicMessages]", err);
    return { success: true, data: [] };
  }
}

export async function postTopicMessage(
  topicId: string,
  roomId: string,
  content: string
): Promise<ActionResponse> {
  try {
    // Validation
    const validRoom = CommonSchemas.UUID.safeParse(roomId);
    if (!validRoom.success) return { success: false, error: "不正なルーム指定です" };
    const validTopic = CommonSchemas.UUID.safeParse(topicId);
    if (!validTopic.success)
      return { success: false, error: "不正なトピック指定です" };
    const validContent = CommonSchemas.ChatMessage.safeParse(content);
    if (!validContent.success)
      return {
        success: false,
        error: validContent.error.issues[0]?.message || "不正なメッセージです",
      };

    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    // Insert message
    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      topic_id: topicId,
      user_id: user.id,
      content: content.trim(),
    });
    if (error) throw error;

    // Extend life of all messages in this topic (chain extension rule)
    const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("messages")
      .update({ expires_at: newExpiry })
      .eq("topic_id", topicId);

    // Update topic metadata: updated_at, message_count, last_message_preview
    const preview = content.trim().slice(0, 80);

    // Count messages in this topic
    const { count: msgCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId);

    await supabase
      .from("talk_topics")
      .update({
        updated_at: new Date().toISOString(),
        message_count: msgCount ?? 0,
        last_message_preview: preview,
      })
      .eq("id", topicId);

    // Trigger AI extraction threshold check (Talk→Wiki pipeline)
    import("@/lib/ai/threshold-extractor")
      .then(({ checkExtractionThresholds }) => checkExtractionThresholds())
      .catch((err) =>
        console.error("[Background Error] checkExtractionThresholds", err)
      );

    // Replenish AI conversation prompts
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("name, description")
      .eq("id", validRoom.data)
      .maybeSingle();
    if (room) {
      replenishRoomPrompts(roomId, room.name, room.description || "").catch(
        (err) =>
          console.error("[Background Error] replenishRoomPrompts", err)
      );
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[postTopicMessage]", err);
    return { success: false, error: "投稿に失敗しました" };
  }
}

// ─── AI Prompt Replenishment ─────────────────────────────

export async function getRoomPrompts(
  roomId: string
): Promise<ActionResponse<string[]>> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    const { data } = await supabase
      .from("talk_rooms")
      .select("conversation_prompts")
      .eq("id", roomId)
      .maybeSingle();

    return {
      success: true,
      data: (data?.conversation_prompts as string[]) || [],
    };
  } catch (err) {
    console.error("[getRoomPrompts]", err);
    return { success: false, error: "取得に失敗しました" };
  }
}

async function replenishRoomPrompts(
  roomId: string,
  roomName: string,
  roomDesc: string
) {
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
    // Throttle: only replenish if strictly needed
    if (currentPrompts.length >= 2 || Math.random() > 0.2) return;

    const { GoogleGenerativeAI, SchemaType } = await import(
      "@google/generative-ai"
    );
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction:
        "あなたは食物アレルギーを持つ子供の親のコミュニティのファシリテーターです。",
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
            description: "生成された新しい質問",
          },
        },
        temperature: 0.8,
      },
    });
    let newPrompts: string[] = [];
    try {
      newPrompts = JSON.parse(result.response.text());
    } catch {
      // Parse failed, skip
    }

    if (newPrompts && Array.isArray(newPrompts) && newPrompts.length > 0) {
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

// ─── Message Actions ──────────────────────────────────────

export async function deleteMessage(
  messageId: string
): Promise<ActionResponse> {
  try {
    const validMessage = CommonSchemas.UUID.safeParse(messageId);
    if (!validMessage.success)
      return { success: false, error: "無効なメッセージです" };
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[deleteMessage]", err);
    return { success: false, error: "削除に失敗しました" };
  }
}

export async function sendThanks(
  messageId: string
): Promise<ActionResponse> {
  try {
    const validMessage = CommonSchemas.UUID.safeParse(messageId);
    if (!validMessage.success)
      return { success: false, error: "無効なメッセージです" };
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };
    const { data: msg } = await supabase
      .from("messages")
      .select("user_id, topic_id")
      .eq("id", validMessage.data)
      .maybeSingle();
    if (!msg) return { success: false, error: "メッセージが見つかりません" };
    if (msg.user_id === user.id)
      return { success: false, error: "自分の投稿には「ありがとう」できません" };

    const { error } = await supabase.from("message_thanks").insert({
      message_id: messageId,
      user_id: user.id,
    });
    if (error) {
      if (error.code === "23505")
        return { success: false, error: "すでに感謝しています" };
      throw error;
    }

    if (msg.topic_id) {
      const newExpiry = new Date(
        Date.now() + 72 * 60 * 60 * 1000
      ).toISOString();
      await supabase
        .from("messages")
        .update({ expires_at: newExpiry })
        .eq("topic_id", msg.topic_id);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[sendThanks]", err);
    return { success: false, error: "操作に失敗しました" };
  }
}

export async function removeThanks(
  messageId: string
): Promise<ActionResponse> {
  try {
    const validMessage = CommonSchemas.UUID.safeParse(messageId);
    if (!validMessage.success)
      return { success: false, error: "無効なメッセージです" };
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };
    const { error } = await supabase
      .from("message_thanks")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[removeThanks]", err);
    return { success: false, error: "操作に失敗しました" };
  }
}

// ─── Legacy Room-level fetch (kept for backward compatibility) ──

export async function getActiveMessages(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const recentData = (data || []).reverse();
    let thankedIds: string[] = [];
    if (user && recentData.length > 0) {
      const msgIds = recentData.map((m) => m.id);
      const { data: thanksData } = await supabase
        .from("message_thanks")
        .select("message_id")
        .eq("user_id", user.id)
        .in("message_id", msgIds);
      if (thanksData) thankedIds = thanksData.map((t) => t.message_id);
    }
    const enhancedData = recentData.map((msg) => ({
      ...msg,
      has_thanked: thankedIds.includes(msg.id),
    }));
    return { success: true, data: enhancedData };
  } catch (err) {
    console.error("[getActiveMessages]", err);
    return { success: true, data: [] };
  }
}

// ─── Talk Room CRUD ────────────────────────────────────────

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
      return { success: true, data: { ...theme, id: "temp-id" } };
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
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("slug")
      .eq("id", roomId)
      .maybeSingle();
    if (!room || !room.slug)
      return { success: false, error: "対象のルームが見つかりません" };
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
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("slug")
      .eq("id", roomId)
      .maybeSingle();
    if (!room || !room.slug)
      return { success: false, error: "ルームが見つかりません" };
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
