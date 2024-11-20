document.addEventListener('DOMContentLoaded', () => {
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
        const normalized = normalize(url);
        if (prefetchedUrls.has(normalized)) return;

        try {
            const res = await fetch(url, { credentials: 'same-origin' });
            if (res.ok) {
                await (await caches.open('article-cache')).put(url, res.clone());
                prefetchedUrls.add(normalized);
            }
        } catch { }
    };

    const queuePrefetch = (pathname, i = 0) => {
        if (!pathname?.length || prefetchedUrls.has(normalize(pathname))) return;

        const schedule = fn => ('requestIdleCallback' in window)
            ? requestIdleCallback(fn, { timeout: 1000 + (i * 500) })
            : setTimeout(fn, 1000 + (i * 500));

        schedule(() => prefetchArticle(pathname));
    };

    const getAllLinks = () => [
        ...document.querySelectorAll('.pagination .page-item:not(.active) a, .nav-link'),
        document.querySelector('.navbar-logo-wrapper')
    ].filter(Boolean);

    const prefetchPages = () => {
        const links = getAllLinks();

        if (!isRoot(window.location.pathname)) {
            links.push({ href: new URL('/', window.location.href).href });
        }

        links.forEach((link, i) => queuePrefetch(getPathname(link), i));
    };

    const setupHoverListeners = () => {
        const links = [
            ...document.querySelectorAll('.article-link'),
            ...getAllLinks()
        ].filter(Boolean);

        links.forEach(link => {
            link?.href && link.addEventListener('mouseenter', () =>
                queuePrefetch(getPathname(link))
            );
        });

        !isRoot(window.location.pathname) && queuePrefetch('/');
    };

    [
        [prefetchPages, 1500],
        [setupHoverListeners, 100]
    ].forEach(([fn, delay]) => setTimeout(fn, delay));
});