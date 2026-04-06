const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { createClient } = require("@supabase/supabase-js");

async function verify() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("Fetching logs...");
  const { data: logs, error } = await sb
    .from("batch_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);
  
  if (error) console.error("Could not fetch logs:", error);
  else console.dir(logs, {depth: null});
}

verify();
