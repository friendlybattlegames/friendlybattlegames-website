-- Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, split_part(new.email, '@', 1), 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png')
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      avatar_url = EXCLUDED.avatar_url
  WHERE profiles.username IS NULL;
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
