const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function clear() {
  console.log("Deleting messages...");
  await supabase.from("messages").delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Deleting topics...");
  await supabase.from("talk_topics").delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Deleting wiki entries...");
  await supabase.from("wiki_entries").delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Done.");
}

clear();
