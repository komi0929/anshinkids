-- ========================================
-- Migration: contribution_days テーブル追加
-- messages は 24h で期限切れ、48h で物理削除されるため、
-- ストリーク計算用に「投稿した日付」だけを永続保存する。
-- ========================================

CREATE TABLE IF NOT EXISTS contribution_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  active_date DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Tokyo'),
  post_count INTEGER DEFAULT 1,
  UNIQUE(user_id, active_date)
);

ALTER TABLE contribution_days ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users can view their own contribution days" ON contribution_days
  FOR SELECT USING (auth.uid() = user_id);

-- service_role（バッチ処理・トリガー）は全操作可能
CREATE POLICY "Service role can manage contribution days" ON contribution_days
  FOR ALL USING (auth.role() = 'service_role');

-- メッセージ投稿時に自動的にcontribution_daysを更新するトリガー
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

-- 既存のトリガーがあれば削除してから再作成
DROP TRIGGER IF EXISTS on_message_record_day ON messages;
CREATE TRIGGER on_message_record_day AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION record_contribution_day();

-- ========================================
-- 既存データのバックフィル（既に投稿がある場合）
-- 現在有効なメッセージから contribution_days を生成
-- ========================================
INSERT INTO contribution_days (user_id, active_date, post_count)
SELECT 
  user_id, 
  (created_at AT TIME ZONE 'Asia/Tokyo')::date as active_date,
  COUNT(*) as post_count
FROM messages 
WHERE user_id IS NOT NULL AND is_system_bot = false
GROUP BY user_id, (created_at AT TIME ZONE 'Asia/Tokyo')::date
ON CONFLICT (user_id, active_date) DO NOTHING;
