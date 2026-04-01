-- Phase 5: Compound Impact (複利的資産化エコシステム)

-- 1. Add tracking columns
ALTER TABLE profiles ADD COLUMN total_helpful_votes INTEGER DEFAULT 0;
ALTER TABLE wiki_entries ADD COLUMN helpful_count INTEGER DEFAULT 0;

-- 2. Create votes table
CREATE TABLE IF NOT EXISTS wiki_helpful_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wiki_entry_id UUID REFERENCES wiki_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wiki_entry_id, user_id)
);

ALTER TABLE wiki_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Helpful votes are viewable by everyone" ON wiki_helpful_votes
  FOR SELECT USING (true);
CREATE POLICY "Users can insert helpful votes" ON wiki_helpful_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create compound impact distribution trigger
CREATE OR REPLACE FUNCTION process_wiki_helpful_vote()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. 記事自体のhelpful_countをインクリメント
  UPDATE wiki_entries SET helpful_count = helpful_count + 1 WHERE id = NEW.wiki_entry_id;
  
  -- 2. その記事のソースを提供した全貢献者のプロフィールへ恩恵を複利分配
  UPDATE profiles 
  SET total_helpful_votes = total_helpful_votes + 1
  WHERE id IN (
    SELECT DISTINCT contributor_id 
    FROM wiki_sources 
    WHERE wiki_entry_id = NEW.wiki_entry_id 
    AND contributor_id IS NOT NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_wiki_helpful_vote AFTER INSERT ON wiki_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION process_wiki_helpful_vote();
