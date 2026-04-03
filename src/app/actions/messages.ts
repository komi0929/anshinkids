"use server";

import { createClient } from "@/lib/supabase/server";
import { THEMES, THEME_BY_SLUG } from "@/lib/themes";
import { ActionResponse, CommonSchemas } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function getTalkTopics(roomId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };
    const { data, error } = await supabase.from('talk_topics').select('*').eq('room_id', roomId).eq('is_active', true).order('updated_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) { return { success: true, data: [] }; }
}

export async function getTalkTopicById(topicId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: null };
    const { data, error } = await supabase.from('talk_topics').select('*').eq('id', topicId).maybeSingle();
    if (error) throw error;
    return { success: true, data };
  } catch (err) { return { success: false, data: null }; }
}

export async function createTopic(roomId: string, title: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: 'DB未接続' };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'ログインが必要です' };
    const { data, error } = await supabase.from('talk_topics').insert({ room_id: roomId, title, creator_id: user.id }).select('id').single();
    if (error) throw error;
    return { success: true, topicId: data.id };
  } catch (err) { return { success: false, error: '作成失敗' }; }
}

export async function getTopicMessages(topicId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('messages').select('*').eq('topic_id', topicId).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const recentData = (data || []).reverse();
    let thankedIds: string[] = [];
    if (user && recentData.length > 0) {
      const msgIds = recentData.map(m => m.id);
      const { data: thanksData } = await supabase.from('message_thanks').select('message_id').eq('user_id', user.id).in('message_id', msgIds);
      if (thanksData) thankedIds = thanksData.map(t => t.message_id);
    }
    const enhancedData = recentData.map(msg => ({...msg, has_thanked: thankedIds.includes(msg.id)}));
    return { success: true, data: enhancedData };
  } catch (err) { return { success: true, data: [] }; }
}

export async function postTopicMessage(topicId: string, roomId: string, content: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: 'DB未接続' };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'ログインが必要です' };
    const { error } = await supabase.from('messages').insert({ room_id: roomId, topic_id: topicId, user_id: user.id, content: content.trim() });
    if (error) throw error;
    
    const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    await supabase.from("messages").update({ expires_at: newExpiry }).eq("topic_id", topicId);
    
    await supabase.from("talk_topics").update({ updated_at: new Date().toISOString() }).eq("id", topicId);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) { return { success: false, error: '投稿に失敗しました' }; }
}

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
    return { success: false, error: "削除に失敗しました" };
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
    const { data: msg } = await supabase.from("messages").select("user_id, topic_id").eq("id", validMessage.data).maybeSingle();
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

    if (msg.topic_id) {
       const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
       await supabase.from("messages").update({ expires_at: newExpiry }).eq("topic_id", msg.topic_id);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: "操作に失敗しました" };
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
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
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
       return { success: true, data: { ...theme, id: 'temp-id' } };
    }
    return { success: false, error: "ルームが見つかりません", data: null };
  } catch (err) {
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
    return { success: true, data: [] };
  }
}
