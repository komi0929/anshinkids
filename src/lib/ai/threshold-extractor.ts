import { createAdminClient } from "@/lib/supabase/admin";
import { runBatchExtraction } from "@/lib/ai/batch-processor";

/**
 * Phase 3: Threshold Extractor
 * 各トークルームの未抽出投稿数が extraction_threshold（閾値: デフォルト50）を超過した場合に即時抽出を発動させる。
 */
export async function checkExtractionThresholds() {
  const supabase = createAdminClient();

  // 1. トークルームの閾値を取得
  const { data: rooms, error: roomsErr } = await supabase
    .from("talk_rooms")
    .select("id, slug, extraction_threshold");

  if (roomsErr || !rooms) {
    console.error("[ThresholdExtractor] Failed to fetch rooms", roomsErr);
    return { extracted: false, message: "Missing rooms" };
  }

  let shouldRunExtraction = false;
  const triggerRooms: string[] = [];

  // 2. ルームごとに未抽出メッセージの見積もり（カウント）をチェック
  for (const room of rooms) {
    const threshold = room.extraction_threshold || 50;
    
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("ai_extracted", false)
      .eq("is_system_bot", false);

    if (count !== null && count >= threshold) {
      shouldRunExtraction = true;
      triggerRooms.push(room.slug);
    }
  }

  // 3. 閾値超過があれば抽出パイプラインを起動
  if (shouldRunExtraction) {
    console.log(`[ThresholdExtractor] Threshold reached in rooms: ${triggerRooms.join(', ')}. Triggering extraction.`);
    const result = await runBatchExtraction();
    return { extracted: true, triggerRooms, result };
  }

  return { extracted: false, message: "No rooms reached threshold." };
}
