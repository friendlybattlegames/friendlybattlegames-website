-- 1. Create public.profiles table
-- Drop dependent trigger and function first if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now drop the table if it exists (shouldn't if trigger/func dropped, but good practice)
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. Enable RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles table
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public read access to specific columns needed publicly
CREATE POLICY "Public can view specific profile fields." 
  ON public.profiles FOR SELECT
  USING (true); 

-- 4. Create function to handle new user signup
-- Function is created with CREATE OR REPLACE, so no explicit drop needed here, but added above for safety.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    -- Extract username from email before '@' or use full email if desired
    substring(NEW.email from '(.*?)(?:@|''.*'')'), 
    -- Optionally set a default avatar URL here
    NULL 
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to call handle_new_user on auth.users insert
-- Trigger was dropped above, so CREATE TRIGGER is fine.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant permissions (adjust as needed)
-- Grant general SELECT permission; RLS policies will enforce row visibility.
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
-- Ensure authenticated users can call the handle_new_user function implicitly via trigger
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;