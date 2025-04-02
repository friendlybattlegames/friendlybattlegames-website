-- Drop the view if it exists
DROP VIEW IF EXISTS leaderboard_with_profiles;

-- Create the view with profile information
CREATE OR REPLACE VIEW leaderboard_with_profiles AS
SELECT 
    l.id,
    l.game_name,
    l.user_id,
    l.score,
    l.played_at,
    p.username,
    p.avatar_url
FROM leaderboard l
LEFT JOIN profiles p ON l.user_id = p.id;

-- Enable RLS on the view
ALTER VIEW leaderboard_with_profiles SET (security_invoker = on);

-- Create policy to allow public read access to the view
CREATE POLICY "Allow public read access to leaderboard_with_profiles"
    ON leaderboard_with_profiles
    FOR SELECT
    TO public
    USING (true);
