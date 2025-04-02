-- Drop existing tables
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;

-- Create blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES auth.users NOT NULL,
    category_id UUID REFERENCES blog_categories(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create post tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_created ON blog_posts(created_at);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- Blog posts policies
CREATE POLICY "Published posts are viewable by everyone"
    ON blog_posts FOR SELECT
    USING (published = true);

CREATE POLICY "Authors can view all their own posts"
    ON blog_posts FOR SELECT
    USING (author_id = auth.uid());

CREATE POLICY "Authors can create posts"
    ON blog_posts FOR INSERT
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own posts"
    ON blog_posts FOR UPDATE
    USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their own posts"
    ON blog_posts FOR DELETE
    USING (author_id = auth.uid());

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
    ON blog_categories FOR SELECT
    USING (true);

CREATE POLICY "Only authenticated users can create categories"
    ON blog_categories FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update categories"
    ON blog_categories FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete categories"
    ON blog_categories FOR DELETE
    USING (auth.role() = 'authenticated');

-- Tags policies
CREATE POLICY "Tags are viewable by everyone"
    ON blog_tags FOR SELECT
    USING (true);

CREATE POLICY "Only authenticated users can create tags"
    ON blog_tags FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update tags"
    ON blog_tags FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete tags"
    ON blog_tags FOR DELETE
    USING (auth.role() = 'authenticated');

-- Post tags policies
CREATE POLICY "Post tags are viewable by everyone"
    ON post_tags FOR SELECT
    USING (true);

CREATE POLICY "Authors can manage post tags"
    ON post_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE id = post_tags.post_id
            AND author_id = auth.uid()
        )
    );

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                title,
                '[^a-zA-Z0-9\s-]',
                ''
            ),
            '\s+',
            '-'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate slug before insert
CREATE OR REPLACE FUNCTION handle_blog_post_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug from title if not provided
    IF NEW.slug IS NULL THEN
        NEW.slug := generate_slug(NEW.title);
    END IF;
    
    -- Generate excerpt from content if not provided
    IF NEW.excerpt IS NULL THEN
        NEW.excerpt := substring(NEW.content from 1 for 150) || '...';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_post_before_insert
    BEFORE INSERT ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION handle_blog_post_insert();

-- Trigger to update timestamps
CREATE TRIGGER handle_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_blog_tags_updated_at
    BEFORE UPDATE ON blog_tags
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Grant permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON blog_categories TO authenticated;
GRANT ALL ON blog_tags TO authenticated;
GRANT ALL ON post_tags TO authenticated;

GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON blog_categories TO anon;
GRANT SELECT ON blog_tags TO anon;
GRANT SELECT ON post_tags TO anon;

-- Insert default categories
INSERT INTO blog_categories (name, slug, description)
VALUES 
    ('News', 'news', 'Latest updates and announcements'),
    ('Tutorials', 'tutorials', 'Game guides and how-tos'),
    ('Events', 'events', 'Tournaments and community events'),
    ('Development', 'development', 'Game development updates')
ON CONFLICT (slug) DO NOTHING;

-- Insert common tags
INSERT INTO blog_tags (name, slug)
VALUES 
    ('Gaming', 'gaming'),
    ('Update', 'update'),
    ('Community', 'community'),
    ('Tutorial', 'tutorial'),
    ('Event', 'event'),
    ('Tournament', 'tournament')
ON CONFLICT (slug) DO NOTHING;
