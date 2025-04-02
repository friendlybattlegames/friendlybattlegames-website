// Initialize games in the database
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for Supabase initialization
        const supabaseClient = await window.getSupabase();
        console.log("Games: Supabase ready");

        // Check if games exist
        const { data: existingGames, error: checkError } = await supabaseClient
            .from('games')
            .select('*');

        if (checkError) {
            console.error('Error checking games:', checkError);
            return;
        }

        // Only initialize if no games exist
        if (!existingGames || existingGames.length === 0) {
            const initialGames = [
                {
                    game_name: 'space-shooter',
                    title: 'Space Shooter',
                    description: 'Classic space shooting game'
                },
                {
                    game_name: 'snake',
                    title: 'Snake Game',
                    description: 'Classic snake game'
                },
                {
                    game_name: 'memory',
                    title: 'Memory Game',
                    description: 'Test your memory skills'
                }
            ];

            const { error } = await supabaseClient
                .from('games')
                .upsert(initialGames);

            if (error) {
                console.error('Error initializing games:', error);
            } else {
                console.log('Games initialized successfully');
            }
        }
    } catch (error) {
        console.error('Error in games initialization:', error);
    }
});
