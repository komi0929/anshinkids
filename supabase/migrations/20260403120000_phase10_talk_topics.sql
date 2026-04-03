-- Phase 10: Talk Topics Architecture Migration
CREATE TABLE IF NOT EXISTS talk_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES talk_rooms(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  message_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add topic_id to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES talk_topics(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id);
CREATE INDEX IF NOT EXISTS idx_talk_topics_room_id ON talk_topics(room_id);

-- RLS for talk_topics
ALTER TABLE talk_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active talk topics" ON talk_topics FOR SELECT USING (true);
CREATE POLICY "Users can create talk topics" ON talk_topics FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own topics" ON talk_topics FOR UPDATE USING (auth.uid() = creator_id);
