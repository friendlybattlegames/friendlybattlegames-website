// Function to toggle between mobile and desktop views
function toggleView() {
    const viewport = document.querySelector('meta[name="viewport"]');
    const toggleButton = document.getElementById('view-toggle');
    const currentWidth = viewport.getAttribute('content').includes('1024') ? 'mobile' : 'desktop';
    
    if (currentWidth === 'mobile') {
        // Switch to desktop view
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
        localStorage.setItem('preferredView', 'desktop');
    } else {
        // Switch to mobile view
        viewport.setAttribute('content', 'width=1024');
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
        localStorage.setItem('preferredView', 'mobile');
    }
}

// Initialize view based on saved preference
document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const toggleButton = document.getElementById('view-toggle');
    const preferredView = localStorage.getItem('preferredView') || 'desktop';
    
    if (preferredView === 'mobile') {
        viewport.setAttribute('content', 'width=1024');
        toggleButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Mobile View';
    } else {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        toggleButton.innerHTML = '<i class="fas fa-desktop"></i> Desktop View';
    }
});
