-- Create games table if it doesn't exist
CREATE TABLE IF NOT EXISTS games (
    game_name TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view games
CREATE POLICY "Games are viewable by everyone" ON games
    FOR SELECT USING (true);

-- Insert test games
INSERT INTO games (game_name, title, description) VALUES
    ('snake', 'Snake Game', 'Classic snake game where you eat food to grow longer'),
    ('tetris', 'Tetris', 'Classic block stacking puzzle game'),
    ('pong', 'Pong', 'Classic table tennis arcade game')
ON CONFLICT (game_name) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- Insert test scores for the current user
INSERT INTO leaderboard (game_name, user_id, score)
SELECT 
    g.game_name,
    auth.uid(),
    floor(random() * 1000)::integer as score
FROM games g
CROSS JOIN (SELECT generate_series(1, 5)) as series
WHERE auth.uid() IS NOT NULL;
