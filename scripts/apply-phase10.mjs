/**
 * Phase 10: Apply talk_topics migration directly to production Supabase
 * Run: node scripts/apply-phase10.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const statements = [
  // Drop any broken empty table from the bad migration
  `DROP TABLE IF EXISTS talk_topics CASCADE`,

  // Create proper table
  `CREATE TABLE IF NOT EXISTS talk_topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid REFERENCES talk_rooms(id) ON DELETE CASCADE,
    creator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    title text NOT NULL,
    last_message_preview text,
    message_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`,

  // Add topic_id to messages
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES talk_topics(id) ON DELETE CASCADE`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id)`,
  `CREATE INDEX IF NOT EXISTS idx_talk_topics_room_id ON talk_topics(room_id)`,

  // RLS
  `ALTER TABLE talk_topics ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Public can read active talk topics" ON talk_topics`,
  `CREATE POLICY "Public can read active talk topics" ON talk_topics FOR SELECT USING (true)`,
  `DROP POLICY IF EXISTS "Authenticated users can create talk topics" ON talk_topics`,
  `CREATE POLICY "Authenticated users can create talk topics" ON talk_topics FOR INSERT WITH CHECK (auth.uid() = creator_id)`,
  `DROP POLICY IF EXISTS "Authenticated users can update talk topics" ON talk_topics`,
  `CREATE POLICY "Authenticated users can update talk topics" ON talk_topics FOR UPDATE USING (auth.uid() IS NOT NULL)`,
  `DROP POLICY IF EXISTS "Users can create talk topics" ON talk_topics`,
  `DROP POLICY IF EXISTS "Users can update their own topics" ON talk_topics`,
];

async function run() {
  console.log('Applying Phase 10 migration to production...');
  for (const sql of statements) {
    const label = sql.slice(0, 60).replace(/\n/g, ' ');
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).maybeSingle();
    if (error) {
      // Try direct fetch as fallback
      const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ sql_text: sql }),
      });
      if (!res.ok) {
        console.warn(`  WARN: ${label}... -> ${error.message || 'RPC unavailable'}`);
      } else {
        console.log(`  OK: ${label}...`);
      }
    } else {
      console.log(`  OK: ${label}...`);
    }
  }
  console.log('Done. Please verify in Supabase Dashboard.');
}

run().catch(console.error);
