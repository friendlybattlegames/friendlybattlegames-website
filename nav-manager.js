// Simple nav manager module
class NavManager {
    constructor() {
        try {
            // Ensure supabase is available
            if (!window.supabase) {
                throw new Error('Supabase client (window.supabase) not found. Ensure supabase-init.js loads and initializes first.');
            }
            this.supabase = window.supabase;
            this.initAuthListener();
            // No initial setupNav call here; let the auth listener handle it.
        } catch (error) {
            console.error('Error initializing NavManager:', error.message || error);
        }
    }

    async initAuthListener() {
        try {
            // Ensure supabase and auth are ready before setting up listener
            if (!this.supabase || !this.supabase.auth) {
                console.warn('Supabase auth not ready when initAuthListener called. Retrying shortly...');
                // Optionally, implement a retry mechanism or wait
                await new Promise(resolve => setTimeout(resolve, 500)); // Simple wait
                if (!this.supabase || !this.supabase.auth) {
                    throw new Error('Supabase auth still not ready after delay.');
                }
            }
            
            console.log('NavManager: Setting up auth state listener...');
            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log(`NavManager: Auth event: ${event}, Session found:`, !!session);
                await this.setupNav(session);
            });

            // Also, attempt an initial setup based on the current session immediately
            // This handles cases where the listener might fire late or the session is already established
            console.log('NavManager: Performing initial session check for setupNav...');
            const { data: { session: currentSession }, error: sessionError } = await this.supabase.auth.getSession();
            if (sessionError) {
                console.error('NavManager: Error getting initial session:', sessionError);
            } else {
                await this.setupNav(currentSession);
            }

        } catch (error) {
            console.error('Error in initAuthListener:', error);
        }
    }

    async setupNav(session) {
        try {
            const userSection = document.getElementById('user-section');
            const authButtons = document.getElementById('auth-buttons');
            const signoutBtn = document.getElementById('dropdown-signout');
            const navLinks = document.querySelector('.nav-links');
            
            if (!userSection || !authButtons) {
                console.warn('NavManager: Navigation elements (user-section/auth-buttons) not found in the DOM. Cannot update auth UI.');
                return;
            }
            console.log('NavManager: Running setupNav. Session:', session ? `User ID: ${session.user.id}` : 'null');

            if (session) {
                // User is logged in
                userSection.style.display = 'flex';
                authButtons.style.display = 'none';

                try {
                    console.log(`NavManager: Fetching profile for user ${session.user.id}...`);
                    // Get user profile
                    const { data: profile, error } = await this.supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        // Log error but don't necessarily stop; use defaults
                        console.warn(`NavManager: Error fetching profile for user ${session.user.id}:`, error.message);
                        // Could be a new user without a profile yet
                        if (error.code === 'PGRST116') { // Resource Not Found
                            console.log('NavManager: Profile not found, likely a new user.');
                        }                       
                    }

                    // Use profile data or defaults
                    const defaultAvatar = 'https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png'; // Define default avatar URL
                    const avatarUrl = profile?.avatar_url || defaultAvatar;
                    // Use email part as username if profile/username is missing
                    const username = profile?.username || session.user.email?.split('@')[0] || 'User'; 

                    console.log(`NavManager: Using Avatar: ${avatarUrl}, Username: ${username}`);

                    // Update avatar image
                    const userAvatar = document.getElementById('nav-avatar'); 
                    if (userAvatar) {
                        userAvatar.src = avatarUrl;
                        userAvatar.alt = `${username}'s avatar`; // Set alt text
                        userAvatar.dataset.userId = session.user.id; // Add data-user-id attribute
                        // Add error handler for broken images
                        userAvatar.onerror = () => { 
                            console.warn(`NavManager: Failed to load avatar image from ${avatarUrl}. Using default.`);
                            userAvatar.src = defaultAvatar; 
                        };
                    } else {
                        console.warn('NavManager: Avatar element (#nav-avatar) not found.');
                    }

                    // Update username display
                    const usernameElement = userSection.querySelector('.username');
                    if (usernameElement) {
                        usernameElement.textContent = username;
                    } else {
                        console.warn('NavManager: Username display element (.username) not found.');
                    }

                    // Store username in localStorage for arcade use (if still needed)
                    localStorage.setItem('username', username);
                    console.log(`NavManager: Stored username '${username}' in localStorage.`);

                    // Setup Sign Out button
                    if (signoutBtn) {
                        // Remove previous listeners to avoid duplicates if setupNav runs multiple times
                        signoutBtn.replaceWith(signoutBtn.cloneNode(true));
                        const newSignoutBtn = document.getElementById('dropdown-signout'); // Get the new clone
                        if(newSignoutBtn) {
                             newSignoutBtn.addEventListener('click', async (e) => {
                                e.preventDefault();
                                console.log('NavManager: Sign out clicked.');
                                const { error: signOutError } = await this.supabase.auth.signOut();
                                if (signOutError) {
                                    console.error('NavManager: Error signing out:', signOutError);
                                    alert('Error signing out: ' + signOutError.message);
                                } else {
                                    console.log('NavManager: Sign out successful. Redirecting to home.');
                                    // Redirect or update UI - auth listener should handle UI update
                                     window.location.href = 'index.html'; // Force redirect to ensure clean state
                                }
                            });
                        } else {
                             console.warn('NavManager: Could not re-attach listener to cloned signout button.');
                        }
                    } else {
                         console.warn('NavManager: Signout button (#dropdown-signout) not found.');
                    }

                } catch (profileError) {
                    console.error('NavManager: Error during profile processing or UI update:', profileError);
                    // Attempt to show generic logged-in state even if profile fails
                    userSection.style.display = 'flex';
                    authButtons.style.display = 'none'; 
                }
            } else {
                // User is not logged in
                console.log('NavManager: No active session, showing login/signup buttons.');
                userSection.style.display = 'none';
                authButtons.style.display = 'flex';
                 localStorage.removeItem('username'); // Clear username on logout
            }

            // Update navigation links active state
            if (navLinks) {
                const currentPage = window.location.pathname.split('/').pop() || 'index.html';
                console.log(`NavManager: Updating active link for page: ${currentPage}`);
                navLinks.querySelectorAll('a').forEach(link => {
                    const linkHref = link.getAttribute('href')?.split('/').pop();
                    if (linkHref === currentPage) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            } else {
                 console.warn('NavManager: Navigation links container (.nav-links) not found.');
            }

        } catch (error) {
            console.error('NavManager: Error in setupNav function:', error);
        }
    }
}

// Initialize nav manager AFTER the navigation HTML has been loaded
document.addEventListener('navLoaded', () => {
    console.log('NavManager: navLoaded event received.');
    // Now that nav HTML is loaded, ensure Supabase is ready before initializing NavManager
    const checkSupabase = setInterval(() => {
        if (window.supabase && window.supabase.auth) {
            clearInterval(checkSupabase);
            console.log('NavManager: Supabase ready, creating NavManager instance.');
            window.navManager = new NavManager();
        } else {
            console.log('NavManager: Waiting for Supabase to be ready...');
        }
    }, 100); // Check every 100ms

    // Timeout after a few seconds to prevent infinite loops
    setTimeout(() => {
        if (!window.navManager) {
            clearInterval(checkSupabase);
            console.error('NavManager initialization timed out. Supabase might not have been ready after nav loaded.');
        }
    }, 5000); // 5 second timeout
});

document.addEventListener('navLoadError', () => {
    console.error('NavManager: navLoadError event received. Navigation template failed to load. NavManager will not initialize.');
});
