/**
 * Utility to detect manual reloads and set the appropriate flags
 */

// Global flag to track if we're currently in a reload cycle
let isHandlingReload = false;

export function initReloadDetector() {
  // CRITICAL: Check if we've already detected a loop and add a visible notification
  if (localStorage.getItem('reload-loop-detected') === 'true') {
    console.error('🚨 RELOAD LOOP DETECTED - Breaking cycle');
    
    // Reset all auth state which might be causing the loop
    sessionStorage.clear();
    localStorage.removeItem('reload-loop-detected');
    localStorage.removeItem('app-starting');
    localStorage.removeItem('auth-checking');
    
    // Set a flag to indicate we've handled the loop
    localStorage.setItem('reload-loop-handled', Date.now().toString());
    
    // Show a visible notification to the user
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.innerHTML += `
        <div style="position:fixed; bottom:0; left:0; right:0; background-color:#f44336; color:white; padding:12px; text-align:center; z-index:9999;">
          Reload cycle detected and stopped. Please <a href="/login" style="color:white; text-decoration:underline;">click here</a> to login.
        </div>
      `;
    }
  }

  // If we're already handling a reload, don't attach multiple listeners
  if (isHandlingReload) {
    console.log('🛑 Reload detector already initialized');
    return;
  }
  
  isHandlingReload = true;

  // Listen for beforeunload event to detect manual reloads
  window.addEventListener('beforeunload', () => {
    console.log('📝 Page unload detected - marking as manual reload');
    sessionStorage.setItem('manual-reload', 'true');
    // Also set a timestamp so we can detect rapid reloads
    sessionStorage.setItem('last-reload-time', Date.now().toString());
    // Record the current path to detect navigation vs reload
    sessionStorage.setItem('last-page-path', window.location.pathname);
  });

  // Sometimes the beforeunload event isn't captured, so we also check on page load
  if (window.performance) {
    try {
      let navType: any;
      
      // Try to use old navigation API first
      if (window.performance.navigation) {
        navType = window.performance.navigation.type;
      } 
      // Fall back to newer API if available
      else if (window.performance.getEntriesByType) {
        const navEntry = window.performance.getEntriesByType('navigation')[0] as any;
        navType = navEntry?.type;
      }
         
      if (navType === 1 || navType === 'reload') { // TYPE_RELOAD
        console.log('📝 Page reload detected via performance API');
        sessionStorage.setItem('manual-reload', 'true');
        sessionStorage.setItem('last-reload-time', Date.now().toString());
      }
      
      // Track reload frequency to detect potential loops
      const lastReloadTime = parseInt(sessionStorage.getItem('last-reload-time') || '0', 10);
      const now = Date.now();
      const timeSinceLastReload = now - lastReloadTime;
      
      // If reloads are happening too quickly (< 5 seconds), may be in a reload loop
      if (lastReloadTime && timeSinceLastReload < 5000) {
        const reloadCount = parseInt(sessionStorage.getItem('reload-count') || '0', 10);
        const newReloadCount = reloadCount + 1;
        sessionStorage.setItem('reload-count', newReloadCount.toString());
        
        console.warn(`⚠️ Frequent reloads detected! ${newReloadCount} reloads in rapid succession.`);
        
        // If we detect a loop of 3+ reloads, take emergency action
        if (newReloadCount >= 3) {
          console.error('🚨 RELOAD LOOP DETECTED - Taking emergency action');
          
          // Forcefully stop the reload loop
          localStorage.setItem('reload-loop-detected', 'true');
          localStorage.setItem('reload-loop-time', now.toString());
          
          // Completely reset any state that might be triggering reloads
          sessionStorage.clear();
          
          // Remove any flags that might trigger auth changes
          localStorage.removeItem('app-starting');
          localStorage.removeItem('auth-checking');
          localStorage.removeItem('reload-loop-handled');
          localStorage.setItem('auth-loop-broken', 'true');
          
          // If we're not on login page, force redirect
          if (!window.location.pathname.includes('/login')) {
            console.log('🚨 Redirecting to login to break loop');
            // Use setTimeout to allow logging to complete
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          } else {
            // On login page, we'll just stop any further actions
            // Force display a message in page
            const rootEl = document.getElementById('root');
            if (rootEl) {
              rootEl.innerHTML += `
                <div style="position:fixed; bottom:0; left:0; right:0; background-color:#f44336; color:white; padding:12px; text-align:center; z-index:9999;">
                  Reload cycle detected and stopped. The page will now work normally.
                </div>
              `;
            }
          }
          
          // Return early to prevent further execution that might trigger reloads
          return;
        }
      } else {
        // Reset count if reloads are reasonably spaced
        sessionStorage.setItem('reload-count', '1');
      }
    } catch (e) {
      console.error('Error in reload detection:', e);
    }
  }
  
  // Check for an existing reload loop flag and clear it if it's old
  const reloadLoopTime = parseInt(localStorage.getItem('reload-loop-time') || '0', 10);
  if (reloadLoopTime && Date.now() - reloadLoopTime > 60000) { // 1 minute
    // Clear old loop detection flags
    localStorage.removeItem('reload-loop-detected');
    localStorage.removeItem('reload-loop-time');
  }
  
  console.log('🔄 Reload detector initialized');
  
  // CRITICAL: Add MutationObserver to detect React sync errors
  // These often cause reload loops by triggering React error boundaries
  try {
    // Start a mutation observer to detect React sync errors in the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.target.nodeName === 'BODY') {
          // Look for React error messages that appear in the DOM
          const errorElements = document.querySelectorAll('[data-reactroot]');
          for (const el of errorElements) {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('error') || text.includes('crashed')) {
              console.error('🚨 Detected React error in DOM - potential loop trigger');
              localStorage.setItem('react-error-detected', 'true');
              localStorage.setItem('reload-loop-detected', 'true');
            }
          }
        }
      }
    });
    
    // Start observing the document body for error messages
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  } catch (e) {
    console.error('Error setting up mutation observer:', e);
  }
}
