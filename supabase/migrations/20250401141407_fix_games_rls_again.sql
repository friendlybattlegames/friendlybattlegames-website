-- Disable RLS first to ensure we can modify policies
ALTER TABLE games DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow public read access to games" ON games;
DROP POLICY IF EXISTS "Games are viewable by everyone" ON games;

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable read access for all users" ON games
    FOR SELECT 
    TO public
    USING (true);

-- Ensure we have some initial games
INSERT INTO games (game_name, title, description) VALUES
    ('space-shooter', 'Space Shooter', 'Classic space shooting game'),
    ('snake', 'Snake Game', 'Classic snake game'),
    ('memory', 'Memory Game', 'Test your memory skills')
ON CONFLICT (game_name) 
DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description;
