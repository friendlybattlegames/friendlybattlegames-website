-- Create avatar_gallery table to store metadata
CREATE TABLE avatar_gallery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE avatar_gallery ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own avatars
CREATE POLICY "Users can view their own avatars"
ON avatar_gallery
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own avatars
CREATE POLICY "Users can add their own avatars"
ON avatar_gallery
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON avatar_gallery
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name)
VALUES ('avatar_gallery', 'avatar_gallery')
ON CONFLICT DO NOTHING;

-- Set up storage policy for avatar uploads
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatar_gallery');

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatar_gallery' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatar_gallery' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
