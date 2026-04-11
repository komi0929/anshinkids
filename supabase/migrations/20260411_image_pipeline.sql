-- 1. Create Supabase Storage Bucket for Chat Images
insert into storage.buckets (id, name, public, avif_autodetection)
values ('chat_images', 'chat_images', true, false)
on conflict (id) do nothing;

-- Set up basic access policies for the public bucket
create policy "Public Access to Chat Images" on storage.objects
  for select using (bucket_id = 'chat_images');

create policy "Authenticated Users can Upload Images" on storage.objects
  for insert with check (
    bucket_id = 'chat_images' 
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own images" on storage.objects
  for delete using (
    bucket_id = 'chat_images'
    and auth.uid() = owner
  );


-- 2. Modify `messages` table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Modify `wiki_entries` table to support Masonry Gallery arrays
ALTER TABLE wiki_entries
ADD COLUMN IF NOT EXISTS image_gallery text[] DEFAULT '{}'::text[];

-- 4. Set size limits (approximate validation via policy if possible, optional)
