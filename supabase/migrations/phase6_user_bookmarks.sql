-- ========================================
-- USER BOOKMARKS (Micro-Bookmarking)
-- ========================================
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wiki_entry_id UUID REFERENCES wiki_entries(id) ON DELETE CASCADE NOT NULL,
  snippet_title TEXT NOT NULL,
  snippet_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, wiki_entry_id, snippet_title)
);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bookmarks" ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookmarks" ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);
