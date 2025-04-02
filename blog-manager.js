class BlogManager {
    constructor() {
        this.supabase = window.supabase;
        this.init();
    }

    async init() {
        try {
            console.log('BlogManager: Initializing...');
            const { data: { session } } = await this.supabase.auth.getSession();
            this.setupNewPostButton(session);
            await this.loadPosts();

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('BlogManager: Auth state changed:', event);
                this.setupNewPostButton(session);
            });
        } catch (error) {
            console.error('BlogManager: Error initializing:', error);
        }
    }

    setupNewPostButton(session) {
        const blogContent = document.querySelector('.blog-content');
        if (!blogContent) return;

        // Remove existing new post button if any
        const existingButton = document.querySelector('.new-post-button');
        if (existingButton) {
            existingButton.remove();
        }

        if (session) {
            // Add new post button for authenticated users
            const newPostButton = document.createElement('button');
            newPostButton.className = 'new-post-button';
            newPostButton.innerHTML = '<i class="fas fa-plus"></i> Create New Post';
            newPostButton.onclick = () => this.showNewPostForm();
            blogContent.insertAdjacentElement('beforebegin', newPostButton);
        }
    }

    showNewPostForm() {
        const formHtml = `
            <div class="new-post-form">
                <h2>Create New Blog Post</h2>
                <form id="blog-post-form">
                    <div class="form-group">
                        <label for="post-title">Title:</label>
                        <input type="text" id="post-title" required>
                    </div>
                    <div class="form-group">
                        <label for="post-content">Content:</label>
                        <textarea id="post-content" rows="10" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="post-image">Image URL (optional):</label>
                        <input type="url" id="post-image" placeholder="https://example.com/image.jpg">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-button">Publish Post</button>
                        <button type="button" class="secondary-button" onclick="this.closest('.new-post-form').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        const existingForm = document.querySelector('.new-post-form');
        if (existingForm) {
            existingForm.remove();
        }

        document.querySelector('.blog-content').insertAdjacentHTML('beforebegin', formHtml);

        // Add form submit handler
        document.getElementById('blog-post-form').onsubmit = async (e) => {
            e.preventDefault();
            await this.createNewPost();
        };
    }

    async createNewPost() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (!session) {
                alert('Please log in to create a post');
                return;
            }

            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const imageUrl = document.getElementById('post-image').value.trim();

            if (!title || !content) {
                alert('Title and content are required');
                return;
            }

            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const { error: slugCheckError, data: existingPost } = await this.supabase
                .from('blog_posts')
                .select('id')
                .eq('slug', slug)
                .single();

            if (existingPost) {
                alert('A post with this title already exists. Please choose a different title.');
                return;
            }

            const { error } = await this.supabase
                .from('blog_posts')
                .insert({
                    title,
                    content,
                    image_url: imageUrl || null,
                    slug,
                    author_id: session.user.id,
                    published_at: new Date().toISOString()
                });

            if (error) {
                console.error('BlogManager: Error creating post:', error);
                alert('Error creating post. Please try again.');
                return;
            }

            // Remove the form and refresh posts
            document.querySelector('.new-post-form').remove();
            await this.loadPosts();
        } catch (error) {
            console.error('BlogManager: Error in createNewPost:', error);
            alert('Error creating post. Please try again.');
        }
    }

    async loadPosts() {
        try {
            console.log('BlogManager: Loading posts...');
            const blogContent = document.querySelector('.blog-content');
            if (!blogContent) {
                console.error('BlogManager: Blog content container not found');
                return;
            }

            // Clear existing posts
            const postsContainer = document.getElementById('posts-container');
            if (postsContainer) {
                postsContainer.innerHTML = '';
            } else {
                const newPostsContainer = document.createElement('div');
                newPostsContainer.id = 'posts-container';
                blogContent.appendChild(newPostsContainer);
            }

            // Show loading state
            document.getElementById('posts-container').innerHTML = '<div class="loading">Loading posts...</div>';

            // Fetch posts with author information
            const { data: posts, error } = await this.supabase
                .from('blog_posts')
                .select(`
                    *,
                    author:author_id (
                        email,
                        profiles:profiles (
                            username,
                            avatar_url
                        )
                    )
                `)
                .order('published_at', { ascending: false });

            if (error) {
                console.error('BlogManager: Error fetching posts:', error);
                document.getElementById('posts-container').innerHTML = '<div class="error">Error loading posts</div>';
                return;
            }

            if (!posts || posts.length === 0) {
                document.getElementById('posts-container').innerHTML = '<div class="no-posts">No blog posts yet</div>';
                return;
            }

            // Render posts
            const postsHtml = posts.map(post => {
                const author = post.author?.profiles?.[0] || { username: post.author?.email?.split('@')[0] };
                const date = new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                return `
                    <article class="blog-post">
                        ${post.image_url ? `
                            <div class="post-image">
                                <img src="${post.image_url}" alt="${post.title}" onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                            </div>
                        ` : ''}
                        <div class="post-content">
                            <h2>${post.title}</h2>
                            <div class="post-meta">
                                <span class="author">
                                    <img src="${author.avatar_url || 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png'}" 
                                         alt="${author.username}" 
                                         class="author-avatar">
                                    ${author.username}
                                </span>
                                <span class="date">${date}</span>
                            </div>
                            <div class="post-text">${this.formatContent(post.content)}</div>
                            <a href="#" class="read-more" onclick="blogManager.showFullPost('${post.slug}')">Read more</a>
                        </div>
                    </article>
                `;
            }).join('');

            document.getElementById('posts-container').innerHTML = postsHtml;
        } catch (error) {
            console.error('BlogManager: Error in loadPosts:', error);
            document.getElementById('posts-container').innerHTML = '<div class="error">Error loading posts</div>';
        }
    }

    formatContent(content) {
        // Truncate content for preview
        const maxLength = 300;
        if (content.length <= maxLength) return content;
        return content.substring(0, content.lastIndexOf(' ', maxLength)) + '...';
    }

    async showFullPost(slug) {
        try {
            const { data: post, error } = await this.supabase
                .from('blog_posts')
                .select(`
                    *,
                    author:author_id (
                        email,
                        profiles:profiles (
                            username,
                            avatar_url
                        )
                    )
                `)
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('BlogManager: Error fetching post:', error);
                return;
            }

            const author = post.author?.profiles?.[0] || { username: post.author?.email?.split('@')[0] };
            const date = new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const modalHtml = `
                <div class="post-modal">
                    <div class="post-modal-content">
                        <button class="close-button" onclick="this.closest('.post-modal').remove()">×</button>
                        ${post.image_url ? `
                            <div class="post-image">
                                <img src="${post.image_url}" alt="${post.title}" onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                            </div>
                        ` : ''}
                        <div class="post-content">
                            <h2>${post.title}</h2>
                            <div class="post-meta">
                                <span class="author">
                                    <img src="${author.avatar_url || 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png'}" 
                                         alt="${author.username}" 
                                         class="author-avatar">
                                    ${author.username}
                                </span>
                                <span class="date">${date}</span>
                            </div>
                            <div class="post-text">${post.content}</div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (error) {
            console.error('BlogManager: Error in showFullPost:', error);
        }
    }
}

// Initialize blog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    while (!window.supabase) {
        setTimeout(() => {}, 100);
    }
    window.blogManager = new BlogManager();
});
