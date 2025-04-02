// Function to toggle between mobile and desktop views
function toggleView() {
    const viewport = document.querySelector('meta[name="viewport"]');
    const toggleButton = document.getElementById('view-toggle');
    const isMobileView = localStorage.getItem('preferredView') === 'mobile';
    
    if (!isMobileView) {
        // Switch to mobile view
        viewport.setAttribute('content', 'width=device-width, initial-scale=0.5, maximum-scale=0.5');
        document.documentElement.style.zoom = "0.5";
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
        localStorage.setItem('preferredView', 'mobile');
    } else {
        // Switch to desktop view
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        document.documentElement.style.zoom = "1";
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
        viewport.setAttribute('content', 'width=device-width, initial-scale=0.5, maximum-scale=0.5');
        document.documentElement.style.zoom = "0.5";
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
    } else {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        document.documentElement.style.zoom = "1";
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
    }
});
