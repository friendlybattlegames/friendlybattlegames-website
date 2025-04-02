// auth-guard.js

// Function to check authentication and redirect if necessary
async function checkAuthAndRedirect() {
    // Ensure Supabase client is available
    if (!window.supabaseClient) {
        console.error("Supabase client not initialized yet.");
        // Optionally, wait or retry. For now, we'll log an error.
        // If Supabase initialization consistently fails before this runs,
        // consider delaying this check or using a different event.
        return;
    }

    try {
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

        if (sessionError) {
            console.error("Error getting Supabase session:", sessionError);
            // Decide how to handle session errors, e.g., redirect to signin
            // window.location.href = 'signin.html';
            return;
        }

        // List of pages that require authentication (relative paths from root)
        const protectedPaths = [
            '/blog.html',
            '/arcade.html',
            '/dashboard.html',
            '/shop.html'
        ];

        // Get the current path
        const currentPath = window.location.pathname;

        // Check if the current path is one of the protected paths
        const isProtectedPage = protectedPaths.some(path => currentPath.endsWith(path));

        if (isProtectedPage && !session) {
            console.log('User not authenticated. Redirecting to signin page.');
            // Store the intended destination to redirect back after login
            sessionStorage.setItem('redirectAfterLogin', currentPath);
            // Redirect to the sign-in page
            window.location.href = 'signin.html';
        }
    } catch (error) {
        console.error('Error during authentication check:', error);
        // Handle unexpected errors, perhaps redirect to a generic error page or signin
        // window.location.href = 'signin.html';
    }
}

// Run the check. Using 'DOMContentLoaded' might be too early if supabase-init.js is deferred
// or loads asynchronously relative to this script. 'load' ensures all resources including
// potentially deferred scripts like supabase-init.js are loaded.
// However, putting this script tag *after* supabase-init.js and using defer might allow
// DOMContentLoaded. Let's try load first for safety.

window.addEventListener('load', checkAuthAndRedirect);
