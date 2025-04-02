// Global game variables (can be organized better later)
let player;
let bullets = [];
let enemies = [];
let score = 0;
let highScore = 0;
let scoreElement; // To display the score
let highScoreElement;
let gameOver = false; // Game state flag
let isPaused = false;
let gameLoopInterval;
let ctx; // Canvas 2D context
let canvasElement; // Reference to the canvas element
let enemySpawnTimer;
let gameStartTime;
let gameTimeElement;
let lastShotTime = 0;
const ENEMY_SPAWN_RATE = 1500; // milliseconds (1.5 seconds)
const SHOT_COOLDOWN = 250; // Minimum time between shots in milliseconds
const GAME_ID = 1; // Space Shooter game ID in the database

// Bullet class
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 7;
        this.color = '#ff0';
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
    }

    isOffScreen() {
        return this.y < 0;
    }
}

// Player object
class Player {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width; // e.g., 50
        this.height = height; // e.g., 30
        this.color = color;
        this.speed = 5;
    }

    draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        // Simple triangle shape for the player ship
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }

    move(dx, dy) {
        // Basic boundary checks (adjust as needed)
        const nextX = this.x + dx * this.speed;
        const nextY = this.y + dy * this.speed;

        if (nextX >= 0 && nextX + this.width <= canvasElement.width) {
            this.x = nextX;
        }
        if (nextY >= 0 && nextY + this.height <= canvasElement.height) {
            this.y = nextY;
        }
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - lastShotTime >= SHOT_COOLDOWN) {
            // Create a new bullet at the player's position
            const bullet = new Bullet(
                this.x + this.width / 2,
                this.y
            );
            bullets.push(bullet);
            lastShotTime = currentTime;

            // Play shooting sound
            playShootSound();
        }
    }
}

// Enemy object
class Enemy {
    constructor(x, y, width, height, color, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = speed * 0.6 + 1; // Adjusted speed range slightly
    }

    update() {
        this.y += this.speed; // Move enemy downwards
    }

    draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function spawnEnemy() {
    if (!canvasElement) return;
    const enemyWidth = 40;
    const enemyHeight = 20;
    const enemyX = Math.random() * (canvasElement.width - enemyWidth - 20) + 10; // Random X, keep away from edges
    const enemyY = -enemyHeight; // Start just above the screen
    const enemySpeed = Math.random() * 2 + 1; // Random speed
    enemies.push(new Enemy(enemyX, enemyY, enemyWidth, enemyHeight, '#f00', enemySpeed)); // Red enemies
}

// --- Game Control Functions ---

function setupGame(canvas) {
    console.log("Space Shooter: Setting up game...");
    canvasElement = canvas;
    ctx = canvas.getContext('2d');

    // Reset game state for a new game
    resetGameState();

    // Create player (centered at bottom)
    const playerWidth = 50; 
    const playerHeight = 30;
    player = new Player(
        canvas.width / 2 - playerWidth / 2,
        canvas.height - playerHeight - 10, // Position near the bottom
        playerWidth,
        playerHeight,
        '#00f' // Blue color for player
    );

    // Find or create score display element (could be improved)
    // Ensure canvas parent allows absolute positioning for score
    if(canvas.parentNode) { 
        canvas.parentNode.style.position = 'relative';
    }
    scoreElement = document.getElementById('score-display');
    highScoreElement = document.getElementById('high-score');
    if (!scoreElement) { // Simple fallback if not found in HTML
        scoreElement = document.createElement('div');
        scoreElement.id = 'score-display';
        scoreElement.style.position = 'absolute'; // Basic styling
        scoreElement.style.top = '10px';
        scoreElement.style.left = '10px';
        scoreElement.style.color = 'white';
        scoreElement.style.fontSize = '20px';        
        scoreElement.style.zIndex = '10'; // Ensure score is above canvas
        canvas.parentNode.appendChild(scoreElement);
    }
    if (!highScoreElement) {
        highScoreElement = document.createElement('div');
        highScoreElement.id = 'high-score';
        highScoreElement.style.position = 'absolute'; // Basic styling
        highScoreElement.style.top = '40px';
        highScoreElement.style.left = '10px';
        highScoreElement.style.color = 'white';
        highScoreElement.style.fontSize = '20px';        
        highScoreElement.style.zIndex = '10'; // Ensure score is above canvas
        canvas.parentNode.appendChild(highScoreElement);
    }
    scoreElement.textContent = `Score: ${score}`;
    highScoreElement.textContent = `High Score: ${highScore}`;

    // Add basic keyboard controls
    setupControls(); 

    // Start the game loop
    startGameLoop();

    // Start spawning enemies
    startEnemySpawning();

    console.log("Space Shooter: Game setup complete. Player created.");
}

function setupControls() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function removeControls() {
     document.removeEventListener('keydown', handleKeyDown);
     document.removeEventListener('keyup', handleKeyUp);
}

// Key mappings
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    KeyZ: false  // Z key for shooting
};

function handleKeyDown(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
        return;
    }
    
    if (e.code in keys) {
        keys[e.code] = true;
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    if (e.code in keys) {
        keys[e.code] = false;
        e.preventDefault();
    }
}

function processInput() {
    if (gameOver || isPaused) return;

    if (keys.ArrowLeft) player.move(-1, 0);
    if (keys.ArrowRight) player.move(1, 0);
    if (keys.ArrowUp) player.move(0, -1);
    if (keys.ArrowDown) player.move(0, 1);
    if (keys.KeyZ) player.shoot();
}

function setupGameControls() {
    const pauseBtn = document.getElementById('pauseGame');
    const restartBtn = document.getElementById('restartGame');
    const pauseOverlay = document.getElementById('pauseOverlay');

    if (pauseBtn) {
        pauseBtn.onclick = togglePause;
    }

    if (restartBtn) {
        restartBtn.onclick = restartGame;
    }
}

function togglePause() {
    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    const pauseBtn = document.getElementById('pauseGame');
    
    if (pauseOverlay) {
        pauseOverlay.classList.toggle('hidden', !isPaused);
    }
    
    if (pauseBtn) {
        pauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    }
    updatePauseOverlay();
}

function updatePauseOverlay() {
    const pauseContent = document.querySelector('.pause-content');
    if (pauseContent) {
        pauseContent.innerHTML = `
            <h3>Game Paused</h3>
            <p>Space - Resume</p>
            <p>Z - Shoot</p>
            <p>Arrow Keys - Move</p>
        `;
    }
}

function restartGame() {
    stopGameLoop();
    stopEnemySpawning();
    resetGameState();
    startGameLoop();
    startEnemySpawning();
}

function gameLoop() {
    if (gameOver || isPaused) return;
    console.log("Game loop running, score:", score); // DEBUG

    // 1. Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 2. Update game objects (player, bullets, enemies)
    // Update bullets & remove off-screen bullets
    bullets = bullets.filter(bullet => bullet.y + bullet.height > 0);
    bullets.forEach(bullet => bullet.update());

    // Update enemies & remove off-screen enemies
    enemies = enemies.filter(enemy => enemy.y < canvasElement.height);
    enemies.forEach(enemy => enemy.update());

    // 3. Draw game objects
    if (player) {
        player.draw();
    }
    bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());

    // 4. Check collisions
    checkCollisions();

    // 5. Update score display
    if (scoreElement) {
        // console.log("Updating score display to:", score); // DEBUG (can be noisy)
        scoreElement.textContent = `Score: ${score}`;
    }
    if (highScoreElement) {
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
    updateGameTime();
    processInput();
}

function updateGameTime() {
    if (!gameTimeElement || gameOver || isPaused) return;
    
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - gameStartTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    gameTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function checkCollisions() {
    // Bullet-Enemy collisions
    console.log("Checking collisions, bullets:", bullets.length, "enemies:", enemies.length); // DEBUG
    // Use nested standard for loops for safe removal and break
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const enemy = enemies[j];

            // Check if bullet or enemy might have been removed already in this loop iteration
            if (!bullet || !enemy) continue;
            console.log("Checking bullet", i, "vs enemy", j); // DEBUG

            // Simple AABB collision detection
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {

                // Collision detected! Remove bullet and enemy
                console.log("COLLISION! Removing bullet", i, "and enemy", j); // DEBUG
                bullets.splice(i, 1); 
                enemies.splice(j, 1);

                // Increase and log score
                console.log("Old score:", score); // DEBUG
                score += 10; 
                console.log("Score increased to:", score); // DEBUG
                break; // Exit the inner (enemy) loop since bullet is gone
            }
        } // End enemy loop
    } // End bullet loop

    // Player-Enemy collisions
    enemies.forEach((enemy) => {
        if (!player) return; // Ensure player exists
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            console.log("Collision: Player hit Enemy");
            triggerGameOver();
        }
        // Check if enemy reached the bottom (optional game over condition)
        // if (enemy.y + enemy.height >= canvasElement.height) {
        //     console.log("Game Over: Enemy reached bottom");
        //     triggerGameOver();
        // }
    });
}

function startGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval); // Clear existing loop if any
    }
    // Run gameLoop roughly 60 times per second
    gameLoopInterval = setInterval(gameLoop, 1000 / 60); 
    console.log("Space Shooter: Game loop started.");
}

function startEnemySpawning() {
    if (enemySpawnTimer) {
        clearInterval(enemySpawnTimer);
    }
    enemySpawnTimer = setInterval(spawnEnemy, ENEMY_SPAWN_RATE);
}

function stopEnemySpawning() {
    clearInterval(enemySpawnTimer);
    enemySpawnTimer = null;
}

function stopGameLoop() {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    console.log("Space Shooter: Game loop stopped.");
}

function triggerGameOver() {
    if (gameOver) return; // Prevent multiple triggers
    
    gameOver = true;
    stopEnemySpawning();
    stopGameLoop();
    
    console.log('Game Over! Final score:', score);
    
    // Submit score to leaderboard if it meets minimum requirement
    if (typeof window.submitScore === 'function') {
        console.log('Submitting score to leaderboard...');
        try {
            window.submitScore(score, 'space-shooter')
                .then(() => {
                    console.log('Score submission completed');
                    // Close the game modal after score submission
                    stopSpaceShooterModal();
                    // Update leaderboard display after successful submission
                    if (typeof window.loadLeaderboard === 'function') {
                        window.loadLeaderboard('space-shooter')
                            .then(() => console.log('Leaderboard update completed'))
                            .catch(error => console.error('Error updating leaderboard:', error));
                    }
                })
                .catch(error => console.error('Error submitting score:', error));
        } catch (error) {
            console.error('Error in score submission:', error);
            // Still close the modal even if there's an error
            stopSpaceShooterModal();
        }
    } else {
        console.error('submitScore function not found in window object');
        stopSpaceShooterModal();
    }

    // Show game over message briefly before closing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvasElement.width / 2, canvasElement.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvasElement.width / 2, canvasElement.height / 2 + 40);
}

function resetGameState() {
    score = 0;
    gameOver = false;
    isPaused = false;
    bullets = [];
    enemies = [];
    // Clear any existing timers
    stopGameLoop();
    stopEnemySpawning();
}

// --- Event Listeners and Controls ---

// This function will be called by arcade-logic.js
function startSpaceShooter(canvas) {
    console.log("Starting Space Shooter game..."); // DEBUG
    // Ensure previous game resources are cleaned up if necessary
    // (e.g., remove old event listeners, stop old loops)
    if (gameLoopInterval) {
         stopGameLoop();
    }
    stopEnemySpawning();
    removeControls(); // Remove listeners from previous game instance (if any)
    
    // Reset game state
    resetGameState();
     
    // Initialize game with the canvas
    setupGame(canvas);
    
    // Start game systems
    setupControls();
    setupGameControls();
    startGameLoop();
    startEnemySpawning();
    
    console.log("Space Shooter game started!"); // DEBUG
}

// Optional: Add a function to stop/cleanup the game when switching games
// Called from arcade-logic.js
function stopSpaceShooter() {
    console.log("Stopping Space Shooter game..."); // DEBUG
    stopGameLoop();
    stopEnemySpawning();
    removeControls();
    resetGameState();
    console.log("Space Shooter game stopped!"); // DEBUG
}

// Make startSpaceShooter available globally
window.startSpaceShooter = startSpaceShooter;

function startSpaceShooterModal(canvas) {
    // Initialize game state
    canvasElement = canvas;
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('currentScore');
    highScoreElement = document.getElementById('highScore');
    gameTimeElement = document.getElementById('gameTime');
    resetGameState();

    // Create player in the middle bottom of the canvas
    player = new Player(
        canvas.width / 2 - 25,
        canvas.height - 50,
        50,
        30,
        '#00ff00'
    );

    // Set up game controls
    setupControls();
    setupGameControls();
    
    // Start game
    startGame();
}

function startGame() {
    gameStartTime = Date.now();
    startGameLoop();
    startEnemySpawning();
}

function stopSpaceShooterModal() {
    stopGameLoop();
    stopEnemySpawning();
    removeControls();
    resetGameState();
}

// Make functions available globally
window.startSpaceShooterModal = startSpaceShooterModal;
window.stopSpaceShooterModal = stopSpaceShooterModal;

function playShootSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}
