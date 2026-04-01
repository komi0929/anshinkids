-- Phase 3: Architecture Pivot Migration
-- 1. wiki_entries に sections JSONB 列とテーマslug列を追加
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb;
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS theme_slug text;
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS is_mega_wiki boolean DEFAULT false;

-- 2. messages の expires_at デフォルトを72時間に変更
ALTER TABLE messages ALTER COLUMN expires_at SET DEFAULT (now() + interval '72 hours');

-- 3. talk_rooms に閾値・最終抽出列・親テーマ列を追加
ALTER TABLE talk_rooms ADD COLUMN IF NOT EXISTS extraction_threshold integer DEFAULT 5;
ALTER TABLE talk_rooms ADD COLUMN IF NOT EXISTS last_extraction_at timestamptz;
ALTER TABLE talk_rooms ADD COLUMN IF NOT EXISTS parent_theme text;
-- parent_theme: 8テーマslugのいずれか。NULLなら、そのroom自体がテーマ定義。

-- 4. インデックス
CREATE INDEX IF NOT EXISTS idx_wiki_entries_theme_slug ON wiki_entries(theme_slug);
CREATE INDEX IF NOT EXISTS idx_wiki_entries_is_mega_wiki ON wiki_entries(is_mega_wiki);
CREATE INDEX IF NOT EXISTS idx_talk_rooms_parent_theme ON talk_rooms(parent_theme);
