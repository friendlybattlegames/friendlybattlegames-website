class GalleryManager {
    constructor() {
        this.supabase = window.supabase;
        this.init();
    }

    async init() {
        try {
            // Wait for auth to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: { session } } = await this.supabase.auth.getSession();
            if (!session) {
                console.error('User not authenticated');
                return;
            }

            // Store user info
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not found');
            
            this.userId = user.id;
            console.log('Authenticated as user:', this.userId);

            this.dropZone = document.getElementById('image-drop-zone');
            this.fileInput = document.getElementById('gallery-upload');
            this.previewGrid = document.getElementById('image-preview-grid');
            this.uploadButton = this.dropZone.querySelector('.upload-btn');

            if (!this.dropZone || !this.fileInput || !this.previewGrid) {
                console.error('Required elements not found');
                return;
            }

            await this.loadImages();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing GalleryManager:', error);
        }
    }

    setupEventListeners() {
        // Click to upload
        if (this.uploadButton) {
            this.uploadButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.fileInput.click();
            });
        }

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                this.handleFiles(files);
            }
        });

        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                this.handleFiles(files);
            }
        });
    }

    async handleFiles(files) {
        if (!files || files.length === 0) return;
        
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                alert('Please select image files only');
                continue;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                continue;
            }

            await this.uploadImage(file);
        }
    }

    async uploadImage(file) {
        let previewElement = null;
        try {
            // Verify we have user ID
            if (!this.userId) {
                const { data: { user }, error: userError } = await this.supabase.auth.getUser();
                if (userError) throw userError;
                if (!user) throw new Error('Not authenticated');
                this.userId = user.id;
            }

            // Create preview element
            previewElement = this.createPreviewElement(file);
            this.previewGrid.insertBefore(previewElement, this.previewGrid.firstChild);

            // Upload to storage
            const filePath = `${this.userId}/${file.name}`;
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('images')
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: true
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                throw uploadError;
            }

            console.log('Upload successful:', uploadData);

            // Get public URL
            const { data: urlData } = this.supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            if (!urlData || !urlData.publicUrl) {
                console.error('Failed to get public URL:', urlData);
                throw new Error('Failed to get public URL');
            }

            // Insert into database
            const insertData = {
                user_id: this.userId,
                image_url: urlData.publicUrl,
                file_name: file.name
            };

            console.log('Inserting record:', insertData);

            const { data: imageData, error: dbError } = await this.supabase
                .from('image_gallery')
                .upsert(insertData, { 
                    onConflict: 'user_id, file_name'
                })
                .select()
                .single();

            if (dbError) {
                console.error('Database insert error:', dbError);
                throw dbError;
            }

            console.log('Image gallery record created:', imageData);

            // Update preview with final URL and buttons
            const img = previewElement.querySelector('img');
            img.src = urlData.publicUrl;

            // Remove progress bar
            const progress = previewElement.querySelector('.upload-progress');
            if (progress) progress.remove();

            // Add buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'image-buttons';

            // Add set as avatar button
            const setAvatarBtn = document.createElement('button');
            setAvatarBtn.className = 'set-avatar-btn';
            setAvatarBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
            setAvatarBtn.title = 'Set as Avatar';
            setAvatarBtn.addEventListener('click', () => this.setAsAvatar(imageData.id));

            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove Image';
            removeBtn.addEventListener('click', () => this.removeImage(imageData.id, previewElement));

            // Add buttons to container
            buttonsContainer.appendChild(setAvatarBtn);
            buttonsContainer.appendChild(removeBtn);

            // Add buttons to preview
            previewElement.appendChild(buttonsContainer);
        } catch (error) {
            console.error('Error uploading image:', error);
            if (previewElement) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error';
                errorMsg.textContent = 'Upload failed';
                previewElement.appendChild(errorMsg);
            }
        }
    }

    async loadImages() {
        try {
            const { data: images, error } = await this.supabase
                .from('image_gallery')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.previewGrid.innerHTML = '';

            for (const image of images) {
                const previewElement = document.createElement('div');
                previewElement.className = 'image-preview';

                const img = document.createElement('img');
                img.src = image.image_url;
                img.alt = image.file_name;

                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'image-buttons';

                const setAvatarBtn = document.createElement('button');
                setAvatarBtn.className = 'set-avatar-btn';
                setAvatarBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
                setAvatarBtn.title = 'Set as Avatar';
                setAvatarBtn.addEventListener('click', () => this.setAsAvatar(image.id));

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.title = 'Remove Image';
                removeBtn.addEventListener('click', () => this.removeImage(image.id, previewElement));

                buttonsContainer.appendChild(setAvatarBtn);
                buttonsContainer.appendChild(removeBtn);

                previewElement.appendChild(img);
                previewElement.appendChild(buttonsContainer);

                this.previewGrid.appendChild(previewElement);
            }
        } catch (error) {
            console.error('Error loading images:', error);
            this.previewGrid.innerHTML = '<div class="error">Error loading images</div>';
        }
    }

    createPreviewElement(file) {
        const previewElement = document.createElement('div');
        previewElement.className = 'image-preview';

        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);

        const progress = document.createElement('div');
        progress.className = 'upload-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'upload-progress-bar';
        progressBar.style.width = '0%';
        progress.appendChild(progressBar);

        previewElement.appendChild(img);
        previewElement.appendChild(progress);

        return previewElement;
    }

    async getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async setAsAvatar(imageId) {
        try {
            const { data: image, error: getError } = await this.supabase
                .from('image_gallery')
                .select('image_url')
                .eq('id', imageId)
                .single();

            if (getError) throw getError;

            const { error: updateError } = await this.supabase
                .from('profiles')
                .update({ avatar_url: image.image_url })
                .eq('id', this.userId);

            if (updateError) throw updateError;

            // Update all avatar images on the page
            const avatars = document.querySelectorAll(`img[data-user-id="${this.userId}"]`);
            avatars.forEach(avatar => avatar.src = image.image_url);

            alert('Avatar updated successfully!');
        } catch (error) {
            console.error('Error setting avatar:', error);
            alert('Failed to set avatar');
        }
    }

    async removeImage(imageId, previewElement) {
        try {
            const { data: image, error: getError } = await this.supabase
                .from('image_gallery')
                .select('file_name')
                .eq('id', imageId)
                .single();

            if (getError) throw getError;

            // Delete from storage
            const { error: storageError } = await this.supabase.storage
                .from('images')
                .remove([`${this.userId}/${image.file_name}`]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await this.supabase
                .from('image_gallery')
                .delete()
                .eq('id', imageId);

            if (dbError) throw dbError;

            // Remove preview element
            previewElement.remove();
        } catch (error) {
            console.error('Error removing image:', error);
            alert('Failed to remove image');
        }
    }
}

// Initialize gallery manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.galleryManager = new GalleryManager();
});