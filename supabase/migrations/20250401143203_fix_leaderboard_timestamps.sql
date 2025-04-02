-- Add created_at column if it doesn't exist
ALTER TABLE leaderboard
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update any existing rows that have null created_at
UPDATE leaderboard 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;
