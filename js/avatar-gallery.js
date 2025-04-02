class AvatarGallery {
    constructor(supabase) {
        this.supabase = supabase;
        this.uploadBtn = document.getElementById('upload-btn');
        this.uploadInput = document.getElementById('avatar-upload');
        this.avatarGrid = document.getElementById('avatar-grid');
        this.messageContainer = document.getElementById('avatar-message');
        this.defaultAvatarUrl = 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png';
        this.init();
    }

    showMessage(message, type = 'success') {
        if (!this.messageContainer) return;
        
        this.messageContainer.textContent = message;
        this.messageContainer.className = `message ${type}`;
        this.messageContainer.style.display = 'block';

        // Hide message after 3 seconds
        setTimeout(() => {
            this.messageContainer.style.display = 'none';
        }, 3000);
    }

    async init() {
        this.setupEventListeners();
        await this.loadAvatars();
    }

    setupEventListeners() {
        // Upload button click
        this.uploadBtn.addEventListener('click', () => {
            this.uploadInput.click();
        });

        // File selection
        this.uploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.uploadAvatar(file);
            }
        });

        // Delete and set default handlers are added dynamically
    }

    async loadAvatars() {
        try {
            const { data: avatars, error } = await this.supabase
                .from('avatar_gallery')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.avatarGrid.innerHTML = '';
            avatars.forEach(avatar => this.createAvatarElement(avatar));

        } catch (error) {
            console.error('Error loading avatars:', error);
            this.showMessage('Error loading avatars', 'error');
        }
    }

    async uploadAvatar(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const userId = (await this.supabase.auth.getUser()).data.user.id;
            const filePath = `${userId}/${Date.now()}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await this.supabase.storage
                .from('avatar_gallery')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('avatar_gallery')
                .getPublicUrl(filePath);

            // Add to avatar_gallery table
            const { error: dbError } = await this.supabase
                .from('avatar_gallery')
                .insert([{ 
                    user_id: userId,
                    image_url: publicUrl,
                    is_default: false
                }]);

            if (dbError) throw dbError;

            // Show success message
            this.showMessage('Avatar uploaded successfully');

            // Reload avatars
            await this.loadAvatars();

        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showMessage('Error uploading avatar', 'error');
        }
    }

    async deleteAvatar(avatarId, imageUrl) {
        try {
            // Delete from storage
            const filePath = imageUrl.split('/').slice(-2).join('/');
            const { error: storageError } = await this.supabase.storage
                .from('avatar_gallery')
                .remove([filePath]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await this.supabase
                .from('avatar_gallery')
                .delete()
                .eq('id', avatarId);

            if (dbError) throw dbError;

            // If it was the default avatar, set profile avatar to default
            const { data: avatar } = await this.supabase
                .from('avatar_gallery')
                .select('is_default')
                .eq('id', avatarId)
                .single();

            if (avatar?.is_default) {
                await this.supabase
                    .from('profiles')
                    .update({ avatar_url: this.defaultAvatarUrl })
                    .eq('id', (await this.supabase.auth.getUser()).data.user.id);
            }

            // Show success message
            this.showMessage('Avatar deleted successfully');

            // Reload avatars
            await this.loadAvatars();

        } catch (error) {
            console.error('Error deleting avatar:', error);
            this.showMessage('Error deleting avatar', 'error');
        }
    }

    async setDefaultAvatar(avatarId, imageUrl) {
        try {
            const userId = (await this.supabase.auth.getUser()).data.user.id;

            // Remove default from all other avatars
            await this.supabase
                .from('avatar_gallery')
                .update({ is_default: false })
                .eq('user_id', userId);

            // Set new default
            await this.supabase
                .from('avatar_gallery')
                .update({ is_default: true })
                .eq('id', avatarId);

            // Update profile avatar
            await this.supabase
                .from('profiles')
                .update({ avatar_url: imageUrl })
                .eq('id', userId);

            // Show success message
            this.showMessage('Default avatar set successfully');

            // Reload avatars
            await this.loadAvatars();

        } catch (error) {
            console.error('Error setting default avatar:', error);
            this.showMessage('Error setting default avatar', 'error');
        }
    }

    createAvatarElement(avatar) {
        const div = document.createElement('div');
        div.className = 'avatar-item';
        div.innerHTML = `
            <img src="${avatar.image_url}" alt="Avatar">
            ${avatar.is_default ? '<span class="default-badge">Default</span>' : ''}
            <div class="avatar-actions">
                ${!avatar.is_default ? `
                    <button class="set-default-btn">Set Default</button>
                ` : ''}
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Add event listeners
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            this.deleteAvatar(avatar.id, avatar.image_url);
        });

        const setDefaultBtn = div.querySelector('.set-default-btn');
        if (setDefaultBtn) {
            setDefaultBtn.addEventListener('click', () => {
                this.setDefaultAvatar(avatar.id, avatar.image_url);
            });
        }

        this.avatarGrid.appendChild(div);
    }
}

// Initialize when DOM is loaded and Supabase is ready
document.addEventListener('DOMContentLoaded', () => {
    const checkSupabase = async () => {
        try {
            if (window.getSupabase) {
                const supabase = await window.getSupabase();
                window.avatarGallery = new AvatarGallery(supabase);
            } else {
                setTimeout(checkSupabase, 100);
            }
        } catch (error) {
            console.error('Error initializing AvatarGallery:', error);
        }
    };
    checkSupabase();
});
