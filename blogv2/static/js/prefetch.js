document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.content');
    
    // Enhanced mobile detection
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
  
    // Comprehensive URL handling
    const normalizeUrl = (url) => {
      try {
        const parsedUrl = new URL(url, window.location.origin);
        return parsedUrl.pathname + parsedUrl.search;
      } catch {
        return url;
      }
    };
  
    const updatePageContent = async (url, updateHistory = true) => {
      try {
        const normalizedUrl = normalizeUrl(url);
        
        // Fetch page content
        const response = await fetch(normalizedUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/html'
          }
        });
  
        if (!response.ok) throw new Error('Failed to fetch p dage');
  
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Update page elements
        const newMainContent = doc.querySelector('.content');
        const newTitle = doc.title;
  
        if (newMainContent) {
          // Replace content
          mainContent.innerHTML = newMainContent.innerHTML;
          document.title = newTitle;
  
          // Update browser history explicitly
          if (updateHistory) {
            // Use replaceState for mobile to avoid stacking history
            const method = isMobile() ? 'replaceState' : 'pushState';
            history[method]({ 
              path: normalizedUrl, 
              timestamp: Date.now() 
            }, '', normalizedUrl);
          }
  
          // Scroll to top
          window.scrollTo(0, 0);
  
          // Trigger custom event for any additional setup
          document.dispatchEvent(new CustomEvent('pageUpdated', { 
            detail: { url: normalizedUrl } 
          }));
        }
      } catch (error) {
        console.error('Page update failed:', error);
        
        // Fallback mechanism
        if (isMobile()) {
          window.location.href = url;
        }
      }
    };
  
    // Link interception
    const setupLinkInterception = () => {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        
        if (link && 
            link.hostname === window.location.hostname && 
            !link.href.startsWith('mailto:')) {
          e.preventDefault();
          
          const url = link.href;
          if (url !== window.location.href) {
            updatePageContent(url);
          }
        }
      });
    };
  
    // Handle browser back/forward
    const setupHistoryNavigation = () => {
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.path) {
          // Prevent duplicate loads
          if (window.location.pathname !== e.state.path) {
            updatePageContent(e.state.path, false);
          }
        }
      });
    };
  
    // Handle potential navigation edge cases
    const setupNavigationFallbacks = () => {
      // Ensure proper navigation on first load
      if (isMobile()) {
        history.replaceState({ 
          path: window.location.pathname,
          timestamp: Date.now()
        }, '', window.location.pathname);
      }
  
      // Orientation change might require re-rendering
      window.addEventListener('orientationchange', () => {
        updatePageContent(window.location.pathname);
      });
    };
  
    // Initialize navigation handling
    setupLinkInterception();
    setupHistoryNavigation();
    setupNavigationFallbacks();
  });