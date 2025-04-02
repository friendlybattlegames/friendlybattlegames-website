-- Drop existing objects if they exist
DROP TABLE IF EXISTS public.images CASCADE;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create images table
CREATE TABLE public.images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, filename)
);

-- Enable RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for images table
CREATE POLICY "Users can view their own images"
    ON public.images FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images"
    ON public.images FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
    ON public.images FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
    ON public.images FOR DELETE
    USING (auth.uid() = user_id);

-- Create storage policies
CREATE POLICY "Anyone can view images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own images"
    ON storage.objects FOR UPDATE
    WITH CHECK (
        bucket_id = 'images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Grant permissions
GRANT ALL ON public.images TO authenticated;
GRANT ALL ON public.images TO service_role;
