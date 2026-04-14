-- Migration: 20260415000000_message_reactions.sql
-- Description: Implement LINE-like inline reactions for messages

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint ensuring a user can only have one active reaction per message,
-- allowing UPSERT (replace) when they choose a different reaction on the same message.
CREATE UNIQUE INDEX IF NOT EXISTS message_reactions_message_user_idx ON public.message_reactions (message_id, user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all active reactions"
    ON public.message_reactions FOR SELECT
    USING (true);

CREATE POLICY "Enable users to insert their own reactions"
    ON public.message_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable users to update their own reactions"
    ON public.message_reactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable users to delete their own reactions"
    ON public.message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Enable Realtime for message_reactions so clients can listen to changes instantly
alter publication supabase_realtime add table public.message_reactions;
