// Function to toggle between mobile and desktop views
function toggleView() {
    const viewport = document.querySelector('meta[name="viewport"]');
    const toggleButton = document.getElementById('view-toggle');
    const isMobileView = localStorage.getItem('preferredView') === 'mobile';
    
    if (!viewport || !toggleButton) return;
    
    if (!isMobileView) {
        // Switch to mobile view
        viewport.setAttribute('content', 'width=device-width, initial-scale=0.6, user-scalable=no');
        document.documentElement.style.setProperty('--content-width', '166.67%');
        document.documentElement.style.setProperty('--content-scale', '0.6');
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
        localStorage.setItem('preferredView', 'mobile');
        document.body.classList.add('mobile-view');
        setupMobileControls();
    } else {
        // Switch to desktop view
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        document.documentElement.style.setProperty('--content-width', '100%');
        document.documentElement.style.setProperty('--content-scale', '1');
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
        localStorage.setItem('preferredView', 'desktop');
        document.body.classList.remove('mobile-view');
        removeMobileControls();
    }
}

// Initialize view based on saved preference
document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const toggleButton = document.getElementById('view-toggle');
    
    if (!viewport || !toggleButton) return;
    
    const preferredView = localStorage.getItem('preferredView') || 'desktop';
    
    if (preferredView === 'mobile') {
        viewport.setAttribute('content', 'width=device-width, initial-scale=0.6, user-scalable=no');
        document.documentElement.style.setProperty('--content-width', '166.67%');
        document.documentElement.style.setProperty('--content-scale', '0.6');
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
        document.body.classList.add('mobile-view');
        setupMobileControls();
    } else {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        document.documentElement.style.setProperty('--content-width', '100%');
        document.documentElement.style.setProperty('--content-scale', '1');
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
        document.body.classList.remove('mobile-view');
        removeMobileControls();
    }
});

// Mobile controls setup
function setupMobileControls() {
    const gameControlsOverlay = document.querySelector('.game-controls-overlay');
    if (!gameControlsOverlay) return;

    // Show mobile controls
    gameControlsOverlay.style.display = 'block';
    const mobileControls = document.querySelector('.mobile-controls');
    if (mobileControls) {
        mobileControls.style.display = 'flex';
    }

    // D-pad controls
    const upBtn = document.getElementById('up-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const downBtn = document.getElementById('down-btn');
    const actionBtn = document.getElementById('action-btn');

    if (!upBtn || !leftBtn || !rightBtn || !downBtn || !actionBtn) return;

    // Key simulation functions
    function simulateKeyDown(key) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true });
        document.dispatchEvent(event);
    }

    function simulateKeyUp(key) {
        const event = new KeyboardEvent('keyup', { key, bubbles: true });
        document.dispatchEvent(event);
    }

    // Touch event handlers
    function handleTouchStart(key) {
        return (e) => {
            e.preventDefault();
            e.stopPropagation();
            simulateKeyDown(key);
        };
    }

    function handleTouchEnd(key) {
        return (e) => {
            e.preventDefault();
            e.stopPropagation();
            simulateKeyUp(key);
        };
    }

    // Clean up old event listeners
    const buttons = [upBtn, leftBtn, rightBtn, downBtn, actionBtn];
    buttons.forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
    });

    // Add touch events for each button
    upBtn.addEventListener('touchstart', handleTouchStart('ArrowUp'), { passive: false });
    upBtn.addEventListener('touchend', handleTouchEnd('ArrowUp'), { passive: false });

    leftBtn.addEventListener('touchstart', handleTouchStart('ArrowLeft'), { passive: false });
    leftBtn.addEventListener('touchend', handleTouchEnd('ArrowLeft'), { passive: false });

    rightBtn.addEventListener('touchstart', handleTouchStart('ArrowRight'), { passive: false });
    rightBtn.addEventListener('touchend', handleTouchEnd('ArrowRight'), { passive: false });

    downBtn.addEventListener('touchstart', handleTouchStart('ArrowDown'), { passive: false });
    downBtn.addEventListener('touchend', handleTouchEnd('ArrowDown'), { passive: false });

    actionBtn.addEventListener('touchstart', handleTouchStart(' '), { passive: false }); // Space
    actionBtn.addEventListener('touchend', handleTouchEnd(' '), { passive: false }); // Space

    // Mouse events for testing on desktop
    upBtn.addEventListener('mousedown', handleTouchStart('ArrowUp'));
    upBtn.addEventListener('mouseup', handleTouchEnd('ArrowUp'));
    upBtn.addEventListener('mouseleave', handleTouchEnd('ArrowUp'));

    leftBtn.addEventListener('mousedown', handleTouchStart('ArrowLeft'));
    leftBtn.addEventListener('mouseup', handleTouchEnd('ArrowLeft'));
    leftBtn.addEventListener('mouseleave', handleTouchEnd('ArrowLeft'));

    rightBtn.addEventListener('mousedown', handleTouchStart('ArrowRight'));
    rightBtn.addEventListener('mouseup', handleTouchEnd('ArrowRight'));
    rightBtn.addEventListener('mouseleave', handleTouchEnd('ArrowRight'));

    downBtn.addEventListener('mousedown', handleTouchStart('ArrowDown'));
    downBtn.addEventListener('mouseup', handleTouchEnd('ArrowDown'));
    downBtn.addEventListener('mouseleave', handleTouchEnd('ArrowDown'));

    actionBtn.addEventListener('mousedown', handleTouchStart(' '));
    actionBtn.addEventListener('mouseup', handleTouchEnd(' '));
    actionBtn.addEventListener('mouseleave', handleTouchEnd(' '));
}

// Remove mobile controls
function removeMobileControls() {
    const gameControlsOverlay = document.querySelector('.game-controls-overlay');
    if (gameControlsOverlay) {
        gameControlsOverlay.style.display = 'none';
    }
    const mobileControls = document.querySelector('.mobile-controls');
    if (mobileControls) {
        mobileControls.style.display = 'none';
    }
}

// Prevent scrolling when touching the game controls
document.addEventListener('DOMContentLoaded', () => {
    const gameControlsOverlay = document.querySelector('.game-controls-overlay');
    if (gameControlsOverlay) {
        gameControlsOverlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
});
