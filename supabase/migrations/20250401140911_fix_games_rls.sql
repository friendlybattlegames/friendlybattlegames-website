-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Games are viewable by everyone" ON games;
DROP POLICY IF EXISTS "Allow public read access to games" ON games;

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to games"
    ON games
    FOR SELECT
    TO public
    USING (true);
