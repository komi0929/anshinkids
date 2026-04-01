ALTER TABLE profiles ADD COLUMN IF NOT EXISTS children_profiles JSONB DEFAULT '[]'::jsonb;
