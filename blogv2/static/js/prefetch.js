// Modern Navigation System
(function() {
    // Configuration Object
    const CONFIG = {
      CACHE_NAMESPACE: 'hugo-spa-cache-v1',
      MAX_CACHE_ENTRIES: 50,
      DEBUG: false
    };
  
    // Utility Functions
    const Utils = {
      log: (message, ...args) => {
        if (CONFIG.DEBUG) {
          console.log(`[NavSystem] ${message}`, ...args);
        }
      },
      error: (message, ...args) => {
        console.error(`[NavSystem Error] ${message}`, ...args);
      },
      sanitizeUrl: (url) => {
        try {
          const parsedUrl = new URL(url, window.location.origin);
          return parsedUrl.pathname + parsedUrl.search;
        } catch {
          return url;
        }
      }
    };
  
    // Advanced Caching Mechanism
    class ContentCache {
      constructor(namespace, maxEntries) {
        this.namespace = namespace;
        this.maxEntries = maxEntries;
      }
  
      async get(key) {
        try {
          const cache = await caches.open(this.namespace);
          return await cache.match(key);
        } catch (error) {
          Utils.error('Cache retrieval failed', error);
          return null;
        }
      }
  
      async set(key, response) {
        try {
          const cache = await caches.open(this.namespace);
          
          // Manage cache size
          const keys = await cache.keys();
          if (keys.length >= this.maxEntries) {
            // Remove oldest entries
            await cache.delete(keys[0]);
          }
  
          await cache.put(key, response.clone());
          Utils.log(`Cached: ${key}`);
        } catch (error) {
          Utils.error('Cache storage failed', error);
        }
      }
    }
  
    // Navigation State Manager
    class NavigationState {
      constructor() {
        this.state = {
          history: [],
          currentIndex: -1
        };
        this.initializeState();
      }
  
      initializeState() {
        const initialState = {
          url: window.location.pathname,
          scrollPosition: 0,
          timestamp: Date.now()
        };
        
        this.state.history.push(initialState);
        this.state.currentIndex = 0;
      }
  
      addEntry(url, scrollPosition) {
        const newEntry = {
          url,
          scrollPosition,
          timestamp: Date.now()
        };
  
        // Remove forward history if navigating to a new page
        this.state.history = this.state.history.slice(0, this.state.currentIndex + 1);
        
        this.state.history.push(newEntry);
        this.state.currentIndex++;
  
        // Limit history size
        if (this.state.history.length > 50) {
          this.state.history.shift();
          this.state.currentIndex--;
        }
      }
  
      getCurrentEntry() {
        return this.state.history[this.state.currentIndex];
      }
  
      getPreviousEntry() {
        return this.state.currentIndex > 0 
          ? this.state.history[this.state.currentIndex - 1]
          : null;
      }
  
      canGoBack() {
        return this.state.currentIndex > 0;
      }
  
      canGoForward() {
        return this.state.currentIndex < this.state.history.length - 1;
      }
  
      goBack() {
        if (this.canGoBack()) {
          this.state.currentIndex--;
          return this.getCurrentEntry();
        }
        return null;
      }
  
      goForward() {
        if (this.canGoForward()) {
          this.state.currentIndex++;
          return this.getCurrentEntry();
        }
        return null;
      }
    }
  
    // Core Navigation System
    class NavigationSystem {
      constructor() {
        this.cache = new ContentCache(
          CONFIG.CACHE_NAMESPACE, 
          CONFIG.MAX_CACHE_ENTRIES
        );
        this.state = new NavigationState();
        this.mainContent = document.querySelector('.content');
        
        this.initEventListeners();
      }
  
      initEventListeners() {
        // Link Interception
        document.addEventListener('click', this.handleLinkClick.bind(this));
        
        // Browser History Management
        window.addEventListener('popstate', this.handlePopState.bind(this));
      }
  
      async handleLinkClick(event) {
        const link = event.target.closest('a');
        
        if (!link || 
            link.hostname !== window.location.hostname || 
            link.href.startsWith('mailto:')) {
          return;
        }
  
        event.preventDefault();
        const url = Utils.sanitizeUrl(link.href);
  
        if (url === window.location.pathname) return;
  
        await this.navigateTo(url);
      }
  
      async handlePopState(event) {
        const currentPath = window.location.pathname;
        
        try {
          await this.navigateTo(currentPath, {
            updateHistory: false,
            restoreScroll: true
          });
        } catch (error) {
          Utils.error('Navigation failed', error);
          window.location.reload();
        }
      }
  
      async navigateTo(url, options = {}) {
        const {
          updateHistory = true,
          restoreScroll = false
        } = options;
  
        Utils.log(`Navigating to: ${url}`);
  
        try {
          // Check cache first
          let response = await this.cache.get(url);
          
          if (!response) {
            // Fetch from network
            response = await fetch(url, {
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html'
              }
            });
  
            if (!response.ok) throw new Error('Fetch failed');
            
            // Cache the response
            await this.cache.set(url, response.clone());
          }
  
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          const newContent = doc.querySelector('.content');
          const newTitle = doc.title;
  
          if (newContent) {
            // Update page content
            this.mainContent.innerHTML = newContent.innerHTML;
            document.title = newTitle;
  
            // Scroll management
            if (restoreScroll) {
              const savedState = this.state.getCurrentEntry();
              if (savedState) {
                window.scrollTo(0, savedState.scrollPosition);
              }
            } else {
              window.scrollTo(0, 0);
            }
  
            // Update history
            if (updateHistory) {
              this.state.addEntry(url, window.scrollY);
              history.pushState(
                { url, scrollPosition: window.scrollY }, 
                '', 
                url
              );
            }
  
            // Trigger custom event
            document.dispatchEvent(new CustomEvent('pageUpdated', { 
              detail: { url } 
            }));
  
            return true;
          }
  
          return false;
        } catch (error) {
          Utils.error('Navigation error', error);
          
          // Fallback to full page load
          window.location.href = url;
          return false;
        }
      }
  
      // Additional methods for programmatic navigation
      back() {
        const previousEntry = this.state.goBack();
        if (previousEntry) {
          this.navigateTo(previousEntry.url, {
            updateHistory: false,
            restoreScroll: true
          });
        }
      }
  
      forward() {
        const nextEntry = this.state.goForward();
        if (nextEntry) {
          this.navigateTo(nextEntry.url, {
            updateHistory: false,
            restoreScroll: true
          });
        }
      }
    }
  
    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
      // Expose debug mode
      window.DEBUG_NAV = (enable = true) => {
        CONFIG.DEBUG = enable;
      };
  
      // Create global navigation system
      window.NavigationSystem = new NavigationSystem();
    });
  })();