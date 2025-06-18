/**
 * Utility to track manual reloads and prevent automatic reloads
 * All automatic reload detection functionality has been removed
 */

// Track if initialization has happened
let isInitialized = false;

/**
 * Initialize reload detector - simplified version that only tracks manual reloads
 * and cleans up any flags that could trigger automatic reloads
 */
export function initReloadDetector() {
  // Prevent double initialization
  if (isInitialized) {
    return;
  }
  
  console.log('🛑 Auto-reload detection disabled');
  
  // Cleanup all reload-related flags to ensure no reload occurs
  localStorage.removeItem('reload-loop-detected');
  localStorage.removeItem('reload-loop-time');
  localStorage.removeItem('reload-loop-handled');
  localStorage.removeItem('app-starting');
  localStorage.removeItem('auth-checking');
  localStorage.removeItem('react-error-detected');
  sessionStorage.removeItem('manual-reload');
  sessionStorage.removeItem('last-reload-time');
  sessionStorage.removeItem('last-page-path');
  sessionStorage.removeItem('reload-count');
  sessionStorage.removeItem('reload-frequency-high');
  
  // Only keep track of manual user-initiated reloads via beforeunload
  // This is needed for the auth system but won't trigger any auto-reloads
  window.addEventListener('beforeunload', () => {
    console.log('📝 Page unload detected - marking as manual user action');
    sessionStorage.setItem('manual-reload', 'true');
    sessionStorage.setItem('last-page-path', window.location.pathname);
  });
  
  isInitialized = true;
}
