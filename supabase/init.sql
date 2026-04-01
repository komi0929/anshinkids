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

-- Seed default rooms — 実体験を聞きたい軸（負荷試験は1テーマに統一）
INSERT INTO talk_rooms (slug, name, description, icon_emoji, sort_order, conversation_prompts) VALUES
  ('daily-food', '毎日のごはん', '献立・代替食材・お弁当のリアルな工夫', '🍚', 1,
   '["今週つくった代替レシピで一番よかったものは？", "お弁当のおかず、マンネリ化しない工夫を教えてください！", "代替食材で意外と美味しかったものは何ですか？"]'::jsonb),
  ('products', '使ってよかった市販品', 'おやつ・パン・調味料のクチコミ', '🛒', 2,
   '["最近見つけたアレルギー対応おやつ、おすすめは？", "スーパーやコンビニで買えるアレルゲンフリー商品を教えて！", "子どもが喜んだ市販品はどれでしたか？"]'::jsonb),
  ('eating-out', '外食・おでかけ', 'チェーン店・旅行・イベントの対応', '🍽️', 3,
   '["アレルギー対応メニューがあるチェーン店を教えてください！", "外食時、お店にどうやってアレルギーを伝えていますか？", "旅行先での外食、どう乗り切りましたか？"]'::jsonb),
  ('school-life', '園・学校との連携', '給食・面談・行事の乗り切り方', '🏫', 4,
   '["給食対応、どんな風にお願いしましたか？", "入園前にアレルギーについてどう説明しましたか？", "行事（遠足・お泊り会等）の対応で工夫したことは？"]'::jsonb),
  ('challenge', '負荷試験の体験談', '準備・当日の流れ・結果後の変化', '🧪', 5,
   '["負荷試験を受ける前、どんな準備をしましたか？不安だったことは？", "負荷試験当日の流れを教えてください！待ち時間の過ごし方は？", "負荷試験の結果を受けて、日常生活で変わったことはありますか？"]'::jsonb),
  ('skin-body', '肌とからだのケア', 'アトピー・保湿・スキンケアの工夫', '🧴', 6,
   '["お子さんの保湿剤、何を使っていますか？", "お風呂上がりのスキンケアルーティンを教えてください！", "季節の変わり目の肌荒れ対策、何かしていますか？"]'::jsonb),
  ('family', '気持ち・家族・まわり', '不安・理解・パートナーや祖父母との関わり', '👨‍👩‍👧', 7,
   '["パートナーや祖父母にアレルギーの深刻さをどう伝えましたか？", "アレルギー育児で疲れた時、どうリフレッシュしていますか？", "周囲に理解されなくて辛かった経験、どう乗り越えましたか？"]'::jsonb),
  ('milestone', '食べられた！の記録', '克服・成長のうれしい報告', '🌱', 8,
   '["お子さんが初めて食べられた時のエピソードを教えてください！", "アレルギーが改善してきた兆しを感じた瞬間は？", "克服までの道のり、振り返って一番大変だったことは？"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_emoji = EXCLUDED.icon_emoji,
  sort_order = EXCLUDED.sort_order,
  conversation_prompts = EXCLUDED.conversation_prompts;

-- Remove all old theme rooms that are no longer in the new structure
DELETE FROM talk_rooms WHERE slug IN ('egg-challenge', 'milk-challenge', 'wheat-challenge', 'snacks', 'nursery', 'recipes', 'skincare', 'hospital', 'mental', 'shopping', 'medical', 'concern') AND slug NOT IN ('daily-food', 'products', 'eating-out', 'school-life', 'challenge', 'skin-body', 'family', 'milestone');

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
  source_type TEXT DEFAULT 'talk',
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

-- ========================================
-- CONTRIBUTION DAYS (ストリーク計算用の永続ログ)
-- messages は24h後に期限切れ、48hで物理削除されるため、
-- 「どの日にどのユーザーが投稿したか」だけを永続保存する
-- ========================================
CREATE TABLE IF NOT EXISTS contribution_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  active_date DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Tokyo'),
  post_count INTEGER DEFAULT 1,
  UNIQUE(user_id, active_date)
);

ALTER TABLE contribution_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own contribution days" ON contribution_days
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage contribution days" ON contribution_days
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger: メッセージ投稿時にcontribution_daysを自動更新
CREATE OR REPLACE FUNCTION record_contribution_day()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.is_system_bot = false THEN
    INSERT INTO contribution_days (user_id, active_date, post_count)
    VALUES (NEW.user_id, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo')::date, 1)
    ON CONFLICT (user_id, active_date) 
    DO UPDATE SET post_count = contribution_days.post_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_record_day AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION record_contribution_day();
