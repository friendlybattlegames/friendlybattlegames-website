-- Drop the view if it exists
DROP VIEW IF EXISTS blog_posts_with_authors;

-- Create the view with author information
CREATE OR REPLACE VIEW blog_posts_with_authors 
WITH (security_invoker = on) AS
SELECT 
    p.id,
    p.title,
    p.content,
    p.created_at,
    p.updated_at,
    p.author_id,
    a.username AS author_name,
    a.avatar_url AS author_avatar
FROM blog_posts p
LEFT JOIN profiles a ON p.author_id = a.id;
