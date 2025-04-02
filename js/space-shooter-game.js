let gameCanvas;
let gameContext;
let ship;
let bullets = [];
let enemies = [];
let score = 0;
let gameLoop;
let gameStarted = false;
let supabaseClient;

async function initSpaceShooter() {
    if (gameStarted) return;
    
    try {
        // Get Supabase client
        supabaseClient = await window.getSupabase();
    } catch (error) {
        console.error('Error getting Supabase client:', error);
        return;
    }
    
    // Create canvas
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center;';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close Game';
    closeButton.style.cssText = 'position: absolute; top: 20px; right: 20px; padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;';
    closeButton.onclick = () => {
        clearInterval(gameLoop);
        gameStarted = false;
        document.removeEventListener('keydown', handleKeyPress);
        document.removeEventListener('keyup', handleKeyRelease);
        document.body.removeChild(gameContainer);
    };
    
    gameCanvas = document.createElement('canvas');
    gameCanvas.width = 800;
    gameCanvas.height = 600;
    gameCanvas.style.border = '2px solid white';
    
    gameContainer.appendChild(closeButton);
    gameContainer.appendChild(gameCanvas);
    document.body.appendChild(gameContainer);
    
    gameContext = gameCanvas.getContext('2d');
    
    // Initialize ship
    ship = {
        x: gameCanvas.width / 2,
        y: gameCanvas.height - 50,
        width: 40,
        height: 40,
        speed: 5
    };
    
    // Reset game state
    bullets = [];
    enemies = [];
    score = 0;
    
    // Start game loop
    gameStarted = true;
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
    gameLoop = setInterval(update, 1000/60);
}

function update() {
    // Clear canvas
    gameContext.fillStyle = 'black';
    gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Update ship
    if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
    if (keys.ArrowRight && ship.x < gameCanvas.width - ship.width) ship.x += ship.speed;
    
    // Draw ship
    gameContext.fillStyle = 'white';
    gameContext.fillRect(ship.x, ship.y, ship.width, ship.height);
    
    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 10;
        gameContext.fillStyle = 'yellow';
        gameContext.fillRect(bullets[i].x, bullets[i].y, 5, 10);
        
        // Remove bullets that are off screen
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }
    
    // Spawn enemies
    if (Math.random() < 0.02) {
        enemies.push({
            x: Math.random() * (gameCanvas.width - 30),
            y: -30,
            width: 30,
            height: 30
        });
    }
    
    // Update and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += 3;
        gameContext.fillStyle = 'red';
        gameContext.fillRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);
        
        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[j], enemies[i])) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score += 10;
                break;
            }
        }
        
        // Check collision with ship
        if (enemies[i] && checkCollision(ship, enemies[i])) {
            endGame();
            return;
        }
        
        // Remove enemies that are off screen
        if (enemies[i] && enemies[i].y > gameCanvas.height) {
            enemies.splice(i, 1);
        }
    }
    
    // Draw score
    gameContext.fillStyle = 'white';
    gameContext.font = '20px Arial';
    gameContext.fillText('Score: ' + score, 10, 30);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + (rect1.width || 5) > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + (rect1.height || 10) > rect2.y;
}

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

function handleKeyPress(event) {
    if (event.code in keys) {
        keys[event.code] = true;
        if (event.code === 'Space') {
            shoot();
        }
        event.preventDefault();
    }
}

function handleKeyRelease(event) {
    if (event.code in keys) {
        keys[event.code] = false;
        event.preventDefault();
    }
}

function shoot() {
    bullets.push({
        x: ship.x + ship.width/2 - 2.5,
        y: ship.y
    });
}

async function endGame() {
    if (!gameStarted) return;
    
    // Stop game loop
    clearInterval(gameLoop);
    gameStarted = false;
    
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyPress);
    document.removeEventListener('keyup', handleKeyRelease);
    
    // Save score if it's higher than current high score
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            try {
                const { data: currentScore } = await supabaseClient
                    .from('leaderboard')
                    .select('score')
                    .eq('user_id', user.id)
                    .eq('game_name', 'space-shooter')
                    .maybeSingle();
                
                // If no score exists or new score is higher, save it
                if (!currentScore || score > currentScore.score) {
                    const { error } = await supabaseClient
                        .from('leaderboard')
                        .upsert({
                            user_id: user.id,
                            game_name: 'space-shooter',
                            score: score
                        });
                    
                    if (error) console.error('Error saving score:', error);
                }
            } catch (error) {
                console.error('Error checking current score:', error);
            }
        }
    } catch (error) {
        console.error('Error handling game end:', error);
    }
    
    // Remove game container if it exists
    try {
        const container = document.getElementById('game-container');
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
            
            // Try to reload leaderboards
            if (typeof window.loadLeaderboards === 'function') {
                await window.loadLeaderboards();
            }
        }
    } catch (error) {
        console.error('Error removing game container:', error);
    }
}

// Make the init function available globally
window.initSpaceShooter = initSpaceShooter;
