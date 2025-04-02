-- Create game_scores table
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    game TEXT NOT NULL,
    score INTEGER NOT NULL,
    time_played TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Set up RLS for game_scores table
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own scores
CREATE POLICY "Users can insert their own scores"
    ON public.game_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view all scores
CREATE POLICY "Everyone can view all scores"
    ON public.game_scores
    FOR SELECT
    USING (true);

-- Create index for faster queries
CREATE INDEX game_scores_game_score_idx ON public.game_scores(game, score DESC);
