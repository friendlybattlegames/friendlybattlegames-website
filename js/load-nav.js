document.addEventListener('DOMContentLoaded', async () => {
    const navPlaceholder = document.getElementById('nav-placeholder');
    
    try {
        // Load the navigation template
        const response = await fetch('nav-template.html');
        const html = await response.text();
        navPlaceholder.innerHTML = html;

        // Dispatch event to notify nav is loaded
        const navLoadedEvent = new CustomEvent('navLoaded');
        document.dispatchEvent(navLoadedEvent);
        console.log('Navigation template loaded successfully.');
    } catch (error) {
        console.error('Error loading navigation:', error);
    }
});
