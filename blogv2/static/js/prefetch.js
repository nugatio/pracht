document.addEventListener('DOMContentLoaded', function () {
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
        const navLinks = [
            ...document.querySelectorAll('.nav-link'),
            document.querySelector('.navbar-logo-wrapper')
        ].filter(Boolean);
        const navigationLinks = [...paginationLinks, ...navLinks];

        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            navigationLinks.push({ href: '/' });
        }

        navigationLinks.forEach((link, index) => {
            const pathname = link.href ? new URL(link.href).pathname : link;
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
        const navElements = [
            ...document.querySelectorAll('.pagination .page-item:not(.active) a'),
            ...document.querySelectorAll('.nav-link'),
            document.querySelector('.navbar-logo-wrapper')
        ].filter(Boolean);

        articleLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const pathname = new URL(link.href).pathname;
                if (!prefetchedUrls.has(pathname)) {
                    prefetchArticle(pathname);
                }
            });
        });

        navElements.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const pathname = new URL(link.href).pathname;
                if (!prefetchedUrls.has(pathname)) {
                    prefetchArticle(pathname);
                }
            });
        });

        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            const logoWrapper = document.querySelector('.navbar-logo-wrapper');
            if (logoWrapper && !prefetchedUrls.has('/')) {
                prefetchArticle('/');
            }
        }
    };
    setTimeout(prefetchNavigationPages, 1500);
    setTimeout(addHoverListeners, 100);
});