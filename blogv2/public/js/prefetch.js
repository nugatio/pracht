// Create a script tag to be included in baseof.html
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
            // Use requestIdleCallback if available, otherwise use setTimeout
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => prefetchArticle(url));
            } else {
                setTimeout(() => prefetchArticle(url), 1);
            }
        });
    };

    // Start prefetching after a short delay to not block initial page load
    setTimeout(prefetchCurrentPageArticles, 100);

    // Optional: Prefetch next page when hovering over pagination
    const nextPageLink = document.querySelector('.pagination .next a');
    if (nextPageLink) {
        nextPageLink.addEventListener('mouseenter', () => {
            prefetchArticle(nextPageLink.href);
        });
    }
});