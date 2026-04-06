import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load env vars manually
const envVars = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  if (line && line.includes("=")) {
    const [key, ...rest] = line.split("=");
    acc[key.trim()] = rest.join("=").trim();
  }
  return acc;
}, {} as Record<string, string>);

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .limit(5);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", JSON.stringify(data, null, 2));
  }
}

main();
