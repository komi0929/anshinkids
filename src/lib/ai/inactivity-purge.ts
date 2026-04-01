import { createAdminClient } from "@/lib/supabase/admin";
import { runBatchExtraction } from "@/lib/ai/batch-processor";

/**
 * Phase 3: Inactivity Purge
 * 72時間経過（expires_at到達）したメッセージを強制的にMega-Wikiに吸収し、期限切れの古いデータをパージするシステム。
 */
export async function purgeInactiveThreads() {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. 強制吸収が必要な（未抽出かつ期限切れ）メッセージがあれば、先に通常バッチを回す
  const { data: pending } = await supabase
    .from("messages")
    .select("id")
    .lt("expires_at", now)
    .eq("ai_extracted", false)
    .limit(1);

  if (pending && pending.length > 0) {
    console.log("[InactivityPurge] 未抽出の期限切れメッセージを検出。強制バッチを実行します。");
    await runBatchExtraction();
  }

  // 2. 期限切れで抽出済みのメッセージを完全に削除（DBからパージ）
  const { error, count } = await supabase
    .from("messages")
    .delete({ count: "exact" })
    .lt("expires_at", now)
    .eq("ai_extracted", true);

  if (error) {
    console.error("[InactivityPurge] パージ失敗:", error);
    throw error;
  }

  console.log(`[InactivityPurge] Purged ${count || 0} expired messages.`);
  return { purged: count || 0 };
}
