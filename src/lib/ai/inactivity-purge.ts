import { createAdminClient } from "@/lib/supabase/admin";
import { runBatchExtraction } from "@/lib/ai/batch-processor";

/**
 * Phase 3+: Inactivity Purge (Living Knowledge Model)
 * 
 * ルール:
 * 1. 期限切れ + 未抽出のメッセージ → 先に強制バッチ抽出
 * 2. 期限切れ + 抽出済みのメッセージ → DBから完全削除
 * 3. トピック自体は**絶対に削除しない**（タイトル・記事リンクが残る）
 * 4. メッセージが0件になったトピックは is_active=false にする（再投稿で復活可能）
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

  // 3. メッセージが0件のトピックを非活性化（トピック自体は削除しない）
  const { data: allTopics } = await supabase
    .from("talk_topics")
    .select("id, linked_wiki_entry_id")
    .eq("is_active", true);

  if (allTopics) {
    for (const topic of allTopics) {
      const { count: msgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("topic_id", topic.id);

      if (msgCount === 0 && !topic.linked_wiki_entry_id) {
        await supabase
          .from("talk_topics")
          .update({ is_active: false })
          .eq("id", topic.id);
      }
    }
  }

  console.log(`[InactivityPurge] Purged ${count || 0} expired messages. Topics preserved.`);
  return { purged: count || 0 };
}
