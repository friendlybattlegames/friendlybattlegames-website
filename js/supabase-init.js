// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create a promise that resolves when Supabase is ready
window.supabaseReady = new Promise((resolve) => {
    function initSupabase() {
        if (typeof supabase !== 'undefined') {
            window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
            resolve(window.supabase);
        } else {
            setTimeout(initSupabase, 100);
        }
    }
    initSupabase();
});

// Export the promise for other modules to use
window.getSupabase = async () => {
    return await window.supabaseReady;
};
