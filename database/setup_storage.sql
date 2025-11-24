-- ============================================================================
-- SETUP: Supabase Storage for Vehicle Photos
-- ============================================================================
-- This script creates the storage bucket and sets up policies for vehicle photos

-- 1. Create the bucket (run this in Supabase Dashboard -> Storage)
-- Note: You need to create the bucket manually in the Supabase Dashboard
-- Bucket name: vehicle-photos
-- Public: Yes (for easier access to photos)

-- 2. Set up RLS policies for the bucket
-- Run these in SQL Editor:

-- Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'vehicle-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read photos from their company
CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'vehicle-photos');

-- Allow authenticated users to delete their own photos
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'vehicle-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- MANUAL STEPS IN SUPABASE DASHBOARD:
-- ============================================================================
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name: vehicle-photos
-- 4. Public: Yes
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/*
-- 7. Click "Create Bucket"
-- 8. Then run the SQL policies above in the SQL Editor
-- ============================================================================
