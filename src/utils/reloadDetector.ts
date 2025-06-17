/**
 * Utility to detect manual reloads and set the appropriate flags
 */

export function initReloadDetector() {
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
          // Set a flag that our app can check to break the loop
          localStorage.setItem('reload-loop-detected', 'true');
          localStorage.setItem('reload-loop-time', now.toString());
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
}
