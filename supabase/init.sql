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
  line_user_id TEXT,
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
-- Allow service role to insert profiles for LINE auth
CREATE POLICY "Service role can manage profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

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
  conversation_prompts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE talk_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Talk rooms are viewable by everyone" ON talk_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert rooms" ON talk_rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Seed default rooms (balanced categories)
INSERT INTO talk_rooms (slug, name, description, icon_emoji, sort_order, conversation_prompts) VALUES
  ('challenge', '負荷試験', '卵・乳・小麦などの負荷試験の体験談、進め方、病院情報', '🧪', 1,
   '["負荷試験を受ける前、どんな準備をしましたか？不安だったことは？", "負荷試験当日の流れを教えてください！待ち時間の過ごし方は？", "負荷試験の結果を受けて、日常生活で変わったことはありますか？"]'::jsonb),
  ('snacks', '市販品おやつ', 'アレルギー対応の市販おやつ情報交換', '🍪', 2,
   '["最近見つけたアレルギー対応おやつ、おすすめは何ですか？", "スーパーやコンビニで買えるアレルゲンフリーのおやつを教えてください！", "子どもが喜んだアレルギー対応のおやつはどれでしたか？"]'::jsonb),
  ('eating-out', '外食・チェーン店', '外食時のアレルギー対応、チェーン店情報', '🍽️', 3,
   '["アレルギー対応メニューがあるチェーン店を教えてください！", "外食する時、お店にどうやってアレルギーを伝えていますか？", "旅行先での外食、どう乗り切りましたか？"]'::jsonb),
  ('nursery', '保育園・幼稚園', '給食対応、先生とのコミュニケーション', '🏫', 4,
   '["保育園の給食対応、どんな風にお願いしましたか？", "入園前にアレルギーについてどう説明しましたか？", "お弁当持参の場合、時短レシピはありますか？"]'::jsonb),
  ('recipes', '代替レシピ', 'アレルゲンフリーの代替レシピ共有', '👩‍🍳', 5,
   '["卵なしで美味しくできたお菓子レシピを教えてください！", "乳製品の代替品で一番使いやすかったものは？", "誕生日ケーキ、どうやって作りましたか？"]'::jsonb),
  ('skincare', 'スキンケア', 'アトピー・湿疹のケア、保湿剤情報', '🧴', 6,
   '["お子さんの保湿剤、何を使っていますか？", "お風呂上がりのスキンケアルーティンを教えてください！", "季節の変わり目の肌荒れ対策、何かしていますか？"]'::jsonb),
  ('hospital', '病院・主治医', '病院選び、主治医との相談、セカンドオピニオン', '🏥', 7,
   '["アレルギー専門医を見つけたきっかけは何でしたか？", "セカンドオピニオンを受けたことはありますか？どうでしたか？", "定期検診の頻度はどのくらいですか？"]'::jsonb),
  ('mental', 'メンタルケア', '親の心のケア、周囲の理解、孤独感の共有', '💚', 8,
   '["周りにアレルギーを理解してもらえなくて辛かった経験、ありますか？", "アレルギー育児で疲れた時、どうリフレッシュしていますか？", "同じ悩みを持つママ友とどうやって出会いましたか？"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_emoji = EXCLUDED.icon_emoji,
  sort_order = EXCLUDED.sort_order,
  conversation_prompts = EXCLUDED.conversation_prompts;

-- Remove old individual challenge rooms if they exist
DELETE FROM talk_rooms WHERE slug IN ('egg-challenge', 'milk-challenge', 'wheat-challenge') AND slug != 'challenge';

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
CREATE POLICY "Messages viewable by everyone" ON messages
  FOR SELECT USING (expires_at > now());
CREATE POLICY "Authenticated users can insert messages" ON messages
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
CREATE POLICY "Thanks are viewable by everyone" ON message_thanks
  FOR SELECT USING (true);
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

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

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
