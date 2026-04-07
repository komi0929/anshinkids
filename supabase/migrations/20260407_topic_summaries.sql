-- 2層構造アーキテクチャ: トピック単位AIサマリーテーブル
CREATE TABLE IF NOT EXISTS topic_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid UNIQUE REFERENCES talk_topics(id) ON DELETE CASCADE,
  summary_snippet text,             -- 2行要約（一覧用スニペット）
  full_summary jsonb,               -- 構造化されたフルAI記事
  allergen_tags text[] DEFAULT '{}',
  source_count integer DEFAULT 0,
  last_generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE topic_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read topic summaries" ON topic_summaries FOR SELECT USING (true);
CREATE POLICY "Service role can manage topic summaries" ON topic_summaries FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_topic_summaries_topic_id ON topic_summaries(topic_id);
