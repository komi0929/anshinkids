import { createClient } from "@supabase/supabase-js";
import { runBatchExtraction } from "../src/lib/ai/batch-processor";
import { updateTalkRoomThemes, seedMegaWikis } from "../src/app/actions/seed";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseRoleKey);

async function run() {
  console.log("Seeding dummy data for: 毎日のごはん (daily-food)...");

  // 1. Get room
  let { data: room } = await supabase.from("talk_rooms").select("id").eq("slug", "daily-food").single();
  if (!room) {
    console.log("Room not found, running seed action...");
    await updateTalkRoomThemes();
    await seedMegaWikis();
    const res = await supabase.from("talk_rooms").select("id").eq("slug", "daily-food").single();
    room = res.data;
  }

  if (!room) throw new Error("Room still not found after seed.");


  // 2. Wipe old data
  console.log("Cleaning up old dummy data...");
  await supabase.from("messages").delete().eq("room_id", room.id);
  await supabase.from("talk_topics").delete().eq("room_id", room.id);
  
  // Wipe sections of the mega wiki entry
  await supabase.from("wiki_entries").update({ sections: [], source_count: 0 }).eq("slug", "mega-daily-food");

  // 3. Insert dummy topic
  const { data: topic, error: topicErr } = await supabase.from("talk_topics").insert({
    room_id: room.id,
    title: "卵不使用の市販おやつ・おかず情報交換！",
    last_message_preview: "最近見つけた卵不使用のものありますか？",
    message_count: 5,
    is_active: true
  }).select().single();

  if (topicErr) throw topicErr;
  console.log(`Created topic: ${topic.title} (ID: ${topic.id})`);

  // 4. Insert dummy messages
  const oldDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  const expireDate = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days later
  
  const messages = [
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "幼稚園のお弁当が始まるのですが、卵アレルギーがあるのでウインナーとかかまぼこも気を使います。卵不使用でリピートしている市販のおかずや、おすすめのおやつがあれば教えてください！",
      ai_extracted: false,
      role: "user",
      created_at: oldDate,
      expires_at: expireDate
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "ニッポンハムの『みんなの食卓』シリーズは卵・乳など不使用で専用工場で作られているので一番安心です！ウインナーもミートボールもお弁当に大活躍していますよ。",
      ai_extracted: false,
      role: "user",
      trust_score: 5,
      created_at: oldDate,
      expires_at: expireDate
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "おやつなら、シャトレーゼの乳と卵と小麦粉を使用していないケーキやアイスがあります！ストックしておくと、他の子がケーキを食べている時にも同じように出せるので助かってます🙌",
      ai_extracted: false,
      role: "user",
      trust_score: 8,
      created_at: oldDate,
      expires_at: expireDate
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "市販のミートボールは『イシイのおべんとクン ミートボール』も卵・乳不使用です！（ソースに卵不使用）。どこでも買えるのでめちゃくちゃ助かりますよね！",
      ai_extracted: false,
      role: "user",
      trust_score: 3,
      created_at: oldDate,
      expires_at: expireDate
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "アンパンマンのカレーとかアンパンマンポテトも卵不使用なので、お弁当の隙間埋めに重宝してます。ただ、ポテトは製造ラインで卵使用製品を作ってたりするので裏面のコンタミ表示は毎回チェックするようにしています。",
      ai_extracted: false,
      role: "user",
      trust_score: 10,
      created_at: oldDate,
      expires_at: expireDate
    }
  ];

  const { error: msgErr } = await supabase.from("messages").insert(messages);
  if (msgErr) throw msgErr;

  console.log("Inserted 5 dummy messages.");

  // For testing purposes, maybe we also create another topic?
  // Let's create one more topic for daily-food
  const { data: topic2, error: topicErr2 } = await supabase.from("talk_topics").insert({
    room_id: room.id,
    title: "米粉パン、どこのがモチモチでおすすめ？",
    last_message_preview: "スーパーで買えるものでおすすめ知りたいです！",
    message_count: 3,
    is_active: true
  }).select().single();

  if (topicErr2) throw topicErr2;

  const messages2 = [
    {
      room_id: room.id,
      topic_id: topic2.id,
      content: "朝食用のパンで、小麦不使用（できれば乳卵も不使用）でモチモチしているものってありますか？いくつか試したんですがパサパサしていて子供が食べてくれません😭スーパーで買えるものがあれば嬉しいです！",
      ai_extracted: false,
      role: "user",
      created_at: oldDate,
      expires_at: expireDate
    },
    {
      room_id: room.id,
      topic_id: topic2.id,
      content: "スーパーで買えるなら『マイセン』の玄米パンや米粉パンがおいしいです！少しトーストするとカリッとして中はモチモチになりますよー✨",
      ai_extracted: false,
      role: "user",
      trust_score: 6,
      created_at: oldDate,
      expires_at: expireDate
    },
    {
      room_id: room.id,
      topic_id: topic2.id,
      content: "うちはイオンのトップバリュ『やさしごはん』シリーズのお米パンを買ってます🍞特定原材料7品目不使用で、レンジで少し温めるとすごくフワフワになって美味しいです！",
      ai_extracted: false,
      role: "user",
      trust_score: 9,
      created_at: oldDate,
      expires_at: expireDate
    }
  ];
  
  await supabase.from("messages").insert(messages2);
  console.log("Inserted 3 dummy messages for second topic.");

  console.log("Running AI Batch Extraction now (simulating background job)...");
  
  // 5. Force run batch
  const result = await runBatchExtraction();
  console.log("Extraction Result:", JSON.stringify(result, null, 2));

  console.log("Done! You can now check the UI.");
}

run().catch(console.error);
