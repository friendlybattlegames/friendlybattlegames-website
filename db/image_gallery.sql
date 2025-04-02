-- Drop everything first
DROP TABLE IF EXISTS image_gallery CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Set up RLS for blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create blog_posts policies
CREATE POLICY "Published posts are viewable by everyone"
    ON blog_posts FOR SELECT
    USING ( published = true );

CREATE POLICY "Authors can view all their own posts"
    ON blog_posts FOR SELECT
    USING ( author_id = auth.uid() );

CREATE POLICY "Authors can create posts"
    ON blog_posts FOR INSERT
    WITH CHECK ( author_id = auth.uid() );

CREATE POLICY "Authors can update their own posts"
    ON blog_posts FOR UPDATE
    USING ( author_id = auth.uid() );

CREATE POLICY "Authors can delete their own posts"
    ON blog_posts FOR DELETE
    USING ( author_id = auth.uid() );

-- Create image_gallery table
CREATE TABLE IF NOT EXISTS image_gallery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    image_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on image_gallery
ALTER TABLE image_gallery ENABLE ROW LEVEL SECURITY;

-- Create policies for image_gallery
CREATE POLICY "Users can view their own images"
    ON image_gallery FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own images"
    ON image_gallery FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own images"
    ON image_gallery FOR UPDATE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own images"
    ON image_gallery FOR DELETE
    USING ( auth.uid() = user_id );

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Images are publicly accessible"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'images' );

CREATE POLICY "Users can upload images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'images'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'images'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'images'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Create function to handle automatic updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_image_gallery_updated_at
    BEFORE UPDATE ON image_gallery
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT SELECT ON profiles TO anon;

GRANT ALL ON image_gallery TO authenticated;
GRANT ALL ON image_gallery TO service_role;
GRANT SELECT ON image_gallery TO anon;

GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON blog_posts TO service_role;
GRANT SELECT ON blog_posts TO anon;

-- Reset schema cache
NOTIFY pgrst, 'reload schema';