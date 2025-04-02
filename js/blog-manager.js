class BlogManager {
    constructor(supabase) {
        this.supabase = supabase;
        this.init();
    }

    async init() {
        try {
            await this.loadPosts();
        } catch (error) {
            console.error('BlogManager: Error in init:', error);
        }
    }

    async loadPosts() {
        try {
            console.log("BlogManager: Loading posts...");
            const { data: posts, error } = await this.supabase
                .from('blog_posts')
                .select(`
                    *,
                    profiles:author_id (
                        username,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('BlogManager: Error loading posts:', error);
                throw error;
            }

            console.log("BlogManager: Posts loaded:", posts);
            this.displayPosts(posts || []);
        } catch (error) {
            console.error('BlogManager: Error loading posts:', error);
            const blogContainer = document.getElementById('blog-posts');
            if (blogContainer) {
                blogContainer.innerHTML = '<p class="error">Error loading posts. Please try again later.</p>';
            }
        }
    }

    displayPosts(posts) {
        const blogContainer = document.getElementById('blog-posts');
        if (!blogContainer) {
            console.error('BlogManager: Blog container not found');
            return;
        }

        if (!posts || posts.length === 0) {
            console.log('BlogManager: No posts to display');
            blogContainer.innerHTML = '<p class="no-posts">No blog posts yet.</p>';
            return;
        }

        console.log('BlogManager: Displaying posts:', posts);
        const postsHtml = posts.map(post => this.createPostHtml(post)).join('');
        blogContainer.innerHTML = postsHtml;

        // Add event listeners for read more buttons
        document.querySelectorAll('.read-more-btn').forEach(button => {
            button.addEventListener('click', () => {
                const postId = button.dataset.postId;
                const post = posts.find(p => p.id === postId);
                if (post) {
                    this.showFullPost(post);
                }
            });
        });
    }

    createPostHtml(post) {
        const authorName = post.profiles?.username || 'Anonymous';
        const authorAvatar = post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avatars/svg?seed=fallback';
        const date = new Date(post.created_at).toLocaleDateString();
        
        return `
            <div class="blog-post">
                <img src="${post.image_url || 'images/default-blog-image.jpg'}" alt="${this.escapeHtml(post.title)}" class="post-image">
                <div class="post-content">
                    <h2>${this.escapeHtml(post.title)}</h2>
                    <div class="post-meta">
                        <img src="${authorAvatar}" alt="${this.escapeHtml(authorName)}" class="author-avatar">
                        <span>By ${this.escapeHtml(authorName)} on ${date}</span>
                    </div>
                    <p class="post-excerpt">${this.escapeHtml(this.truncateText(post.content, 150))}</p>
                    <button class="read-more-btn" data-post-id="${post.id}">Read More</button>
                </div>
            </div>
        `;
    }

    showFullPost(post) {
        const authorName = post.profiles?.username || 'Anonymous';
        const authorAvatar = post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avatars/svg?seed=fallback';
        const date = new Date(post.created_at).toLocaleDateString();
        
        const modal = document.createElement('div');
        modal.className = 'blog-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <article class="full-blog-post">
                    <img src="${post.image_url || 'images/default-blog-image.jpg'}" alt="${this.escapeHtml(post.title)}" class="full-post-image">
                    <h1>${this.escapeHtml(post.title)}</h1>
                    <div class="post-meta">
                        <img src="${authorAvatar}" alt="${this.escapeHtml(authorName)}" class="author-avatar">
                        <span>By ${this.escapeHtml(authorName)} on ${date}</span>
                    </div>
                    <div class="post-content">${this.formatContent(post.content)}</div>
                </article>
                <button class="close-modal">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substr(0, maxLength) + '...';
    }

    formatContent(content) {
        if (!content) return '';
        return content.split('\n').map(paragraph => 
            paragraph.trim() ? `<p>${this.escapeHtml(paragraph)}</p>` : ''
        ).join('');
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async createPost(title, content) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in to create posts');

            const { data: profile } = await this.supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            const { data, error } = await this.supabase
                .from('blog_posts')
                .insert([
                    {
                        title,
                        content,
                        author_id: profile.id
                    }
                ]);

            if (error) throw error;
            await this.loadPosts();
            return data;
        } catch (error) {
            console.error('BlogManager: Error creating post:', error);
            throw error;
        }
    }

    async updatePost(postId, title, content) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in to update posts');

            const { data: profile } = await this.supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            const { data, error } = await this.supabase
                .from('blog_posts')
                .update({
                    title,
                    content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', postId)
                .eq('author_id', profile.id);

            if (error) throw error;
            await this.loadPosts();
            return data;
        } catch (error) {
            console.error('BlogManager: Error updating post:', error);
            throw error;
        }
    }

    async deletePost(postId) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in to delete posts');

            const { data: profile } = await this.supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            const { error } = await this.supabase
                .from('blog_posts')
                .delete()
                .eq('id', postId)
                .eq('author_id', profile.id);

            if (error) throw error;
            await this.loadPosts();
        } catch (error) {
            console.error('BlogManager: Error deleting post:', error);
            throw error;
        }
    }
}

// Initialize BlogManager when the DOM is loaded and Supabase is ready
document.addEventListener('DOMContentLoaded', () => {
    const checkSupabase = async () => {
        try {
            if (window.getSupabase) {
                console.log("BlogManager: Initializing...");
                const supabase = await window.getSupabase();
                console.log("BlogManager: Got Supabase client");
                window.blogManager = new BlogManager(supabase);
                console.log("BlogManager: Created instance");
            } else {
                console.log("BlogManager: Waiting for Supabase...");
                setTimeout(checkSupabase, 100);
            }
        } catch (error) {
            console.error('Error initializing BlogManager:', error);
        }
    };
    checkSupabase();
});
