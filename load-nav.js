async function loadNavTemplate() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (!navPlaceholder) {
        console.error('Navigation placeholder element (#nav-placeholder) not found.');
        return false;
    }

    try {
        const response = await fetch('nav-template.html');
        if (!response.ok) {
            throw new Error(`Failed to fetch nav-template.html: ${response.status} ${response.statusText}`);
        }
        const templateHTML = await response.text();
        navPlaceholder.innerHTML = templateHTML;
        console.log('Navigation template loaded successfully.');
        // Dispatch a custom event to signal completion
        document.dispatchEvent(new CustomEvent('navLoaded'));
        return true;
    } catch (error) {
        console.error('Error loading navigation template:', error);
        navPlaceholder.innerHTML = '<p style="color: red;">Error loading navigation.</p>';
        // Optionally dispatch an error event
        document.dispatchEvent(new CustomEvent('navLoadError'));
        return false;
    }
}

// Load the nav as soon as the script runs (defer attribute ensures DOM is parsed)
loadNavTemplate();
