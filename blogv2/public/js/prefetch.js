document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.content');
    const prefetchedUrls = new Set([window.location.pathname]);
    
    // Configurable options
    const CONFIG = {
      CACHE_NAME: 'site-content-cache-v1',
      PREFETCH_TIMEOUT: 10,
      MAX_CACHE_ENTRIES: 500,
      OFFLINE_FALLBACK_URL: '/offline'
    };
  
    // Enhanced logging utility
    const Logger = {
      debug: (message, ...args) => {
        if (window.DEBUG_MODE) {
          console.log(`[Prefetch Debug] ${message}`, ...args);
        }
      },
      error: (message, ...args) => {
        console.error(`[Prefetch Error] ${message}`, ...args);
      }
    };
  
    const isRoot = (path) => path === '/' || path === '/index.html';
    
    const normalize = (url) => {
      try {
        const parsedUrl = new URL(url, window.location.origin);
        return parsedUrl.pathname.endsWith('/') 
          ? parsedUrl.pathname 
          : `${parsedUrl.pathname}/`;
      } catch (error) {
        Logger.error('URL normalization failed', error);
        return null;
      }
    };
  
    const manageCacheSize = async () => {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        const keys = await cache.keys();
        
        if (keys.length > CONFIG.MAX_CACHE_ENTRIES) {
          // Remove oldest entries
          const keysToRemove = keys.slice(0, keys.length - CONFIG.MAX_CACHE_ENTRIES);
          await Promise.all(keysToRemove.map(key => cache.delete(key)));
          
          Logger.debug(`Cleaned cache. Removed ${keysToRemove.length} entries`);
        }
      } catch (error) {
        Logger.error('Cache management failed', error);
      }
    };
  
    const prefetchArticle = async (url) => {
      const normalizedUrl = normalize(url);
      
      if (!normalizedUrl || 
          normalizedUrl.startsWith('mailto:') || 
          prefetchedUrls.has(normalizedUrl)) {
        return;
      }
  
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        // Check if already cached
        const cachedResponse = await cache.match(normalizedUrl);
        if (cachedResponse) {
          Logger.debug(`Already cached: ${normalizedUrl}`);
          return;
        }
  
        // Fetch and cache
        const fetchOptions = {
          credentials: 'same-origin',
          headers: {
            'X-Prefetch': 'true',  // Custom header to identify prefetch requests
            'Accept': 'text/html'
          }
        };
  
        const response = await fetch(normalizedUrl, fetchOptions);
        
        if (response.ok && response.status === 200) {
          await cache.put(normalizedUrl, response.clone());
          prefetchedUrls.add(normalizedUrl);
          
          // Manage cache size after adding new entry
          await manageCacheSize();
          
          Logger.debug(`Prefetched and cached: ${normalizedUrl}`);
        }
      } catch (error) {
        Logger.error(`Prefetch failed for ${normalizedUrl}`, error);
      }
    };
  
    const updateMainContent = async (url) => {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        let response;
  
        // Try cached version first
        const cachedResponse = await cache.match(normalize(url));
        
        if (cachedResponse) {
          Logger.debug('Using cached response');
          response = cachedResponse;
        } else {
          // Fetch live if not in cache
          response = await fetch(url, {
            credentials: 'same-origin',
            headers: {
              'Accept': 'text/html'
            }
          });
        }
  
        if (!response.ok) {
          throw new Error(`Failed to load page: ${response.status}`);
        }
  
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newMainContent = doc.querySelector('.content');
        
        if (newMainContent) {
          // Comprehensive page update
          document.title = doc.title;
          mainContent.innerHTML = newMainContent.innerHTML;
          
          // Update meta tags
          updateMetaTags(doc);
          
          // Advanced history management
          history.pushState({ 
            path: url, 
            scrollPosition: window.scrollY 
          }, '', url);
          
          // Re-initialize page components
          setupHoverListeners();
          triggerPageLoadEvents();
          
          // Scroll management
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      } catch (error) {
        Logger.error('Content update failed', error);
        
        // Offline/error fallback
        try {
          const offlinePage = await fetch(CONFIG.OFFLINE_FALLBACK_URL);
          if (offlinePage.ok) {
            mainContent.innerHTML = await offlinePage.text();
          }
        } catch {
          mainContent.innerHTML = '<p>Unable to load page. Please check your connection.</p>';
        }
      }
    };
  
    const updateMetaTags = (newDoc) => {
      const metaSelectors = [
        'meta[name="description"]', 
        'meta[property^="og:"]', 
        'link[rel="canonical"]'
      ];
  
      metaSelectors.forEach(selector => {
        const existingTags = document.querySelectorAll(selector);
        const newTags = newDoc.querySelectorAll(selector);
  
        existingTags.forEach(tag => tag.remove());
        newTags.forEach(tag => document.head.appendChild(tag.cloneNode(true)));
      });
    };
  
    const triggerPageLoadEvents = () => {
      // Custom event for other scripts to hook into
      const pageLoadEvent = new CustomEvent('dynamicPageLoad', {
        detail: { url: window.location.href }
      });
      document.dispatchEvent(pageLoadEvent);
    };
  
    const setupHoverListeners = () => {
      const links = [
        ...document.querySelectorAll('.article-link'),
        ...document.querySelectorAll('.pagination .page-item:not(.active) a, .nav-link'),
        document.querySelector('.navbar-logo-wrapper')
      ].filter(Boolean);
      
      links.forEach(link => {
        const linkUrl = link?.href;
        const normalizedUrl = normalize(linkUrl);
        
        if (linkUrl && 
            !linkUrl.startsWith('mailto:') && 
            !prefetchedUrls.has(normalizedUrl)) {
          link.addEventListener('mouseenter', () => {
            queuePrefetch(normalizedUrl);
          });
        }
      });
      
      !isRoot(window.location.pathname) && queuePrefetch('/');
    };
  
    const queuePrefetch = (pathname) => {
      if (!pathname?.length) return;
      
      const schedule = fn => ('requestIdleCallback' in window)
        ? requestIdleCallback(fn, { timeout: CONFIG.PREFETCH_TIMEOUT })
        : setTimeout(fn, CONFIG.PREFETCH_TIMEOUT);
      
      schedule(() => prefetchArticle(pathname));
    };
  
    // Navigation event handlers
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && 
          link.hostname === window.location.hostname && 
          !link.href.startsWith('mailto:')) {
        e.preventDefault();
        const url = link.href;
        if (url !== window.location.href) {
          updateMainContent(url);
        }
      }
    });
  
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.path) {
        // Restore scroll position if available
        if (e.state.scrollPosition !== undefined) {
          window.scrollTo(0, e.state.scrollPosition);
        }
        updateMainContent(e.state.path);
      }
    });
  
    // Performance and connectivity monitoring
    window.addEventListener('online', () => {
      Logger.debug('Network connection restored');
    });
  
    window.addEventListener('offline', () => {
      Logger.error('Network connection lost');
    });
  
    // Initial setup
    setupHoverListeners();
  });