-- Phase 8: Add Mega-Wiki fields to wiki_entries
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS theme_slug TEXT;
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS is_mega_wiki BOOLEAN DEFAULT false;
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]';
