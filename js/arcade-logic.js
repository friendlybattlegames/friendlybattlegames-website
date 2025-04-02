document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get Supabase client
        const supabase = await window.getSupabase();
        console.log("Arcade: Supabase ready");

        // Load leaderboards first - this works for both authenticated and non-authenticated users
        await loadLeaderboards(supabase);

        // Then check auth state and enable/disable game buttons
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Error getting session:', sessionError);
            return;
        }

        // Enable/disable game buttons based on auth state
        const playButtons = document.querySelectorAll('.play-button');
        if (session?.user) {
            // User is authenticated, enable play buttons
            playButtons.forEach(button => {
                button.disabled = false;
                button.addEventListener('click', handleGameStart);
            });

            // Load high scores
            await loadHighScores(supabase, session.user.id);
        } else {
            // User is not authenticated, keep buttons disabled and show login message
            playButtons.forEach(button => {
                button.disabled = true;
                button.textContent = 'Login to Play';
                button.addEventListener('click', () => {
                    window.location.href = 'login.html';
                });
            });
        }

        // Set up auth state change listener
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // Re-enable play buttons
                playButtons.forEach(button => {
                    button.disabled = false;
                    button.textContent = 'Play';
                    button.addEventListener('click', handleGameStart);
                });
                // Load high scores
                await loadHighScores(supabase, session.user.id);
            } else if (event === 'SIGNED_OUT') {
                // Disable play buttons
                playButtons.forEach(button => {
                    button.disabled = true;
                    button.textContent = 'Login to Play';
                    button.addEventListener('click', () => {
                        window.location.href = 'login.html';
                    });
                });
            }
        });

        // Function to show game container
        function showGameContainer(gameId) {
            const gameContainer = document.getElementById('game-container');
            const gameCanvas = document.getElementById('game-canvas');
            const gameControlsOverlay = document.querySelector('.game-controls-overlay');
            const mobileControls = document.querySelector('.mobile-controls');
            
            if (!gameContainer || !gameCanvas) return;

            // Show game container
            gameContainer.style.display = 'flex';
            gameContainer.classList.add('active');

            // Show mobile controls
            if (gameControlsOverlay && mobileControls) {
                gameControlsOverlay.style.display = 'block';
                mobileControls.style.display = 'flex';
            }

            // Set up close button
            const closeButton = document.getElementById('close-game');
            if (closeButton) {
                closeButton.onclick = () => {
                    gameContainer.style.display = 'none';
                    gameContainer.classList.remove('active');
                    if (gameControlsOverlay && mobileControls) {
                        gameControlsOverlay.style.display = 'none';
                        mobileControls.style.display = 'none';
                    }
                    // Additional cleanup if needed
                };
            }

            // Initialize the game based on gameId
            switch (gameId) {
                case 'space-shooter':
                    // Initialize space shooter game
                    break;
                case 'snake':
                    // Initialize snake game
                    break;
                case 'memory':
                    // Initialize memory game
                    break;
            }
        }

        // Initialize mobile controls
        const gameControlsOverlay = document.querySelector('.game-controls-overlay');
        const mobileControls = document.querySelector('.mobile-controls');
        
        if (gameControlsOverlay && mobileControls) {
            // Force initial display properties
            gameControlsOverlay.style.cssText = 'display: block !important; z-index: 1010;';
            mobileControls.style.cssText = 'display: flex !important;';
            
            // Add debug outlines
            gameControlsOverlay.style.border = '2px solid red';
            mobileControls.style.border = '2px solid blue';
            
            console.log('Mobile controls initialized');
            console.log('Overlay display:', getComputedStyle(gameControlsOverlay).display);
            console.log('Controls display:', getComputedStyle(mobileControls).display);
        } else {
            console.error('Mobile controls elements not found');
        }
    } catch (error) {
        console.error('Error initializing arcade:', error);
    }
});

async function loadHighScores(supabase, userId) {
    try {
        const gameTypes = ['space-shooter', 'snake', 'memory'];
        
        for (const game of gameTypes) {
            const { data: scores, error } = await supabase
                .from('leaderboard')
                .select('score')
                .eq('user_id', userId)
                .eq('game_name', game)
                .order('score', { ascending: false })
                .limit(1);

            if (error) {
                console.error(`Error loading ${game} scores:`, error);
                continue;
            }

            // Update score display
            const scoreElement = document.getElementById(`${game}-high-score`);
            if (scoreElement) {
                scoreElement.textContent = scores && scores[0] ? scores[0].score : '0';
            }
        }
    } catch (error) {
        console.error('Error loading high scores:', error);
    }
}

async function loadLeaderboards(supabase) {
    try {
        const gameTypes = ['space-shooter', 'snake', 'memory'];
        
        for (const game of gameTypes) {
            // Get the leaderboard scores with user profiles
            const { data: scores, error } = await supabase
                .from('leaderboard')
                .select(`
                    *,
                    profiles (
                        username,
                        avatar_url
                    )
                `)
                .eq('game_name', game)
                .order('score', { ascending: false })
                .limit(5);

            if (error) {
                console.error(`Error loading ${game} leaderboard:`, error);
                continue;
            }

            // Get current user for comparison
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            const leaderboardElement = document.getElementById(`${game}-leaderboard`);
            if (leaderboardElement) {
                if (scores && scores.length > 0) {
                    const leaderboardHtml = scores.map((score, index) => {
                        const isCurrentUser = score.user_id === currentUserId;
                        const profile = score.profiles || {};
                        const username = profile.username || (isCurrentUser ? 'You' : `Player ${index + 1}`);
                        const avatarUrl = profile.avatar_url || 'images/default-avatar.png';
                        
                        return `
                            <div class="leaderboard-entry${isCurrentUser ? ' current-user' : ''}">
                                <span class="rank">#${index + 1}</span>
                                <img src="${avatarUrl}" alt="${username}'s avatar" class="avatar">
                                <span class="username">${username}</span>
                                <span class="score">${score.score}</span>
                            </div>
                        `;
                    }).join('');
                    leaderboardElement.innerHTML = leaderboardHtml;
                } else {
                    leaderboardElement.innerHTML = '<div class="no-scores">No scores yet</div>';
                }
            }
        }
    } catch (error) {
        console.error('Error loading leaderboards:', error);
    }
}

// Make loadLeaderboards available globally for the game to call
window.loadLeaderboards = async () => {
    const supabase = await window.getSupabase();
    return loadLeaderboards(supabase);
};

async function handleGameStart(event) {
    const gameType = event.target.dataset.game;
    // Initialize the game based on type
    switch (gameType) {
        case 'space-shooter':
            if (window.initSpaceShooter) {
                window.initSpaceShooter();
            } else {
                console.error('Space Shooter game not loaded');
            }
            break;
        case 'snake':
            if (window.initSnakeGame) {
                window.initSnakeGame();
            } else {
                console.error('Snake game not loaded');
            }
            break;
        case 'memory':
            if (window.initMemoryGame) {
                window.initMemoryGame();
            } else {
                console.error('Memory game not loaded');
            }
            break;
    }
}
