import { createClient } from "@supabase/supabase-js";
import { runBatchExtraction } from "../src/lib/ai/batch-processor";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseRoleKey);

async function run() {
  console.log("Seeding dummy data for: 毎日のごはん (daily-meals)...");

  // 1. Get room
  const { data: room } = await supabase.from("talk_rooms").select("id").eq("slug", "daily-meals").single();
  if (!room) throw new Error("Room not found");

  // 2. Insert dummy topic
  const { data: topic, error: topicErr } = await supabase.from("talk_topics").insert({
    room_id: room.id,
    title: "卵不使用の市販おやつ・おかず情報交換！",
    last_message_preview: "最近見つけた卵不使用のものありますか？",
    message_count: 5,
    is_active: true
  }).select().single();

  if (topicErr) throw topicErr;
  console.log(`Created topic: ${topic.title} (ID: ${topic.id})`);

  // 3. Insert dummy messages
  const dummyAuthUserId = "11111111-1111-1111-1111-111111111111"; // Make sure we have a pseudo user or just null
  
  const messages = [
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "幼稚園のお弁当が始まるのですが、卵アレルギーがあるのでウインナーとかかまぼこも気を使います。卵不使用でリピートしている市販のおかずや、おすすめのおやつがあれば教えてください！",
      ai_extracted: false,
      role: "user"
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "ニッポンハムの『みんなの食卓』シリーズは卵・乳など不使用で専用工場で作られているので一番安心です！ウインナーもミートボールもお弁当に大活躍していますよ。",
      ai_extracted: false,
      role: "user",
      trust_score: 5
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "おやつなら、シャトレーゼの乳と卵と小麦粉を使用していないケーキやアイスがあります！ストックしておくと、他の子がケーキを食べている時にも同じように出せるので助かってます🙌",
      ai_extracted: false,
      role: "user",
      trust_score: 8
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "市販のミートボールは『イシイのおべんとクン ミートボール』も卵・乳不使用です！（ソースに卵不使用）。どこでも買えるのでめちゃくちゃ助かりますよね！",
      ai_extracted: false,
      role: "user",
      trust_score: 3
    },
    {
      room_id: room.id,
      topic_id: topic.id,
      content: "アンパンマンのカレーとかアンパンマンポテトも卵不使用なので、お弁当の隙間埋めに重宝してます。ただ、ポテトは製造ラインで卵使用製品を作ってたりするので裏面のコンタミ表示は毎回チェックするようにしています。",
      ai_extracted: false,
      role: "user",
      trust_score: 10
    }
  ];

  const { error: msgErr } = await supabase.from("messages").insert(messages);
  if (msgErr) throw msgErr;

  console.log("Inserted 5 dummy messages.");

  console.log("Running AI Batch Extraction now (simulating background job)...");
  
  // 4. Force run batch
  const result = await runBatchExtraction();
  console.log("Extraction Result:", result);

  console.log("Done! You can now check the UI.");
}

run().catch(console.error);
