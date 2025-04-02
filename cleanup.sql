-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS public.collection_items;
DROP TABLE IF EXISTS public.collections;
DROP TABLE IF EXISTS public.game_scores;
DROP TABLE IF EXISTS public.arcade_games;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.shop_items;
DROP TABLE IF EXISTS public.blog_posts_categories;
DROP TABLE IF EXISTS public.blog_categories;
DROP TABLE IF EXISTS public.blog_posts;
DROP TABLE IF EXISTS public.profiles;
