class AuthCheck {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.init();
    }

    async init() {
        try {
            // Check if user is authenticated
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (!session) {
                // Get current page
                const currentPage = window.location.pathname.split('/').pop() || 'index.html';
                // Redirect to login with return URL
                window.location.href = `login.html?redirect=${currentPage}`;
            }
        } catch (error) {
            console.error('AuthCheck: Error checking auth state:', error);
            window.location.href = 'login.html';
        }
    }
}

// Initialize AuthCheck when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const supabaseClient = await window.getSupabase();
        new AuthCheck(supabaseClient);
    } catch (error) {
        console.error('Error initializing AuthCheck:', error);
        window.location.href = 'login.html';
    }
});
