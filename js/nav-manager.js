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
                if (profile.avatar_url) {
                    avatar.src = profile.avatar_url;
                }
                if (profile.username) {
                    usernameSpan.textContent = profile.username;
                } else {
                    usernameSpan.textContent = session.user.email.split('@')[0];
                }
            }

            // Show user section, hide auth buttons
            if (userSection) userSection.style.display = 'block';
            if (authButtons) authButtons.style.display = 'none';
        } else {
            // Hide user section, show auth buttons
            if (userSection) userSection.style.display = 'none';
            if (authButtons) authButtons.style.display = 'flex';
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
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileNav = document.querySelector('.mobile-nav');
    const navLinks = document.querySelector('.nav-links');

    // Clone nav links for mobile menu
    if (navLinks && mobileNav) {
        mobileNav.innerHTML = navLinks.innerHTML;
    }

    // Toggle mobile menu
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            mobileMenuButton.setAttribute('aria-expanded', 
                mobileMenuButton.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
            );
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileNav && mobileNav.classList.contains('active') && 
            !mobileNav.contains(e.target) && 
            !mobileMenuButton.contains(e.target)) {
            mobileNav.classList.remove('active');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    });

    // Close mobile menu when window is resized to desktop size
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    });

    const checkSupabase = async () => {
        try {
            if (window.getSupabase) {
                const supabase = await window.getSupabase();
                window.navManager = new NavManager(supabase);
            } else {
                setTimeout(checkSupabase, 100);
            }
        } catch (error) {
            console.error('Error initializing NavManager:', error);
        }
    };
    checkSupabase();

    // Handle sign out
    document.addEventListener('click', async (e) => {
        if (e.target && e.target.id === 'dropdown-signout') {
            e.preventDefault();
            const supabase = await window.getSupabase();
            const { error } = await supabase.auth.signOut();
            if (!error) {
                window.location.href = '/index.html';
            }
        }
    });
});
