document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.querySelector('.content');
  const prefetchedUrls = new Set();

  const CONFIG = {
    PREFETCH_TIMEOUT: 500,  // Delay for prefetching links on hover
    CACHE_NAME: 'dynamic-content-cache',
    MAX_CACHE_ENTRIES: 50,
  };

  // Normalize and cache the URL to prevent redundant prefetching
  const normalizeUrl = (url) => {
    try {
      const parsedUrl = new URL(url, window.location.origin);
      return parsedUrl.pathname.endsWith('/') ? parsedUrl.pathname : `${parsedUrl.pathname}/`;
    } catch (e) {
      return null;
    }
  };

  // Prefetch and cache the page content
  const prefetchContent = async (url) => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl || prefetchedUrls.has(normalizedUrl)) return;

    const cache = await caches.open(CONFIG.CACHE_NAME);
    const cachedResponse = await cache.match(normalizedUrl);
    if (cachedResponse) return; // Skip if already in cache

    try {
      const response = await fetch(normalizedUrl, { headers: { 'Accept': 'text/html' } });
      if (response.ok) {
        await cache.put(normalizedUrl, response.clone());
        prefetchedUrls.add(normalizedUrl);
        manageCacheSize(cache);
      }
    } catch (error) {
      console.error(`Prefetch failed for ${normalizedUrl}:`, error);
    }
  };

  // Clean up cache if it exceeds MAX_CACHE_ENTRIES
  const manageCacheSize = async (cache) => {
    const keys = await cache.keys();
    if (keys.length > CONFIG.MAX_CACHE_ENTRIES) {
      const toRemove = keys.slice(0, keys.length - CONFIG.MAX_CACHE_ENTRIES);
      await Promise.all(toRemove.map(key => cache.delete(key)));
    }
  };

  // Update the main content by fetching the new page or from cache
  const updateContent = async (url) => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) return;

    const cache = await caches.open(CONFIG.CACHE_NAME);
    let response = await cache.match(normalizedUrl);

    if (!response) {
      try {
        response = await fetch(normalizedUrl, { headers: { 'Accept': 'text/html' } });
        if (!response.ok) throw new Error('Failed to fetch page');
        await cache.put(normalizedUrl, response.clone());
      } catch (error) {
        console.error('Error fetching content:', error);
        return;  // Optionally handle offline fallback here
      }
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newMainContent = doc.querySelector('.content');

    if (newMainContent) {
      document.title = doc.title;
      mainContent.innerHTML = newMainContent.innerHTML;
      updateMetaTags(doc);
      history.pushState({ path: normalizedUrl }, '', normalizedUrl);
    }
  };

  // Update meta tags (description, OG tags, etc.)
  const updateMetaTags = (doc) => {
    const metaSelectors = ['meta[name="description"]', 'meta[property^="og:"]', 'link[rel="canonical"]'];
    metaSelectors.forEach(selector => {
      const existingTags = document.querySelectorAll(selector);
      const newTags = doc.querySelectorAll(selector);
      existingTags.forEach(tag => tag.remove());
      newTags.forEach(tag => document.head.appendChild(tag.cloneNode(true)));
    });
  };

  // Set up hover prefetching
  const setupHoverPrefetch = () => {
    const links = [...document.querySelectorAll('a[href]')];
    links.forEach(link => {
      const href = link.href;
      if (href && !href.startsWith('mailto:')) {
        link.addEventListener('mouseenter', () => {
          setTimeout(() => prefetchContent(href), CONFIG.PREFETCH_TIMEOUT);
        });
      }
    });
  };

  // Handle navigation and update the content dynamically
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.hostname === window.location.hostname && !link.href.startsWith('mailto:')) {
      e.preventDefault();
      updateContent(link.href);
    }
  });

  // Handle back and forward navigation using popstate
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.path) {
      updateContent(e.state.path);
    }
  });

  // Initialize hover prefetching and content update for the current page
  setupHoverPrefetch();
  updateContent(window.location.pathname);
});
