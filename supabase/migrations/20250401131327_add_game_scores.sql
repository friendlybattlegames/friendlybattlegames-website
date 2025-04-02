-- Ensure games table exists and has our test games
CREATE TABLE IF NOT EXISTS games (
    game_name TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view games
DROP POLICY IF EXISTS "Games are viewable by everyone" ON games;
CREATE POLICY "Games are viewable by everyone" ON games
    FOR SELECT USING (true);

-- Insert or update test games
INSERT INTO games (game_name, title, description) VALUES
    ('snake', 'Snake Game', 'Classic snake game where you eat food to grow longer'),
    ('tetris', 'Tetris', 'Classic block stacking puzzle game'),
    ('pong', 'Pong', 'Classic table tennis arcade game')
ON CONFLICT (game_name) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- Ensure leaderboard table exists with correct structure
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_name TEXT NOT NULL REFERENCES games(game_name) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on leaderboard
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view leaderboard
DROP POLICY IF EXISTS "View leaderboard entries" ON leaderboard;
CREATE POLICY "View leaderboard entries" ON leaderboard
    FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_name ON leaderboard(game_name);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score ON leaderboard(game_name, score DESC);

-- Create or replace the leaderboard view
DROP VIEW IF EXISTS leaderboard_with_profiles;
CREATE VIEW leaderboard_with_profiles AS
SELECT 
    l.id,
    l.game_name,
    l.score,
    l.played_at,
    l.user_id,
    p.username,
    p.avatar_url
FROM leaderboard l
LEFT JOIN profiles p ON l.user_id = p.id;

-- Insert test scores for multiple users
DO $$
DECLARE
    test_user_id UUID;
    game record;
BEGIN
    -- Get the current user's ID
    test_user_id := auth.uid();
    
    -- If we have a user ID, add scores for each game
    IF test_user_id IS NOT NULL THEN
        -- Delete existing scores for this user
        DELETE FROM leaderboard WHERE user_id = test_user_id;
        
        -- Add new scores for each game
        FOR game IN SELECT * FROM games
        LOOP
            -- Add 5 scores per game
            FOR i IN 1..5 LOOP
                INSERT INTO leaderboard (game_name, user_id, score, played_at)
                VALUES (
                    game.game_name,
                    test_user_id,
                    floor(random() * 1000)::integer,
                    NOW() - (i || ' hours')::interval
                );
            END LOOP;
        END LOOP;
    END IF;
END;
$$;
