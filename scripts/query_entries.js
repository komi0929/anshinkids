const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { createClient } = require("@supabase/supabase-js");

async function verify() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("Fetching wiki_entries...");
  const { data: entries, error } = await sb
    .from("wiki_entries")
    .select("slug, title, is_mega_wiki");
  
  if (error) console.error("Could not fetch entries:", error);
  else console.dir(entries, {depth: null});
  
  console.log("Fetching messages...");
  const { count } = await sb.from("messages").select("*", { count: "exact", head: true });
  console.log("Total messages:", count);
}

verify();
