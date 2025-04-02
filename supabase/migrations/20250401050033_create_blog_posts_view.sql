-- Drop the view if it exists
DROP VIEW IF EXISTS blog_posts_with_authors;

-- Create a view that joins blog_posts with profiles
CREATE VIEW blog_posts_with_authors AS
SELECT 
    bp.*,
    p.username as author_username,
    p.avatar_url as author_avatar_url
FROM blog_posts bp
LEFT JOIN profiles p ON bp.author_id = p.id;

-- Grant access to the view
ALTER VIEW blog_posts_with_authors OWNER TO postgres;
GRANT SELECT ON blog_posts_with_authors TO anon;
GRANT SELECT ON blog_posts_with_authors TO authenticated;
