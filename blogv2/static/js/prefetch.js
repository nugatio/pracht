document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.content');
    
    // Enhanced navigation state management
    class NavigationManager {
      constructor() {
        // Initialize site navigation stack
        this.navigationStack = [];
        this.currentIndex = -1;
        
        // Initial page load
        this.addCurrentPageToStack();
      }
  
      addCurrentPageToStack() {
        const currentState = {
          path: window.location.pathname,
          scrollPosition: window.scrollY,
          timestamp: Date.now()
        };
  
        // Prevent duplicate entries
        if (this.navigationStack.length === 0 || 
            this.navigationStack[this.currentIndex].path !== currentState.path) {
          this.navigationStack.push(currentState);
          this.currentIndex++;
        }
  
        // Limit stack size
        if (this.navigationStack.length > 50) {
          this.navigationStack.shift();
          this.currentIndex--;
        }
      }
  
      getCurrentPage() {
        return this.navigationStack[this.currentIndex];
      }
  
      getPreviousPage() {
        return this.currentIndex > 0 
          ? this.navigationStack[this.currentIndex - 1] 
          : null;
      }
  
      navigateBack() {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          return this.navigationStack[this.currentIndex];
        }
        return null;
      }
  
      navigateForward() {
        if (this.currentIndex < this.navigationStack.length - 1) {
          this.currentIndex++;
          return this.navigationStack[this.currentIndex];
        }
        return null;
      }
    }
  
    // Global navigation manager
    const navManager = new NavigationManager();
  
    const updatePageContent = async (url, options = {}) => {
      const { 
        updateHistory = true, 
        restoreScroll = false,
        popState = false 
      } = options;
  
      try {
        // Normalize URL
        const normalizedUrl = new URL(url, window.location.origin).pathname;
  
        // Fetch page content
        const response = await fetch(normalizedUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/html'
          }
        });
  
        if (!response.ok) throw new Error('Failed to fetch page');
  
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
  
          // Scroll management
          if (restoreScroll) {
            const savedState = navManager.getCurrentPage();
            if (savedState && savedState.scrollPosition) {
              window.scrollTo(0, savedState.scrollPosition);
            }
          } else {
            window.scrollTo(0, 0);
          }
  
          // History management
          if (updateHistory) {
            const newState = {
              path: normalizedUrl,
              scrollPosition: window.scrollY,
              timestamp: Date.now()
            };
  
            if (!popState) {
              // Add to navigation stack
              navManager.addCurrentPageToStack();
              
              // Update browser history
              history.pushState(newState, '', normalizedUrl);
            }
          }
  
          // Trigger custom events
          document.dispatchEvent(new CustomEvent('pageUpdated', { 
            detail: { url: normalizedUrl } 
          }));
  
          return true;
        }
  
        return false;
      } catch (error) {
        console.error('Page update failed:', error);
        
        // Fallback to full page load
        window.location.href = url;
        return false;
      }
    };
  
    // Link interception
    const setupLinkInterception = () => {
      document.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        
        if (link && 
            link.hostname === window.location.hostname && 
            !link.href.startsWith('mailto:')) {
          e.preventDefault();
          
          const url = link.href;
          if (url !== window.location.href) {
            await updatePageContent(url);
          }
        }
      });
    };
  
    // History navigation handler
    const setupHistoryNavigation = () => {
      window.addEventListener('popstate', async (e) => {
        // Determine navigation direction
        const currentPath = window.location.pathname;
        const savedState = e.state;
  
        if (savedState) {
          // Check if going back or forward
          const previousPage = navManager.getPreviousPage();
          const isGoingBack = previousPage && previousPage.path === currentPath;
  
          // Restore page content
          await updatePageContent(currentPath, {
            updateHistory: false,
            restoreScroll: true,
            popState: true
          });
        }
      });
    };
  
    // Initialize navigation handling
    setupLinkInterception();
    setupHistoryNavigation();
  
    // Ensure initial page is in navigation stack
    navManager.addCurrentPageToStack();
  });