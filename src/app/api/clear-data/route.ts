import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    console.log("Deleting all messages...");
    await supabase.from("messages").delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log("Deleting all talk topics...");
    await supabase.from("talk_topics").delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("Deleting all wiki entries...");
    await supabase.from("wiki_entries").delete().neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({ success: true, message: "Cleared successfully" });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
}
