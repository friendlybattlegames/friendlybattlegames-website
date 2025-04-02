// Wait for Supabase to be available
if (typeof supabase === 'undefined') {
    console.error('Supabase client not loaded');
}

// Supabase URL and Anon Key
const SUPABASE_URL = 'http://127.0.0.1:54321';  // Local development URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';  // Local development anon key

// Initialize Supabase client and assign to window.supabase
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true // Important for handling email confirmation links
            }
        });
        console.log('Supabase client initialized successfully.');
    } else {
        console.error('Supabase library object (supabase) not found. Ensure CDN script is loaded before this script.');
    }
} catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Optionally, set window.supabase to null or an error indicator object
    window.supabase = null;
}
