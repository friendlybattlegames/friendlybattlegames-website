-- Create games table
CREATE TABLE IF NOT EXISTS games (
    game_name TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT
);

-- Insert initial games
INSERT INTO games (game_name, title, description) VALUES
    ('snake', 'Snake Game', 'Classic snake game where you eat food to grow longer'),
    ('tetris', 'Tetris', 'Classic block stacking puzzle game'),
    ('pong', 'Pong', 'Classic table tennis arcade game'),
    ('memory', 'Memory Game', 'Test your memory by matching pairs of cards'),
    ('space-shooter', 'Space Shooter', 'Defend Earth from alien invaders')
ON CONFLICT (game_name) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- Add RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to games"
    ON games FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to update games"
    ON games FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
