import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { runBatchExtraction } from "../src/lib/ai/batch-processor";
import { createAdminClient } from "../src/lib/supabase/admin";

async function verify() {
  console.log("=== BUG VERIFICATION START ===");
  try {
    const supabase = createAdminClient();
    
    // Check batch logs first to see historical errors
    const { data: logs, error } = await supabase
      .from("batch_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
      
    if (error) console.error("Could not fetch logs:", error);
    else console.log("Recent Batch Logs:", JSON.stringify(logs, null, 2));

    console.log("Waiting 2s...");
    await new Promise(r => setTimeout(r, 2000));

    // Force clear any stuck mutex
    await supabase.from("batch_logs").update({ status: "error", error_log: "force-cleared from test" }).eq("status", "running");
    
    console.log("\n=== RUNNING BATCH EXTRACTION EXPLICITLY ===");
    const result = await runBatchExtraction();
    console.log("Extraction Result:", JSON.stringify(result, null, 2));
    
    console.log("=== VERIFICATION COMPLETE ===");
  } catch (err) {
    console.error("Uncaught Verification Error:", err);
  }
}

verify();
