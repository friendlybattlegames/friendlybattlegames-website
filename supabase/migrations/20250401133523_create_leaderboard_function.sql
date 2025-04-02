-- Create a function to create the leaderboard view
CREATE OR REPLACE FUNCTION create_leaderboard_view_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Drop the view if it exists
    DROP VIEW IF EXISTS leaderboard_with_profiles;
    
    -- Create the view
    CREATE VIEW leaderboard_with_profiles AS
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
END;
$$;
