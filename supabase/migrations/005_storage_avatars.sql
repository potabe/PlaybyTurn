-- ============================================================
-- Migration: 005_storage_avatars
-- Description: Create storage bucket for avatars and RLS policies
-- ============================================================

-- Create 'avatars' bucket if it doesn't exist (using a clean insert approach)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view avatars (Publicly accessible)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy 2: Authenticated users can upload avatars (Insert)
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Policy 3: Users can update their own avatars
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (regexp_match(name, '^([^.]+)\.'))[1]
);

-- Policy 4: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (regexp_match(name, '^([^.]+)\.'))[1]
);
