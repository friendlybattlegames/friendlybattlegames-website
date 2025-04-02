// js/auth-manager.js
import { supabase } from './supabase-config.js';

// Initialize Supabase client
let supabaseClient = supabase;

const initAuth = async () => {
    try {
        // Update UI when auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            await updateAuthUI();
        });

        // Initial UI update
        await updateAuthUI();
    } catch (error) {
        console.error('Error initializing auth:', error);
    }
};

const updateAuthUI = async () => {
    const authSection = document.getElementById('authSection');
    if (!authSection) {
        return; // No auth section on this page
    }

    const guestButtons = authSection.querySelector('.guest-buttons');
    const profileSection = authSection.querySelector('.profile-section');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileUsername = document.getElementById('profileUsername');
    const signOutButton = document.getElementById('signOutButton');

    if (!guestButtons || !profileSection) {
        console.error('Required auth elements (.guest-buttons or .profile-section) not found within #authSection.');
        return;
    }

    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
            console.error('Error getting session:', sessionError);
            // Show guest view as fallback
            guestButtons.style.display = 'flex';
            profileSection.style.display = 'none';
            return;
        }

        if (session?.user) {
            // User is logged in
            guestButtons.style.display = 'none';
            profileSection.style.display = 'flex';

            // Fetch profile data
            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError);
            } else {
                if (profileAvatar) {
                    profileAvatar.src = profile?.avatar_url || 'images/default-avatar.png';
                }
                if (profileUsername) {
                    profileUsername.textContent = profile?.username || session.user.email;
                }
            }

            // Add sign out handler
            if (signOutButton) {
                signOutButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    console.log('Signing out...');
                    const { error } = await supabaseClient.auth.signOut();
                    if (error) {
                        console.error('Error signing out:', error);
                        alert('Sign out failed: ' + error.message);
                    } else {
                        window.location.href = '/';
                    }
                });
            }
        } else {
            // No user logged in
            guestButtons.style.display = 'flex';
            profileSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error in updateAuthUI:', error);
        // Show guest view as fallback
        guestButtons.style.display = 'flex';
        profileSection.style.display = 'none';
    }
};

// Handle login form submission
const handleLogin = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginButton = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('error-message');

    try {
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
        errorMessage.textContent = '';

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Get redirect URL from query params or default to home
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirect') || 'dashboard.html';
        window.location.href = redirectTo;
    } catch (error) {
        console.error('Error:', error.message);
        errorMessage.textContent = error.message;
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Log In';
    }
};

// Handle signup form submission
const handleSignup = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const signupButton = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('error-message');

    try {
        // Validate passwords match
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        signupButton.disabled = true;
        signupButton.textContent = 'Creating account...';
        errorMessage.textContent = '';

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        // Show success message and redirect
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error:', error.message);
        errorMessage.textContent = error.message;
    } finally {
        signupButton.disabled = false;
        signupButton.textContent = 'Sign Up';
    }
};

// Handle password reset request
const handlePasswordReset = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const resetButton = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    try {
        resetButton.disabled = true;
        resetButton.textContent = 'Sending reset link...';
        errorMessage.textContent = '';
        successMessage.textContent = '';

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) throw error;

        // Show success message
        successMessage.textContent = 'Password reset link sent! Please check your email.';
    } catch (error) {
        console.error('Error:', error.message);
        errorMessage.textContent = error.message;
    } finally {
        resetButton.disabled = false;
        resetButton.textContent = 'Send Reset Link';
    }
};

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);

// Export functions for use in HTML
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handlePasswordReset = handlePasswordReset;
