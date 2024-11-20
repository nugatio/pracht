document.addEventListener('DOMContentLoaded', function() {
    const prefetchedUrls = new Set([window.location.pathname]);
    
    const prefetchArticle = async (url) => {
        const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
        
        if (prefetchedUrls.has(normalizedUrl)) {
            return;
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cache = await caches.open('article-cache');
            await cache.put(url, response.clone());
            prefetchedUrls.add(normalizedUrl);
        } catch (error) {
            console.warn('Prefetch failed:', error);
        }
    };

    const prefetchNavigationPages = () => {
        const paginationLinks = document.querySelectorAll('.pagination .page-item:not(.active) a');
        const themenLink = document.querySelector('.nav-link[href="/themen"]');
        
        const navigationLinks = [...paginationLinks];
        if (themenLink) navigationLinks.push(themenLink);
        
        navigationLinks.forEach((link, index) => {
            const pathname = new URL(link.href).pathname;
            if (!prefetchedUrls.has(pathname)) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => prefetchArticle(pathname), { 
                        timeout: 1000 + (index * 500) 
                    });
                } else {
                    setTimeout(() => prefetchArticle(pathname), 1000 + (index * 500));
                }
            }
        });
    };

    const addHoverListeners = () => {
        const articleLinks = document.querySelectorAll('.article-link');

        const navLinks = [
            ...document.querySelectorAll('.pagination .page-item:not(.active) a'),
            document.querySelector('.nav-link[href="/themen"]')
        ].filter(Boolean);

        articleLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const pathname = new URL(link.href).pathname;
                if (!prefetchedUrls.has(pathname)) {
                    prefetchArticle(pathname);
                }
            });
        });

        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const pathname = new URL(link.href).pathname;
                if (!prefetchedUrls.has(pathname)) {
                    prefetchArticle(pathname);
                }
            });
        });
    };

    setTimeout(prefetchNavigationPages, 1500);
    setTimeout(addHoverListeners, 100);
});