-- Create default admin profile if it doesn't exist
INSERT INTO profiles (id, username, avatar_url, created_at)
SELECT 
    auth.uid(),
    'Admin',
    'https://api.dicebear.com/7.x/avatars/svg?seed=Admin',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- Get the admin profile ID
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM profiles LIMIT 1;

    -- Insert Welcome post
    INSERT INTO blog_posts (id, title, content, author_id, created_at)
    VALUES (
        uuid_generate_v4(),
        'Welcome to FriendlyBattleGames!',
        E'We''re excited to launch our new gaming platform where friends can compete in classic arcade games!\n\nOur current lineup includes:\n- Space Shooter: Defend Earth from alien invaders\n- Snake Game: Grow your snake and avoid collisions\n- Memory Game: Test your memory skills\n\nStay tuned for more games and features coming soon!',
        admin_id,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    );

    -- Insert Space Shooter tips post
    INSERT INTO blog_posts (id, title, content, author_id, created_at)
    VALUES (
        uuid_generate_v4(),
        'How to Master Space Shooter',
        E'Want to climb the Space Shooter leaderboard? Here are some pro tips:\n\n1. Stay mobile - never stop moving\n2. Learn enemy patterns\n3. Save your power-ups for boss battles\n4. Practice dodging before focusing on shooting\n\nKeep practicing and you''ll be at the top of the leaderboard in no time!',
        admin_id,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    );

    -- Insert Upcoming Features post
    INSERT INTO blog_posts (id, title, content, author_id, created_at)
    VALUES (
        uuid_generate_v4(),
        'Upcoming Features and Events',
        E'We''re working hard to make FriendlyBattleGames even better! Here''s what''s coming:\n\n- New multiplayer games\n- Monthly tournaments with prizes\n- Custom profile badges\n- Friend challenges\n\nWhich feature are you most excited about? Let us know in the comments!',
        admin_id,
        CURRENT_TIMESTAMP
    );
END $$;
