-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE IF EXISTS leaderboard ENABLE ROW LEVEL SECURITY;

-- Create the games table to track available games
CREATE TABLE IF NOT EXISTS games (
    game_id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    min_score INTEGER DEFAULT 0,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id VARCHAR REFERENCES games(game_id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS leaderboard_game_id_score_idx ON leaderboard(game_id, score DESC);
CREATE INDEX IF NOT EXISTS leaderboard_user_id_idx ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS leaderboard_played_at_idx ON leaderboard(played_at DESC);

-- Insert initial game data with played_at timestamp
INSERT INTO games (game_id, title, description, min_score, played_at) VALUES
('space-shooter', 'Space Shooter', 'Classic space shooting game', 100, NOW()),
('snake', 'Snake Game', 'Classic snake eating game', 50, NOW()),
('tetris', 'Tetris', 'Classic block stacking game', 1000, NOW()),
('pong', 'Pong', 'Classic paddle ball game', 50, NOW()),
('breakout', 'Breakout', 'Classic brick breaking game', 100, NOW())
ON CONFLICT (game_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    min_score = EXCLUDED.min_score,
    played_at = NOW();

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all scores" 
    ON leaderboard FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can insert their own scores" 
    ON leaderboard FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Create function to update user's profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'Player ' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create view for leaderboard with user info
CREATE OR REPLACE VIEW leaderboard_with_users AS
SELECT 
    l.id,
    l.game_id,
    l.score,
    l.played_at,
    g.title as game_title,
    p.username,
    p.avatar_url
FROM leaderboard l
JOIN games g ON l.game_id = g.game_id
JOIN profiles p ON l.user_id = p.id
ORDER BY l.score DESC;

-- Grant necessary permissions
GRANT SELECT ON games TO authenticated;
GRANT SELECT, INSERT ON leaderboard TO authenticated;
GRANT SELECT ON leaderboard_with_users TO authenticated;
GRANT SELECT ON profiles TO authenticated;
