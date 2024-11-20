document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.content');
    const prefetchedUrls = new Set([window.location.pathname]);

    const isRoot = (path) => path === '/' || path === '/index.html';
    const normalize = (url) => url?.endsWith('/') ? url : `${url}/`;
    
    const getPathname = (link) => {
        try {
            return new URL(link?.href ?? '').pathname;
        } catch {
            return null;
        }
    };

    const prefetchArticle = async (url) => {
        // Ignore email links and already prefetched URLs
        if (url.startsWith('mailto:') || prefetchedUrls.has(normalize(url))) return;

        try {
            const res = await fetch(url, { credentials: 'same-origin' });
            if (res.ok) {
                await (await caches.open('article-cache')).put(url, res.clone());
                prefetchedUrls.add(normalize(url));
            }
        } catch { }
    };

    const queuePrefetch = (pathname) => {
        if (!pathname?.length) return;
        const normalized = normalize(pathname);
        
        // Prevent multiple prefetches of the same normalized URL
        if (prefetchedUrls.has(normalized)) return;

        const schedule = fn => ('requestIdleCallback' in window)
            ? requestIdleCallback(fn, { timeout: 1000 })
            : setTimeout(fn, 1000);
        
        schedule(() => prefetchArticle(pathname));
    };

    const updateMainContent = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Replace only the main content
            const newMainContent = doc.querySelector('.content');
            if (newMainContent) {
                mainContent.innerHTML = newMainContent.innerHTML;
                
                // Update browser history
                history.pushState(null, '', url);
                
                // Reattach hover listeners to new links
                setupHoverListeners();
            }
        } catch (error) {
            console.error('Failed to load page:', error);
        }
    };

    const setupHoverListeners = () => {
        const links = [
            ...document.querySelectorAll('.article-link'),
            ...document.querySelectorAll('.pagination .page-item:not(.active) a, .nav-link'),
            document.querySelector('.navbar-logo-wrapper')
        ].filter(Boolean);

        links.forEach(link => {
            // Ignore email links and links already in prefetchedUrls
            if (link?.href && 
                !link.href.startsWith('mailto:') && 
                !prefetchedUrls.has(normalize(link.href))) {
                link.addEventListener('mouseenter', () =>
                    queuePrefetch(getPathname(link))
                );
            }
        });

        !isRoot(window.location.pathname) && queuePrefetch('/');
    };

    // Intercept link clicks for single-page-like navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.hostname === window.location.hostname && !link.href.startsWith('mailto:')) {
            e.preventDefault();
            const url = link.href;
            
            // Only update for internal links
            if (url !== window.location.href) {
                updateMainContent(url);
            }
        }
    });

    // Initial setup of hover prefetching
    setupHoverListeners();
});