// Function to toggle between mobile and desktop views
function toggleView() {
    const viewport = document.querySelector('meta[name="viewport"]');
    const toggleButton = document.getElementById('view-toggle');
    const isMobileView = localStorage.getItem('preferredView') === 'mobile';
    
    if (!isMobileView) {
        // Switch to mobile view
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        document.body.style.transform = 'scale(0.6)';
        document.body.style.transformOrigin = 'top left';
        document.body.style.width = '166.67%'; // 1/0.6 * 100%
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
        localStorage.setItem('preferredView', 'mobile');
    } else {
        // Switch to desktop view
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.width = '';
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
        localStorage.setItem('preferredView', 'desktop');
    }
}

// Initialize view based on saved preference
document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const toggleButton = document.getElementById('view-toggle');
    const preferredView = localStorage.getItem('preferredView') || 'desktop';
    
    if (preferredView === 'mobile') {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        document.body.style.transform = 'scale(0.6)';
        document.body.style.transformOrigin = 'top left';
        document.body.style.width = '166.67%'; // 1/0.6 * 100%
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
    } else {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.width = '';
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
    }
});
