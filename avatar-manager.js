class AvatarManager {
    constructor() {
        this.supabase = null;
        this.selectedFile = null;
        // Wait for Supabase to be initialized globally
        this.initOnSupabaseReady();
    }

    async initOnSupabaseReady() {
        const checkSupabase = setInterval(async () => {
            if (window.supabase && window.supabase.auth && window.supabase.storage) {
                clearInterval(checkSupabase);
                console.log('AvatarManager: Supabase ready.');
                this.supabase = window.supabase; 
                await this.init();
            } else {
                console.log('AvatarManager: Waiting for Supabase...');
            }
        }, 100);

        // Timeout
        setTimeout(() => {
            if (!this.supabase) {
                clearInterval(checkSupabase);
                console.error('AvatarManager initialization timed out. Supabase not ready.');
            }
        }, 5000); // 5 second timeout
    }

    async init() {
        if (!this.supabase) {
            console.error('AvatarManager: Cannot init, Supabase client not available.');
            return;
        }
        console.log('AvatarManager: Initializing...');
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                console.log('AvatarManager: Session found, setting up upload and loading avatar.');
                await this.setupAvatarUpload();
                // await this.loadAvatar(); // Load current avatar on init if logged in
            }

            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                 console.log(`AvatarManager: Auth event: ${event}, Session found:`, !!session);
                if (event === 'SIGNED_IN' && session) {
                    await this.setupAvatarUpload(); // Re-setup upload controls if needed
                    await this.loadAvatar(); // Load avatar on sign-in
                } else if (event === 'SIGNED_OUT') {
                    // Clear preview or reset UI if necessary when user signs out
                    const avatarPreview = document.getElementById('avatar-preview'); 
                     if (avatarPreview) {
                         // Reset to a default or placeholder state if applicable
                         // preview.src = 'path/to/default/placeholder.png'; 
                         // preview.style.display = 'none';
                     }
                }
            });
        } catch (error) {
            console.error('Error initializing AvatarManager:', error);
        }
    }

    async setupAvatarUpload() {
        if (!this.supabase) return; // Guard against calling before init

        const avatarInput = document.getElementById('avatar-input');
        const avatarPreview = document.getElementById('avatar-preview');
        const uploadButton = document.getElementById('upload-avatar');
        const dropZone = document.getElementById('drop-zone');
        const uploadFeedback = document.getElementById('upload-feedback'); // Optional feedback element

        // Ensure elements exist (might not be on every page)
        if (!avatarInput || !avatarPreview || !uploadButton || !dropZone) {
            // console.log('AvatarManager: Upload elements not found on this page.');
            return; // Silently return if upload UI isn't present
        }
        console.log('AvatarManager: Setting up avatar upload UI.');

        // Use replaceWith(cloneNode) to ensure listeners are fresh if setup runs multiple times
        const newAvatarInput = avatarInput.cloneNode(true);
        avatarInput.parentNode.replaceChild(newAvatarInput, avatarInput);
        newAvatarInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        const newDropZone = dropZone.cloneNode(true);
        dropZone.parentNode.replaceChild(newDropZone, dropZone);
        newDropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            newDropZone.classList.add('dragover');
        });
        newDropZone.addEventListener('dragleave', () => {
            newDropZone.classList.remove('dragover');
        });
        newDropZone.addEventListener('drop', (e) => {
            e.preventDefault(); 
            newDropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0]; 
            this.handleFileSelect(file);
        });

        const newUploadButton = uploadButton.cloneNode(true);
        uploadButton.parentNode.replaceChild(newUploadButton, uploadButton);
        newUploadButton.addEventListener('click', async () => {
            if (!this.supabase) return; // Guard
            const file = this.selectedFile;
            if (!file) {
                if(uploadFeedback) uploadFeedback.textContent = 'Please select an image file first.';
                else alert('Please select an image file first.');
                return;
            }

            try {
                newUploadButton.disabled = true;
                newUploadButton.textContent = 'Uploading...';
                if(uploadFeedback) uploadFeedback.textContent = ''; // Clear previous feedback

                const { data: { session } } = await this.supabase.auth.getSession();
                if (!session) throw new Error('Not authenticated');

                const fileExt = file.name.split('.').pop(); 
                const fileName = `${session.user.id}-${Date.now()}.${fileExt}`; // Add timestamp to prevent cache issues
                const filePath = `avatars/${fileName}`;

                console.log(`AvatarManager: Uploading ${filePath}...`);
                // Upload file to Supabase Storage
                const { error: uploadError } = await this.supabase.storage
                    .from('avatars')
                    .upload(filePath, file, { upsert: false }); // Use upsert: false with timestamp

                if (uploadError) throw uploadError;
                console.log(`AvatarManager: Upload successful.`);

                // Get public URL
                const { data: urlData } = this.supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                if (!urlData || !urlData.publicUrl) {
                    throw new Error('Failed to get public URL after upload.');
                }
                const publicUrl = urlData.publicUrl;
                 console.log(`AvatarManager: Public URL: ${publicUrl}`);

                // Update user profile
                 console.log(`AvatarManager: Updating profile for user ${session.user.id}...`);
                const { error: updateError } = await this.supabase
                    .from('profiles')
                    .update({ avatar_url: publicUrl })
                    .eq('id', session.user.id);

                if (updateError) throw updateError;
                 console.log(`AvatarManager: Profile updated successfully.`);

                // Update all avatar images on the page immediately
                this.updateAvatarImages(publicUrl, session.user.id);
                
                if(uploadFeedback) uploadFeedback.textContent = 'Avatar updated successfully!';
                else alert('Avatar updated successfully!');
                this.selectedFile = null; // Clear selection after successful upload

            } catch (error) {
                console.error('Error uploading avatar:', error);
                 if(uploadFeedback) uploadFeedback.textContent = `Error uploading: ${error.message}`;
                else alert(`Error uploading avatar: ${error.message}. Please try again.`);
            } finally {
                newUploadButton.disabled = false;
                newUploadButton.textContent = 'Upload Avatar';
            }
        });
    }

    async loadAvatar() {
         if (!this.supabase) return; // Guard
         console.log('AvatarManager: Attempting to load current user avatar...');
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (!session) {
                 console.log('AvatarManager: No session found, cannot load avatar.');
                return; 
            }
            console.log(`AvatarManager: Loading profile for user ${session.user.id}...`);
            const { data: profile, error: profileError } = await this.supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                // It's okay if profile doesn't exist yet or other errors, just log it.
                 console.warn(`AvatarManager: Error loading profile: ${profileError.message}`);
                if (profileError.code === 'PGRST116') {
                     console.log('AvatarManager: Profile not found for user.');
                } 
                 return; // Don't proceed if profile loading failed
            }

            if (profile?.avatar_url) {
                 console.log(`AvatarManager: Found avatar URL: ${profile.avatar_url}. Update will happen via SIGNED_IN event or upload.`);
            } else {
                 console.log('AvatarManager: No avatar_url found in profile.');
                 // Optionally set to a default avatar here if needed
                 // this.updateAvatarImages('path/to/default.png', session.user.id);
            }
        } catch (error) {
            // Catch errors from getSession itself
            console.error('Error in loadAvatar (session check):', error);
        }
    }

    handleFileSelect(file) {
        const avatarPreview = document.getElementById('avatar-preview');
        const uploadFeedback = document.getElementById('upload-feedback');

        if (!file) {
            if(uploadFeedback) uploadFeedback.textContent = 'No file selected.';
            this.selectedFile = null;
             if(avatarPreview) avatarPreview.style.display = 'none'; // Hide preview
            return;
        }

        if (!file.type.startsWith('image/')) {
             if(uploadFeedback) uploadFeedback.textContent = 'Please select an image file (JPEG, PNG, GIF, etc.).';
            else alert('Please select an image file');
             this.selectedFile = null;
             if(avatarPreview) avatarPreview.style.display = 'none'; // Hide preview
            return;
        }

        // Optional: Check file size
        const maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) {
            if(uploadFeedback) uploadFeedback.textContent = `File is too large (max ${maxSizeMB}MB).`;
            else alert(`File is too large (max ${maxSizeMB}MB).`);
            this.selectedFile = null;
             if(avatarPreview) avatarPreview.style.display = 'none'; // Hide preview
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (avatarPreview) {
                avatarPreview.src = e.target.result;
                avatarPreview.style.display = 'block';
                 if(uploadFeedback) uploadFeedback.textContent = ''; // Clear feedback on new preview
            }
        };
        reader.onerror = () => {
             console.error('FileReader error');
             if(uploadFeedback) uploadFeedback.textContent = 'Error reading file.';
        };
        reader.readAsDataURL(file);
        this.selectedFile = file;
         console.log(`AvatarManager: File selected for preview: ${file.name}`);
    }

    updateAvatarImages(avatarUrl, userId) {
        if (!userId) {
            console.warn('AvatarManager: updateAvatarImages called without userId.');
            return;
        }
         console.log(`AvatarManager: Updating avatars for user ${userId} with URL ${avatarUrl}`);
        // Update all avatar images that belong to the current user
        // Select images specifically marked with the user's ID
        const userAvatars = document.querySelectorAll(`img[data-user-id="${userId}"]`);
        if (userAvatars.length === 0) {
             console.log(`AvatarManager: No avatar images found with data-user-id="${userId}".`);
        }
        userAvatars.forEach(img => {
            console.log(`AvatarManager: Updating src for image:`, img);
            const defaultAvatar = 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png'; // Consistent default
            img.src = avatarUrl || defaultAvatar; // Use default if provided URL is empty
            img.onerror = () => { // Add error handling here too
                console.warn(`AvatarManager: Failed to load avatar image from ${avatarUrl} for element`, img, `. Using default.`);
                img.src = defaultAvatar;
            };
        });

        // Also update the preview if it exists
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) {
            avatarPreview.src = avatarUrl;
        }
    }
}

// Initialize avatar manager (will wait internally for Supabase)
window.avatarManager = new AvatarManager();