-- Insert sample blog posts using the test user's ID
DO $$
DECLARE
    _user_id uuid := gen_random_uuid();
BEGIN
    -- Create test user if not exists
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        role,
        aud,
        raw_app_meta_data,
        raw_user_meta_data
    ) 
    VALUES (
        _user_id,
        '00000000-0000-0000-0000-000000000000',
        'test@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        '{"provider":"email","providers":["email"]}',
        '{}'
    );

    -- Update the profile that was automatically created by the trigger
    UPDATE profiles 
    SET username = 'TestUser',
        avatar_url = 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png',
        bio = 'A test user for development purposes'
    WHERE id = _user_id;

    -- Insert sample blog posts
    INSERT INTO blog_posts (title, content, slug, author_id, image_url)
    VALUES 
        ('Welcome to FriendlyBattleGames', 
         'Welcome to our gaming community! Here you''ll find exciting arcade games, competitive leaderboards, and a friendly community of gamers. Stay tuned for more updates!',
         'welcome-to-fbg-' || gen_random_uuid(),
         _user_id,
         'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'),
        ('Top Gaming Tips', 
         'Want to improve your gaming skills? Here are some essential tips: 1. Practice regularly 2. Learn from your mistakes 3. Study game mechanics 4. Join our community for more tips!',
         'top-gaming-tips-' || gen_random_uuid(),
         _user_id,
         'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'),
        ('Upcoming Features', 
         'We''re working on exciting new features including: new arcade games, improved leaderboards, and community events. Stay tuned for more updates!',
         'upcoming-features-' || gen_random_uuid(),
         _user_id,
         'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
END $$;
