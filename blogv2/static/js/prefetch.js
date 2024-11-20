document.addEventListener('DOMContentLoaded', function() {
    // Get all article links on the current page
    const articleLinks = document.querySelectorAll('.article-link');
    
    // Create a prefetch function that uses fetch API
    const prefetchArticle = async (url) => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            // Store in browser's cache
            const cache = await caches.open('article-cache');
            await cache.put(url, response.clone());
        } catch (error) {
            console.warn('Prefetch failed:', error);
        }
    };

    // Prefetch all articles on the current page
    const prefetchCurrentPageArticles = () => {
        articleLinks.forEach(link => {
            const url = link.href;
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => prefetchArticle(url));
            } else {
                setTimeout(() => prefetchArticle(url), 1);
            }
        });
    };

    // Prefetch pagination pages and navigation links
    const prefetchNavigationPages = () => {
        // Get all pagination links
        const paginationLinks = document.querySelectorAll('.pagination .page-item:not(.active) a');
        // Get the 'themen' link
        const themenLink = document.querySelector('.nav-link[href="/themen"]');
        
        // Combine all navigation links to prefetch
        const navigationLinks = [...paginationLinks];
        if (themenLink) navigationLinks.push(themenLink);
        
        // Prefetch each navigation link
        navigationLinks.forEach((link, index) => {
            // Stagger the prefetch timing to avoid overwhelming the browser
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => prefetchArticle(link.href), { 
                    timeout: 1000 + (index * 500) 
                });
            } else {
                setTimeout(() => prefetchArticle(link.href), 1000 + (index * 500));
            }
        });
    };

    // Start prefetching articles immediately after load
    setTimeout(prefetchCurrentPageArticles, 100);
    
    // Start prefetching navigation pages with a delay
    setTimeout(prefetchNavigationPages, 1500);

    // Add hover listeners for immediate prefetch
    const addHoverListeners = () => {
        // Get all pagination links and themen link
        const allNavLinks = [
            ...document.querySelectorAll('.pagination .page-item:not(.active) a'),
            document.querySelector('.nav-link[href="/themen"]')
        ].filter(Boolean); // Remove null if themen link doesn't exist

        allNavLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                prefetchArticle(link.href);
            });
        });
    };

    // Add hover listeners after a short delay
    setTimeout(addHoverListeners, 100);
});