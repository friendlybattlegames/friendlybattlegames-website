-- Insert initial games
INSERT INTO games (game_name, title, description) VALUES
    ('snake', 'Snake Game', 'Classic snake game where you eat food to grow longer'),
    ('tetris', 'Tetris', 'Classic block stacking puzzle game'),
    ('pong', 'Pong', 'Classic table tennis arcade game')
ON CONFLICT (game_name) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;
