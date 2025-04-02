document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize mobile controls
        initializeMobileControls();

        // Enable play buttons once authenticated
        const playButtons = document.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.disabled = false;
            button.addEventListener('click', () => {
                const gameId = button.getAttribute('data-game');
                if (gameId) {
                    showGameContainer(gameId);
                }
            });
        });

    } catch (error) {
        console.error('Error initializing arcade:', error);
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

    // Show mobile controls if in mobile view
    if (document.body.classList.contains('mobile-view')) {
        showMobileControls();
    }

    // Set up close button
    const closeButton = document.getElementById('close-game');
    if (closeButton) {
        closeButton.onclick = () => {
            gameContainer.style.display = 'none';
            gameContainer.classList.remove('active');
            hideMobileControls();
        };
    }

    // Initialize the game based on gameId
    switch (gameId) {
        case 'space-shooter':
            initSpaceShooterGame();
            break;
        case 'snake':
            initSnakeGame();
            break;
        case 'memory':
            initMemoryGame();
            break;
    }
}

// Initialize mobile controls
function initializeMobileControls() {
    const gameControlsOverlay = document.querySelector('.game-controls-overlay');
    const mobileControls = document.querySelector('.mobile-controls');
    
    if (!gameControlsOverlay || !mobileControls) {
        console.error('Mobile controls elements not found');
        return;
    }

    // Set up D-pad controls
    setupDpadControls();
    
    // Set up action button
    setupActionButton();

    // Show controls if in mobile view
    if (document.body.classList.contains('mobile-view')) {
        showMobileControls();
    }

    // Add view change listener
    document.body.addEventListener('classChange', () => {
        if (document.body.classList.contains('mobile-view')) {
            showMobileControls();
        } else {
            hideMobileControls();
        }
    });

    console.log('Mobile controls initialized');
}

// Set up D-pad controls
function setupDpadControls() {
    const keys = {
        'up-btn': 'ArrowUp',
        'left-btn': 'ArrowLeft',
        'right-btn': 'ArrowRight',
        'down-btn': 'ArrowDown'
    };

    Object.entries(keys).forEach(([btnId, key]) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        // Touch events
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            simulateKeyEvent('keydown', key);
            btn.style.transform = 'scale(0.9)';
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            simulateKeyEvent('keyup', key);
            btn.style.transform = 'scale(1)';
        }, { passive: false });

        // Mouse events for testing
        btn.addEventListener('mousedown', (e) => {
            simulateKeyEvent('keydown', key);
            btn.style.transform = 'scale(0.9)';
        });

        btn.addEventListener('mouseup', (e) => {
            simulateKeyEvent('keyup', key);
            btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('mouseleave', (e) => {
            simulateKeyEvent('keyup', key);
            btn.style.transform = 'scale(1)';
        });
    });
}

// Set up action button
function setupActionButton() {
    const actionBtn = document.getElementById('action-btn');
    if (!actionBtn) return;

    // Touch events
    actionBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        simulateKeyEvent('keydown', ' ');
        actionBtn.style.transform = 'scale(0.9)';
    }, { passive: false });

    actionBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        simulateKeyEvent('keyup', ' ');
        actionBtn.style.transform = 'scale(1)';
    }, { passive: false });

    // Mouse events for testing
    actionBtn.addEventListener('mousedown', (e) => {
        simulateKeyEvent('keydown', ' ');
        actionBtn.style.transform = 'scale(0.9)';
    });

    actionBtn.addEventListener('mouseup', (e) => {
        simulateKeyEvent('keyup', ' ');
        actionBtn.style.transform = 'scale(1)';
    });

    actionBtn.addEventListener('mouseleave', (e) => {
        simulateKeyEvent('keyup', ' ');
        actionBtn.style.transform = 'scale(1)';
    });
}

// Show mobile controls
function showMobileControls() {
    const gameControlsOverlay = document.querySelector('.game-controls-overlay');
    const mobileControls = document.querySelector('.mobile-controls');
    
    if (gameControlsOverlay && mobileControls) {
        gameControlsOverlay.style.display = 'block';
        mobileControls.style.display = 'flex';
        console.log('Showing mobile controls');
    }
}

// Hide mobile controls
function hideMobileControls() {
    const gameControlsOverlay = document.querySelector('.game-controls-overlay');
    const mobileControls = document.querySelector('.mobile-controls');
    
    if (gameControlsOverlay && mobileControls) {
        gameControlsOverlay.style.display = 'none';
        mobileControls.style.display = 'none';
        console.log('Hiding mobile controls');
    }
}

// Simulate keyboard events
function simulateKeyEvent(type, key) {
    const event = new KeyboardEvent(type, {
        key: key,
        code: key.length === 1 ? 'Space' : key,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
}

// Make loadLeaderboards available globally for the game to call
window.loadLeaderboards = async () => {
    const supabase = await window.getSupabase();
    return loadLeaderboards(supabase);
};

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
