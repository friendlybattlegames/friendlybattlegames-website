-- Add avatar_id to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_image_id UUID REFERENCES image_gallery(id);

-- Function to handle avatar updates
CREATE OR REPLACE FUNCTION handle_avatar_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If new avatar is set, update avatar_url from image_gallery
    IF NEW.avatar_image_id IS NOT NULL THEN
        SELECT public_url INTO NEW.avatar_url
        FROM image_gallery
        WHERE id = NEW.avatar_image_id
        AND user_id = NEW.id
        AND deleted_at IS NULL;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid avatar image selected';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update avatar_url when avatar_image_id changes
DROP TRIGGER IF EXISTS update_avatar_url ON profiles;
CREATE TRIGGER update_avatar_url
    BEFORE UPDATE OF avatar_image_id ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_avatar_update();

-- Add policy to allow users to set their avatar
CREATE POLICY "Users can update their own avatar"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (
            -- Allow setting avatar_image_id only if it belongs to the user
            NEW.avatar_image_id IS NULL
            OR EXISTS (
                SELECT 1 FROM image_gallery
                WHERE id = NEW.avatar_image_id
                AND user_id = auth.uid()
                AND deleted_at IS NULL
            )
        )
    );

-- Function to set avatar
CREATE OR REPLACE FUNCTION set_profile_avatar(image_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT auth.uid() INTO v_user_id;
    
    -- Verify image exists and belongs to user
    IF NOT EXISTS (
        SELECT 1 FROM image_gallery
        WHERE id = image_id
        AND user_id = v_user_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Invalid image selected';
    END IF;
    
    -- Update profile
    UPDATE profiles
    SET avatar_image_id = image_id
    WHERE id = v_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove avatar
CREATE OR REPLACE FUNCTION remove_profile_avatar()
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT auth.uid() INTO v_user_id;
    
    -- Update profile
    UPDATE profiles
    SET 
        avatar_image_id = NULL,
        avatar_url = 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png'
    WHERE id = v_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN profiles.avatar_image_id IS 'Reference to image in image_gallery used as avatar';
COMMENT ON FUNCTION set_profile_avatar IS 'Set a user''s avatar to an image from their gallery';
COMMENT ON FUNCTION remove_profile_avatar IS 'Remove user''s avatar and set to default';
