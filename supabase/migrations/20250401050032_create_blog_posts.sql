-- Drop existing blog_posts table and related objects
DROP TABLE IF EXISTS blog_posts CASCADE;

-- Create blog_posts table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX blog_posts_author_id_idx ON blog_posts(author_id);
CREATE INDEX blog_posts_created_at_idx ON blog_posts(created_at);
CREATE INDEX blog_posts_slug_idx ON blog_posts(slug);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public blog posts are viewable by everyone" 
    ON blog_posts FOR SELECT 
    USING (published = true);

CREATE POLICY "Users can create their own blog posts" 
    ON blog_posts FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own blog posts" 
    ON blog_posts FOR UPDATE 
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own blog posts" 
    ON blog_posts FOR DELETE 
    USING (auth.uid() = author_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();
