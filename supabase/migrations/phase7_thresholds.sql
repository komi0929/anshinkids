-- Phase 7: Add extraction_threshold to talk_rooms
ALTER TABLE talk_rooms ADD COLUMN IF NOT EXISTS extraction_threshold INTEGER DEFAULT 50;
