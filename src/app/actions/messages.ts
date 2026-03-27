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
