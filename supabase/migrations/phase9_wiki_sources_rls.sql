-- Migration: Restrict wiki_sources to contributors only to prevent PII leakage
DROP POLICY IF EXISTS "Wiki sources viewable by authenticated" ON wiki_sources;

CREATE POLICY "Wiki sources viewable by contributor" ON wiki_sources
  FOR SELECT USING (auth.uid() = contributor_id);
