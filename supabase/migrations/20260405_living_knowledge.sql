-- Living Knowledge: トピック↔記事アイテムの双方向リンク
-- talk_topicsにリンクカラムを追加（存在しなければ）
ALTER TABLE talk_topics ADD COLUMN IF NOT EXISTS linked_wiki_entry_id UUID REFERENCES wiki_entries(id) ON DELETE SET NULL;
ALTER TABLE talk_topics ADD COLUMN IF NOT EXISTS linked_wiki_item_title TEXT;

-- インデックス追加（記事からリンクされたトピックを高速検索）
CREATE INDEX IF NOT EXISTS idx_talk_topics_wiki_link ON talk_topics(linked_wiki_entry_id) WHERE linked_wiki_entry_id IS NOT NULL;
