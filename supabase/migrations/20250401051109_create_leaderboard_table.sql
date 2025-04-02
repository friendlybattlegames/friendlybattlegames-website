-- Drop existing table and policies
DROP TABLE IF EXISTS leaderboard CASCADE;

-- Create the leaderboard table
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public leaderboard is viewable by everyone" ON leaderboard;
DROP POLICY IF EXISTS "Users can insert their own scores" ON leaderboard;

-- Create policies
CREATE POLICY "Public leaderboard is viewable by everyone" ON leaderboard
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" ON leaderboard
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create view that joins leaderboard with profiles
CREATE OR REPLACE VIEW leaderboard_with_profiles AS
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
