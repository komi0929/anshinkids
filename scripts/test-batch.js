const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { createAdminClient } = require("./src/lib/supabase/admin");

async function testExtraction() {
  const supabase = createAdminClient();

  // 1. Get room
  const { data: room } = await supabase.from("talk_rooms").select("id").eq("slug", "daily-food").single();

  // 2. Ensure mega wiki exists so batch processor doesn't skip it
  await supabase.from("wiki_entries").upsert({
    slug: "mega-daily-food",
    category: "毎日のごはん",
    title: "【総合整理】毎日のごはん",
    theme_slug: "daily-food",
    is_mega_wiki: true,
    is_public: true,
    sections: [],
    source_count: 0
  }, { onConflict: "slug" });

  // 3. Create topic
  const { data: topic } = await supabase.from("talk_topics").insert({
    room_id: room.id,
    title: "TEST TOPIC",
    last_message_preview: "test",
    message_count: 1,
    is_active: true
  }).select().single();

  // 4. Create UNEXTRACTED message
  await supabase.from("messages").insert({
    room_id: room.id,
    topic_id: topic.id,
    content: "これはテストメッセージです。卵不使用のパンケーキミックスについて教えてください。〇〇メーカーのものが良かったです！",
    ai_extracted: false,
    expires_at: new Date(Date.now() + 86400000).toISOString()
  });

  // 5. Force unlock batch
  await supabase.from("batch_logs").update({ status: "error" }).eq("status", "running");

  console.log("Triggering batch extraction...");

  // Actually run batch extraction
  // Using dynamic import because it's a TS module
}

testExtraction().catch(console.error);
