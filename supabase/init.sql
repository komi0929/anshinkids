-- ========================================
-- あんしんキッズ (Anshin Kids) Database Schema
-- ========================================

-- ========================================
-- PROFILES (ユーザープロフィール)
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'あんしんユーザー',
  avatar_url TEXT,
  trust_score NUMERIC(5,2) DEFAULT 0.00,
  total_contributions INTEGER DEFAULT 0,
  total_thanks_received INTEGER DEFAULT 0,
  allergen_tags TEXT[] DEFAULT '{}',
  child_age_months INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- TALK ROOMS (細分化カテゴリールーム)
-- ========================================
CREATE TABLE IF NOT EXISTS talk_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT DEFAULT '💬',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE talk_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Talk rooms are viewable by everyone" ON talk_rooms FOR SELECT USING (true);

-- Seed default rooms
INSERT INTO talk_rooms (slug, name, description, icon_emoji, sort_order) VALUES
  ('egg-challenge', '卵負荷試験', '卵の負荷試験の体験談、進め方、病院情報など', '🥚', 1),
  ('milk-challenge', '乳負荷試験', '牛乳・乳製品の負荷試験について', '🥛', 2),
  ('wheat-challenge', '小麦負荷試験', '小麦の負荷試験、グルテンフリー生活について', '🌾', 3),
  ('snacks', '市販品おやつ', 'アレルギー対応の市販おやつ情報交換', '🍪', 4),
  ('eating-out', '外食・チェーン店', '外食時のアレルギー対応、チェーン店情報', '🍽️', 5),
  ('nursery', '保育園・幼稚園', '給食対応、先生とのコミュニケーション', '🏫', 6),
  ('recipes', '代替レシピ', 'アレルゲンフリーの代替レシピ共有', '👩‍🍳', 7),
  ('skincare', 'スキンケア', 'アトピー・湿疹のケア、保湿剤情報', '🧴', 8),
  ('hospital', '病院・主治医', '病院選び、主治医との相談、セカンドオピニオン', '🏥', 9),
  ('mental', 'メンタルケア', '親の心のケア、周囲の理解、孤独感の共有', '💚', 10)
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- MESSAGES (24h消滅トーク)
-- ========================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES talk_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_system_bot BOOLEAN DEFAULT false,
  thanks_count INTEGER DEFAULT 0,
  ai_extracted BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active messages are viewable by authenticated users" ON messages
  FOR SELECT USING (auth.role() = 'authenticated' AND expires_at > now());
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- MESSAGE THANKS (感謝のいいね)
-- ========================================
CREATE TABLE IF NOT EXISTS message_thanks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE message_thanks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Thanks are viewable by authenticated users" ON message_thanks
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert thanks" ON message_thanks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own thanks" ON message_thanks
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- WIKI ENTRIES (AI動的Wiki)
-- ========================================
CREATE TABLE IF NOT EXISTS wiki_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  allergen_tags TEXT[] DEFAULT '{}',
  source_count INTEGER DEFAULT 0,
  avg_trust_score NUMERIC(5,2) DEFAULT 0.00,
  is_public BOOLEAN DEFAULT false,
  last_updated_from_batch TIMESTAMPTZ,
  freshness_checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wiki_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public wiki entries are viewable by everyone" ON wiki_entries
  FOR SELECT USING (is_public = true);
CREATE POLICY "All wiki entries viewable by authenticated" ON wiki_entries
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- WIKI SOURCES (情報ソーストレーサビリティ)
-- ========================================
CREATE TABLE IF NOT EXISTS wiki_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wiki_entry_id UUID REFERENCES wiki_entries(id) ON DELETE CASCADE NOT NULL,
  original_message_snippet TEXT,
  contributor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contributor_trust_score NUMERIC(5,2) DEFAULT 0.00,
  extracted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wiki_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wiki sources viewable by authenticated" ON wiki_sources
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- CONCIERGE SESSIONS (AI相談)
-- ========================================
CREATE TABLE IF NOT EXISTS concierge_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  messages_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE concierge_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON concierge_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON concierge_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON concierge_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- BATCH LOGS (バッチ処理履歴)
-- ========================================
CREATE TABLE IF NOT EXISTS batch_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_type TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  messages_processed INTEGER DEFAULT 0,
  wiki_entries_created INTEGER DEFAULT 0,
  wiki_entries_updated INTEGER DEFAULT 0,
  error_log TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE batch_logs ENABLE ROW LEVEL SECURITY;
-- Batch logs are admin-only (service role)

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER wiki_entries_updated_at BEFORE UPDATE ON wiki_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER concierge_sessions_updated_at BEFORE UPDATE ON concierge_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment thanks_count on message_thanks insert
CREATE OR REPLACE FUNCTION increment_thanks_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE messages SET thanks_count = thanks_count + 1 WHERE id = NEW.message_id;
  UPDATE profiles SET total_thanks_received = total_thanks_received + 1
    WHERE id = (SELECT user_id FROM messages WHERE id = NEW.message_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_thanks_insert AFTER INSERT ON message_thanks
  FOR EACH ROW EXECUTE FUNCTION increment_thanks_count();

-- Auto-decrement thanks_count on message_thanks delete
CREATE OR REPLACE FUNCTION decrement_thanks_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE messages SET thanks_count = thanks_count - 1 WHERE id = OLD.message_id;
  UPDATE profiles SET total_thanks_received = total_thanks_received - 1
    WHERE id = (SELECT user_id FROM messages WHERE id = OLD.message_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_thanks_delete AFTER DELETE ON message_thanks
  FOR EACH ROW EXECUTE FUNCTION decrement_thanks_count();

-- Auto-increment contributions count on message insert
CREATE OR REPLACE FUNCTION increment_contributions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.is_system_bot = false THEN
    UPDATE profiles SET total_contributions = total_contributions + 1 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION increment_contributions();
