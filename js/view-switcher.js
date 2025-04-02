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
    } else {
        // Switch to desktop view
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        document.documentElement.style.setProperty('--content-width', '100%');
        document.documentElement.style.setProperty('--content-scale', '1');
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
        localStorage.setItem('preferredView', 'desktop');
        document.body.classList.remove('mobile-view');
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
    } else {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        document.documentElement.style.setProperty('--content-width', '100%');
        document.documentElement.style.setProperty('--content-scale', '1');
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
        document.body.classList.remove('mobile-view');
    }
});
