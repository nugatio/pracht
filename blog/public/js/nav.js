document.addEventListener('DOMContentLoaded', function() {
    // Function to load content via AJAX without full page reload
    function loadContent(url) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Replace only the content container, keeping navbar and footer
                document.getElementById('content-container').innerHTML = doc.getElementById('content-container').innerHTML;
                
                // Re-initialize scripts that are content-specific
                initShader();
                highlightWord(); // From hw.js
            })
            .catch(err => console.error('Failed to load content:', err));
    }

    // Handle link clicks for internal navigation
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(event) {
            const url = link.getAttribute('href');
            if (url && url.startsWith('/')) {
                event.preventDefault();
                history.pushState(null, '', url);
                loadContent(url);
            }
        });
    });

    // Listen for browser back/forward button navigation
    window.addEventListener('popstate', function() {
        loadContent(location.pathname);
    });
});
