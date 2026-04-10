ALTER TABLE user_bookmarks 
ALTER COLUMN wiki_entry_id DROP NOT NULL;

ALTER TABLE user_bookmarks 
ADD COLUMN IF NOT EXISTS topic_summary_id UUID REFERENCES topic_summaries(id) ON DELETE CASCADE;

-- Drop existing unique constraint that relied on wiki_entry_id being not null
ALTER TABLE user_bookmarks DROP CONSTRAINT IF EXISTS user_bookmarks_user_id_wiki_entry_id_snippet_title_key;
