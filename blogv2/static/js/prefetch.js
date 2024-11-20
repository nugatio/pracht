document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.content');
    const prefetchedUrls = new Set([window.location.pathname]);
  
    // Configurable options
    const CONFIG = {
      CACHE_NAME: 'site-content-cache-v1',
      PREFETCH_TIMEOUT: 1000,
      MAX_CACHE_ENTRIES: 50,
      OFFLINE_FALLBACK_URL: '/offline'
    };
  
    const normalize = (url) => {
      try {
        const parsedUrl = new URL(url, window.location.origin);
        return parsedUrl.pathname.endsWith('/') ? parsedUrl.pathname : `${parsedUrl.pathname}/`;
      } catch (error) {
        console.error('URL normalization failed', error);
        return null;
      }
    };
  
    const manageCacheSize = async () => {
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const keys = await cache.keys();
      if (keys.length > CONFIG.MAX_CACHE_ENTRIES) {
        const keysToRemove = keys.slice(0, keys.length - CONFIG.MAX_CACHE_ENTRIES);
        await Promise.all(keysToRemove.map(key => cache.delete(key)));
      }
    };
  
    const prefetchArticle = async (url) => {
      const normalizedUrl = normalize(url);
      if (!normalizedUrl || prefetchedUrls.has(normalizedUrl)) return;
  
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const cachedResponse = await cache.match(normalizedUrl);
      if (cachedResponse) return;
  
      try {
        const response = await fetch(normalizedUrl, { credentials: 'same-origin', headers: { 'Accept': 'text/html' } });
        if (response.ok) {
          await cache.put(normalizedUrl, response.clone());
          prefetchedUrls.add(normalizedUrl);
          await manageCacheSize();
        }
      } catch (error) {
        console.error(`Prefetch failed for ${normalizedUrl}`, error);
      }
    };
  
    const updateMainContent = async (url) => {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        const cachedResponse = await cache.match(normalize(url));
        const response = cachedResponse || await fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'text/html' } });
  
        if (!response.ok) throw new Error(`Failed to load page: ${response.status}`);
  
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newMainContent = doc.querySelector('.content');
        if (newMainContent) {
          document.title = doc.title;
          mainContent.innerHTML = newMainContent.innerHTML;
          updateMetaTags(doc);
  
          const scrollPosition = window.scrollY;
          history.pushState({ path: url, scrollPosition }, '', url);
  
          window.scrollTo(0, 0); // Ensure smooth scroll to top
        }
      } catch (error) {
        console.error('Content update failed', error);
        try {
          const offlinePage = await fetch(CONFIG.OFFLINE_FALLBACK_URL);
          if (offlinePage.ok) mainContent.innerHTML = await offlinePage.text();
        } catch {
          mainContent.innerHTML = '<p>Unable to load page. Please check your connection.</p>';
        }
      }
    };
  
    const updateMetaTags = (newDoc) => {
      const metaSelectors = ['meta[name="description"]', 'meta[property^="og:"]', 'link[rel="canonical"]'];
      metaSelectors.forEach(selector => {
        const newTags = newDoc.querySelectorAll(selector);
        document.querySelectorAll(selector).forEach(tag => tag.remove());
        newTags.forEach(tag => document.head.appendChild(tag.cloneNode(true)));
      });
    };
  
    const setupHoverListeners = () => {
      document.querySelectorAll('.article-link, .pagination .page-item:not(.active) a, .nav-link').forEach(link => {
        const linkUrl = normalize(link.href);
        if (linkUrl && !prefetchedUrls.has(linkUrl)) {
          link.addEventListener('mouseenter', () => prefetchArticle(linkUrl));
        }
      });
    };
  
    // Navigation event handler
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.hostname === window.location.hostname && !link.href.startsWith('mailto:')) {
        e.preventDefault();
        const url = link.href;
        if (url !== window.location.href) updateMainContent(url);
      }
    });
  
    // Handle popstate for back/forward navigation
    window.addEventListener('popstate', async (e) => {
      if (e.state && e.state.path) {
        if (window.location.pathname !== e.state.path) {
          await updateMainContent(e.state.path);
        }
        if (e.state.scrollPosition !== undefined) {
          window.scrollTo(0, e.state.scrollPosition);
        }
      }
    });
  
    // Prefetch the initial page
    setupHoverListeners();
  });
  