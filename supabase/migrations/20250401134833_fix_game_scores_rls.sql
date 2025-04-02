-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to game_scores" ON game_scores;
DROP POLICY IF EXISTS "Allow authenticated users to insert game_scores" ON game_scores;
DROP POLICY IF EXISTS "Allow users to update their own game_scores" ON game_scores;
DROP POLICY IF EXISTS "Allow users to delete their own game_scores" ON game_scores;

-- Enable RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to game_scores"
    ON game_scores
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to insert game_scores"
    ON game_scores
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own game_scores"
    ON game_scores
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own game_scores"
    ON game_scores
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
