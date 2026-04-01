-- Phase 8 (part 2): Add children_profiles and interests to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS children_profiles JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
