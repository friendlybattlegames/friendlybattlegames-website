-- Drop existing games table if it exists
DROP TABLE IF EXISTS games CASCADE;

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    game_name text PRIMARY KEY,
    title text NOT NULL,
    description text,
    min_score integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert initial game data
INSERT INTO games (game_name, title, description, min_score) VALUES
    ('space-shooter', 'Space Shooter', 'Classic space shooting game', 100),
    ('snake', 'Snake', 'Classic snake game', 10),
    ('memory', 'Memory', 'Memory matching game', 50)
ON CONFLICT (game_name) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    min_score = EXCLUDED.min_score,
    updated_at = now();

-- Create RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view game data
CREATE POLICY "View game data" ON games
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only allow service_role to modify game data
CREATE POLICY "Modify game data" ON games
    FOR ALL
    TO service_role
    USING (true);
