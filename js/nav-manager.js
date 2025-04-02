class NavManager {
    constructor(supabase) {
        this.supabase = supabase;
        this.setupAuthListener();
        console.log('NavManager: Setting up auth state listener...');
    }

    async setupAuthListener() {
        // Initial session check
        const { data: { session } } = await this.supabase.auth.getSession();
        console.log('NavManager: Initial session check:', session);
        this.setupNav(session);

        // Listen for auth state changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('NavManager: Auth event:', event, 'Session:', session);
            this.setupNav(session);
        });
    }

    async setupNav(session) {
        console.log('NavManager: Running setupNav. Session:', session);
        const userSection = document.getElementById('user-section');
        const authButtons = document.getElementById('auth-buttons');
        const avatar = document.getElementById('nav-avatar');
        const usernameSpan = document.querySelector('.username');

        // If elements don't exist, return early
        if (!userSection || !authButtons) return;

        if (session && session.user) {
            console.log('NavManager: User is authenticated:', session.user);

            // Get user profile
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('NavManager: Error fetching profile:', error);
            } else {
                console.log('NavManager: Found user profile:', profile);
                if (profile.avatar_url && avatar) {
                    avatar.src = profile.avatar_url;
                }
                if (profile.username && usernameSpan) {
                    usernameSpan.textContent = profile.username;
                } else if (usernameSpan) {
                    usernameSpan.textContent = session.user.email.split('@')[0];
                }
            }

            userSection.style.display = 'block';
            authButtons.style.display = 'none';
        } else {
            userSection.style.display = 'none';
            authButtons.style.display = 'flex';
        }

        // Update navigation links based on auth state
        console.log('NavManager: Updating nav links. Is authenticated:', !!session);
        this.updateNavLinks(!!session);
        this.updateActiveLink();
        this.updateDropdownActiveLink();
    }

    updateNavLinks(isAuthenticated) {
        const authRequiredLinks = document.querySelectorAll('a[data-auth-required="true"]');
        authRequiredLinks.forEach(link => {
            if (isAuthenticated) {
                link.classList.remove('auth-required');
                link.removeAttribute('title');
            } else {
                link.classList.add('auth-required');
                link.setAttribute('title', 'Sign in required');
            }
        });
    }

    updateActiveLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        console.log('NavManager: Updating active link for page:', currentPage);
        
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    updateDropdownActiveLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        console.log('NavManager: Updating dropdown active link for page:', currentPage);
        
        const dropdownLinks = document.querySelectorAll('.dropdown-content a');
        dropdownLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Handle sign out functionality
document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'dropdown-signout') {
        e.preventDefault();
        try {
            const supabase = await window.getSupabase();
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error.message);
            } else {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error signing out:', error.message);
        }
    }
});

async function checkSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }
    try {
        const supabase = await window.getSupabase();
        new NavManager(supabase);
    } catch (error) {
        console.error('Error initializing NavManager:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkSupabase();
});
