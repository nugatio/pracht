console.log('Main.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    
    const navbarContainer = document.getElementById('navbar-container');
    const footerContainer = document.getElementById('footer-container');

    // Load navbar
    fetch('/navbar.html')
        .then(response => response.text())
        .then(html => {
            console.log('Navbar loaded');
            navbarContainer.innerHTML = html;
            if (typeof initLogoShader === 'function') {
                initLogoShader();
            }
        })
        .catch(error => console.error('Error loading navbar:', error));

    // Load footer
    fetch('/footer.html')
        .then(response => response.text())
        .then(html => {
            console.log('Footer loaded');
            footerContainer.innerHTML = html;
        })
        .catch(error => console.error('Error loading footer:', error));

    // Initialize clock
    if (typeof startClock === 'function') {
        startClock();
    }
});