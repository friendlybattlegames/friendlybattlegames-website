// Initialize leaderboard view and data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for Supabase initialization
        const supabaseClient = await window.getSupabase();

        // Create the leaderboard view
        const { error } = await supabaseClient.rpc('create_leaderboard_view');
        
        if (error) {
            console.error('Error creating leaderboard view:', error);
        } else {
            console.log('Leaderboard view created successfully');
        }
    } catch (error) {
        console.error('Error initializing leaderboard:', error);
    }
});
