// Game configuration
const GAMES = {
    'space-shooter': {
        title: 'Space Shooter',
        description: 'Classic space shooting game',
        minScore: 100,
        highScoreId: 'space-shooter-high-score',
        leaderboardId: 'space-shooter-leaderboard'
    },
    'snake': {
        title: 'Snake',
        description: 'Classic snake game',
        minScore: 10,
        highScoreId: 'snake-high-score',
        leaderboardId: 'snake-leaderboard'
    },
    'memory': {
        title: 'Memory',
        description: 'Memory matching game',
        minScore: 50,
        highScoreId: 'memory-high-score',
        leaderboardId: 'memory-leaderboard'
    }
};

// Global variables
let userHighScores = {}; // Store user's high scores { gameName: score }
let leaderboardData = {}; // Global variable to store leaderboard data

// Helper functions for game data
async function loadLeaderboard(gameName) {
    console.log('Loading leaderboard for game:', gameName);
    try {
        // Check if Supabase is initialized
        if (!window.supabase) {
            console.error('Supabase client not initialized');
            return;
        }

        // If no gameName, load all games' leaderboards
        if (!gameName) {
            const { data: leaderboardEntries, error } = await window.supabase
                .from('leaderboard_with_profiles')
                .select('*')
                .order('score', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error loading leaderboards:', error);
                return;
            }

            // Process data into game-specific leaderboards
            leaderboardData = leaderboardEntries.reduce((acc, entry) => {
                if (!acc[entry.game_name]) {
                    acc[entry.game_name] = [];
                }
                acc[entry.game_name].push(entry);
                return acc;
            }, {});

            return;
        }

        // Query the leaderboard with game info and user profiles
        const { data: entries, error: leaderboardError } = await window.supabase
            .from('leaderboard_with_profiles')
            .select('*')
            .eq('game_name', gameName)
            .order('score', { ascending: false })
            .limit(10);

        if (leaderboardError) {
            console.error('Error loading leaderboard:', leaderboardError);
            return;
        }

        // Store the leaderboard data for this game
        leaderboardData[gameName] = entries;

        // Update the DOM with leaderboard data
        const leaderboardContainer = document.getElementById('leaderboard');
        if (!leaderboardContainer) {
            console.warn('No leaderboard container found');
            return;
        }

        leaderboardContainer.innerHTML = '';

        if (!leaderboardData[gameName] || leaderboardData[gameName].length === 0) {
            leaderboardContainer.innerHTML = '<p class="no-scores">No scores yet. Be the first to play!</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'leaderboard-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Date</th>
            </tr>
        `;
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        leaderboardData[gameName].forEach((entry, index) => {
            const tr = document.createElement('tr');
            const scoreDate = new Date(entry.played_at).toLocaleDateString();
            tr.innerHTML = `
                <td class="rank">#${index + 1}</td>
                <td>
                    <div class="player-info">
                        <img src="${entry.avatar_url || 'default-avatar.png'}" alt="Avatar" class="avatar-small">
                        <span>${entry.username || 'Anonymous'}</span>
                    </div>
                </td>
                <td class="score">${entry.score}</td>
                <td>${scoreDate}</td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        leaderboardContainer.appendChild(table);

    } catch (error) {
        console.error('Error in loadLeaderboard:', error);
    }
}

async function updateHighScores() {
    if (!window.supabase) {
        console.error('updateHighScores: Supabase not ready.');
        return;
    }
    try {
        console.log('ArcadeLogic: Updating high scores display...');
        // Update scores for each game card
        Object.keys(GAMES).forEach(gameName => {
            const highScoreElement = document.querySelector(`#${GAMES[gameName].highScoreId}`);
            if (highScoreElement) {
                const userBest = userHighScores[gameName] || 0;
                highScoreElement.textContent = `Your Best Score: ${userBest}`;
            }

            // Update leaderboard if it exists
            const leaderboardElement = document.querySelector(`#${GAMES[gameName].leaderboardId}`);
            if (leaderboardElement && leaderboardData[gameName]) {
                leaderboardElement.innerHTML = `
                    <h3>Top Scores</h3>
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaderboardData[gameName].map((entry, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>
                                        ${entry.avatar_url ? `<img src="${entry.avatar_url}" class="avatar-tiny" alt="">` : ''}
                                        ${entry.username || 'Anonymous'}
                                    </td>
                                    <td>${entry.score}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        });
        console.log('ArcadeLogic: High scores display updated (if elements found).');
    } catch (error) {
        console.error('Error updating high scores:', error);
    }
}

async function loadUserHighScores(user) {
    if (!user) {
        console.error('ArcadeLogic: No user provided to loadUserHighScores');
        return;
    }
    console.log(`ArcadeLogic: Loading high scores for user ${user.id}...`);
    const { data: leaderboardEntries, error } = await window.supabase
        .from('leaderboard_with_profiles')
        .select('game_name, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false });

    if (error) {
        console.error('Error loading user high scores:', error);
        userHighScores = {};
    } else {
        // Process data to find the highest score for each game
        userHighScores = leaderboardEntries.reduce((acc, entry) => {
            // Only update if this score is higher than the existing one
            if (!acc[entry.game_name] || entry.score > acc[entry.game_name]) {
                acc[entry.game_name] = entry.score;
            }
            return acc;
        }, {});
    }
}

async function submitScore(score, gameName) {
    console.log('Submitting score:', score, 'for game:', gameName);
    try {
        if (!window.supabase) {
            console.error('Supabase client not initialized');
            return false;
        }

        const session = await window.supabase.auth.getSession();
        if (!session?.data?.session) {
            console.error('No active session');
            return false;
        }

        // Get the game details first
        const { data: gameData, error: gameError } = await window.supabase
            .from('games')
            .select('min_score')
            .eq('game_name', gameName)
            .single();

        if (gameError) {
            console.error('Error fetching game data:', gameError);
            return false;
        }

        // Check if score meets minimum requirement
        if (score < gameData.min_score) {
            console.log('Score does not meet minimum requirement:', gameData.min_score);
            return false;
        }

        // Insert the score
        const { error: insertError } = await window.supabase
            .from('leaderboard')
            .insert({
                game_name: gameName,
                user_id: session.data.session.user.id,
                score: score
            });

        if (insertError) {
            console.error('Error submitting score:', insertError);
            return false;
        }

        console.log('Score submitted successfully');
        return true;

    } catch (error) {
        console.error('Error in submitScore:', error);
        return false;
    }
}

async function updateLeaderboard(gameName) {
    console.log('Updating leaderboard for game:', gameName);
    
    try {
        if (!window.supabase) {
            console.error('Supabase client not initialized');
            return;
        }

        const { data: scores, error } = await window.supabase
            .from('leaderboard_with_profiles')
            .select('*')
            .eq('game_name', gameName)
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return;
        }

        console.log('Fetched leaderboard scores:', scores);

        const leaderboardElement = document.getElementById('leaderboard');
        if (!leaderboardElement) {
            console.error('Leaderboard element not found');
            return;
        }

        // Clear existing leaderboard
        leaderboardElement.innerHTML = `
            <h2>Top Scores</h2>
            <div class="leaderboard-list"></div>
        `;

        const leaderboardList = leaderboardElement.querySelector('.leaderboard-list');
        
        if (!scores || scores.length === 0) {
            leaderboardList.innerHTML = '<div class="no-scores">No scores yet. Be the first!</div>';
            return;
        }

        scores.forEach((entry, index) => {
            const scoreDate = new Date(entry.played_at).toLocaleDateString();
            const scoreElement = document.createElement('div');
            scoreElement.className = 'leaderboard-entry';
            scoreElement.innerHTML = `
                <div class="rank">#${index + 1}</div>
                <div class="player-info">
                    <img src="${entry.avatar_url || '/default-avatar.png'}" alt="Avatar" class="avatar-small">
                    <span class="username">${entry.username || 'Anonymous'}</span>
                </div>
                <div class="score-info">
                    <span class="score">${entry.score}</span>
                    <span class="date">${scoreDate}</span>
                </div>
            `;
            leaderboardList.appendChild(scoreElement);
        });
    } catch (error) {
        console.error('Error in updateLeaderboard:', error);
    }
}

function initGame(gameName) {
    const gameModal = document.getElementById('gameModal');
    const modalCanvas = document.getElementById('gameCanvas');
    const gameTitle = document.getElementById('gameTitle');
    const currentScore = document.getElementById('currentScore');
    
    if (!gameModal || !modalCanvas || !gameTitle || !currentScore) {
        console.error('Game modal elements not found');
        return;
    }

    // Stop any previously running game
    if (currentGame && typeof stopGame === 'function') {
        stopGame(currentGame);
    }

    // Check if the game exists in our GAMES object
    if (!GAMES[gameName]) {
        console.error(`Game ${gameName} not found in GAMES configuration`);
        return;
    }

    if (gameSetups[gameName]) {
        console.log(`Initializing game: ${gameName}`);
        currentGame = gameName;
        gameTitle.textContent = GAMES[gameName].title;
        currentScore.textContent = '0';
        
        // Set up modal
        gameModal.style.display = 'block';
        modalCanvas.width = 800;
        modalCanvas.height = 600;
        
        // Clear previous canvas content
        const ctx = modalCanvas.getContext('2d');
        ctx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);

        // Set up modal close button
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                gameModal.style.display = 'none';
                if (currentGame && typeof stopGame === 'function') {
                    stopGame(currentGame);
                }
            };
        }

        // Initialize the game
        gameSetups[gameName](modalCanvas);
        
        // Update leaderboard
        updateLeaderboard(gameName);
    } else {
        console.error(`No setup found for game: ${gameName}`);
    }
}

// Make functions available globally
window.submitScore = submitScore;
window.initGame = initGame;
window.updateLeaderboard = updateLeaderboard;
window.loadLeaderboard = loadLeaderboard;

// Define game setups
const gameSetups = {
    'space-shooter': (canvas) => {
        console.log('Initializing Space Shooter...', canvas);
        // Call the start function from space-shooter-game.js
        if (typeof startSpaceShooterModal === 'function') {
            startSpaceShooterModal(canvas);
        } else {
            console.error('Space Shooter game script not loaded or startSpaceShooterModal function not found.');
        }
    }
};

let currentGame = null;

// --- Initialization --- 

function initializeArcadeLogic() {
    if (!window.supabase) {
        console.error('initializeArcadeLogic: Supabase not ready.');
        return;
    }
    console.log('ArcadeLogic: Initializing page logic...');

    // Initial load of data
    loadLeaderboard().catch(error => {
        console.error('Error loading initial leaderboard:', error);
    });

    // Load user scores first, then update display
    window.supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
            console.log('ArcadeLogic: User session found, loading high scores...');
            loadUserHighScores(session.user).then(() => {
                updateHighScores();
                updatePlayButtonStates(session);
            });
        } else {
            console.log('ArcadeLogic: No user session, skipping high scores load');
            updateHighScores(); // Still update to show leaderboard
            updatePlayButtonStates(null);
        }
    });

    // Optional: Listen for auth changes if arcade features depend on login state beyond score submission
    window.supabase.auth.onAuthStateChange((event, session) => {
        console.log(`ArcadeLogic: Auth event - ${event}`);
        if (session && session.user) {
            console.log('ArcadeLogic: User logged in, loading high scores...');
            loadUserHighScores(session.user).then(() => {
                updateHighScores();
                updatePlayButtonStates(session);
            });
        } else {
            console.log('ArcadeLogic: User logged out, clearing high scores');
            userHighScores = {};
            updateHighScores(); // Update to show just leaderboard
            updatePlayButtonStates(null);
        }
    });
}

// --- Helper function to update button states based on session ---
async function updatePlayButtonStates(currentSession = null) {
    let session = currentSession;
    if (session === null) {
        const { data } = await window.supabase.auth.getSession();
        session = data.session;
    }

    const isLoggedIn = !!session;
    console.log(`ArcadeLogic: Updating play buttons. Logged in: ${isLoggedIn}`);

    document.querySelectorAll('.play-button').forEach(button => {
        // Remove any existing click listeners
        const oldButton = button.cloneNode(true);
        button.parentNode.replaceChild(oldButton, button);
        const newButton = oldButton; // Keep reference for clarity

        const gameName = newButton.getAttribute('data-game');
        if (!GAMES[gameName]) {
            console.error(`ArcadeLogic: Button found for unknown game: ${gameName}`);
            return;
        }

        if (isLoggedIn) {
            newButton.disabled = false;
            newButton.textContent = 'Play Now';
            newButton.title = ''; // Clear tooltip
            newButton.classList.remove('disabled:opacity-50', 'cursor-not-allowed'); // Ensure enabled styles
            // Add click handler for logged-in users
            newButton.addEventListener('click', () => {
                console.log('Play button clicked for game:', gameName); // DEBUG
                if (gameName) {
                    console.log('Initializing game:', gameName); // DEBUG
                    initGame(gameName);
                } else {
                    console.error('ArcadeLogic: Play button clicked with no data-game attribute.');
                }
            });
        } else {
            newButton.disabled = true;
            newButton.textContent = 'Login to Play';
            newButton.title = 'You must be logged in to play.';
            newButton.classList.add('disabled:opacity-50', 'cursor-not-allowed'); // Add disabled styles
            // No click listener added for disabled state
        }
    });
    
    if (isLoggedIn) {
        console.log('ArcadeLogic: Play button listeners attached for logged-in user.');
    } else {
        console.log('ArcadeLogic: Play buttons disabled for logged-out user.');
    }
}

// Wait for Supabase to be ready before initializing
const checkSupabaseInterval = setInterval(() => {
    if (window.supabase) {
        clearInterval(checkSupabaseInterval);
        console.log('ArcadeLogic: Supabase is ready. Initializing arcade...');
        initializeArcadeLogic();
    }
}, 100);

// Timeout
setTimeout(() => {
    if (!window.supabase) { // Check if it's still not ready
         clearInterval(checkSupabaseInterval);
        console.error('ArcadeLogic: Supabase initialization timed out.');
    }
}, 5000); // 5 second timeout

// Initialize arcade
window.supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        try {
            await loadUserHighScores(session.user);
            await loadLeaderboard(); // Load all leaderboards
            updateHighScores();
        } catch (error) {
            console.error('Error during auth state change:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing arcade logic...');
    
    // Wait for Supabase to be initialized
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!window.supabase && attempts < maxAttempts) {
        console.log('Waiting for Supabase initialization...');
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }

    if (!window.supabase) {
        console.error('Supabase failed to initialize after', maxAttempts, 'attempts');
        return;
    }

    console.log('Supabase initialized successfully');
    
    // Load all leaderboards initially
    try {
        await loadLeaderboard();
    } catch (error) {
        console.error('Error loading initial leaderboard:', error);
    }
});
