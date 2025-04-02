-- Update leaderboard table to use game_name instead of game_id
ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_game_id_fkey;
ALTER TABLE leaderboard DROP COLUMN IF EXISTS game_id;
ALTER TABLE leaderboard DROP COLUMN IF EXISTS game_name;

-- Add required columns
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4() PRIMARY KEY;
ALTER TABLE leaderboard ADD COLUMN game_name text NOT NULL;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL REFERENCES auth.users(id);
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS score integer NOT NULL;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS played_at timestamptz NOT NULL DEFAULT now();

-- Create an index on game_name for better query performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_name ON leaderboard(game_name);

-- Add foreign key constraint to games table
ALTER TABLE leaderboard ADD CONSTRAINT fk_leaderboard_game_name 
    FOREIGN KEY (game_name) REFERENCES games(game_name) ON DELETE CASCADE;

-- Create index for user_id for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- Create composite index for game_name and score for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score ON leaderboard(game_name, score DESC);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view leaderboard entries
CREATE POLICY "View leaderboard entries" ON leaderboard
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Allow authenticated users to insert their own scores
CREATE POLICY "Insert own scores" ON leaderboard
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own scores
CREATE POLICY "Update own scores" ON leaderboard
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own scores
CREATE POLICY "Delete own scores" ON leaderboard
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create a view that joins leaderboard with profiles
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
