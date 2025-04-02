-- Create blog_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to blog_posts"
    ON blog_posts
    FOR SELECT
    TO public
    USING (true);

-- Create policy for authenticated users to create posts
CREATE POLICY "Allow authenticated users to create blog_posts"
    ON blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

-- Create policy for authors to update their own posts
CREATE POLICY "Allow authors to update their own blog_posts"
    ON blog_posts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Create policy for authors to delete their own posts
CREATE POLICY "Allow authors to delete their own blog_posts"
    ON blog_posts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- Create view for blog posts with author information
CREATE OR REPLACE VIEW blog_posts_with_authors AS
SELECT 
    p.id,
    p.title,
    p.content,
    p.created_at,
    p.updated_at,
    p.author_id,
    a.username as author_name,
    a.avatar_url as author_avatar
FROM blog_posts p
LEFT JOIN profiles a ON p.author_id = a.id;

-- Enable RLS on the view
ALTER VIEW blog_posts_with_authors SET (security_invoker = on);

-- Create policy for public read access to the view
CREATE POLICY "Allow public read access to blog_posts_with_authors"
    ON blog_posts_with_authors
    FOR SELECT
    TO public
    USING (true);
