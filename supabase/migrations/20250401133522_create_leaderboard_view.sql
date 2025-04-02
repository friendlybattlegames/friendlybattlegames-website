-- Create a view that combines leaderboard entries with user profiles
CREATE OR REPLACE VIEW leaderboard_with_profiles AS
SELECT 
    l.id,
    l.user_id,
    l.game_name,
    l.score,
    l.played_at,
    p.username,
    p.avatar_url
FROM game_scores l
LEFT JOIN profiles p ON l.user_id = p.id
ORDER BY l.score DESC;
