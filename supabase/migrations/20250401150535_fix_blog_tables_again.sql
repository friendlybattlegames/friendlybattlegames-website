-- Drop existing tables and views
DROP VIEW IF EXISTS blog_posts_with_authors;
DROP TABLE IF EXISTS blog_posts;

-- Create blog_posts table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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

-- Create the blog posts view
CREATE OR REPLACE VIEW blog_posts_with_authors AS
SELECT 
    p.id,
    p.title,
    p.content,
    p.created_at,
    p.updated_at,
    p.author_id,
    u.username as author_name,
    u.avatar_url as author_avatar
FROM blog_posts p
LEFT JOIN profiles u ON p.author_id = u.id;

-- Insert a default profile if none exists
INSERT INTO profiles (id, username, avatar_url, created_at)
SELECT 
    auth.uid(),
    'Admin',
    'https://api.dicebear.com/7.x/avatars/svg?seed=Admin',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- Insert sample posts
INSERT INTO blog_posts (title, content, author_id, created_at)
SELECT
    'Welcome to FriendlyBattleGames!',
    E'We''re excited to launch our new gaming platform where friends can compete in classic arcade games!\n\nOur current lineup includes:\n- Space Shooter: Defend Earth from alien invaders\n- Snake Game: Grow your snake and avoid collisions\n- Memory Game: Test your memory skills\n\nStay tuned for more games and features coming soon!',
    id,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM profiles
LIMIT 1;

INSERT INTO blog_posts (title, content, author_id, created_at)
SELECT
    'How to Master Space Shooter',
    E'Want to climb the Space Shooter leaderboard? Here are some pro tips:\n\n1. Stay mobile - never stop moving\n2. Learn enemy patterns\n3. Save your power-ups for boss battles\n4. Practice dodging before focusing on shooting\n\nKeep practicing and you''ll be at the top of the leaderboard in no time!',
    id,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM profiles
LIMIT 1;

INSERT INTO blog_posts (title, content, author_id, created_at)
SELECT
    'Upcoming Features and Events',
    E'We''re working hard to make FriendlyBattleGames even better! Here''s what''s coming:\n\n- New multiplayer games\n- Monthly tournaments with prizes\n- Custom profile badges\n- Friend challenges\n\nWhich feature are you most excited about? Let us know in the comments!',
    id,
    CURRENT_TIMESTAMP
FROM profiles
LIMIT 1;
