/**
 * Storage cleanup for development
 * 
 * This script clears localStorage and sessionStorage when the app is loaded in development.
 * This helps prevent stale state issues when testing authentication.
 */

// Function to clear storage
const clearStorage = () => {
  console.log('🧹 Cleaning up local/session storage for development.');
  
  // Check if this is a development environment
  if (import.meta.env.DEV) {
    // Clear only dev-specific items, not everything
    localStorage.removeItem('jwt-token');
    localStorage.removeItem('auth-state');
    localStorage.removeItem('auth-checking');
    localStorage.removeItem('app-starting');
    localStorage.removeItem('explicit-login-performed');
    
    // Keep the last login email for testing convenience
    // localStorage.removeItem('last-login-email');
    
    sessionStorage.removeItem('login-form-loaded');
    sessionStorage.removeItem('explicit-auth-action');
    sessionStorage.removeItem('user-authenticated-this-session');
    
    console.log('✅ Storage cleanup complete.');
  }
};

// Run cleanup on development builds
if (import.meta.env.DEV) {
  // If this is a fresh page load (not a hot reload)
  if (!window.localStorage.getItem('dev-session-id')) {
    // Create a session ID to track dev session
    window.localStorage.setItem('dev-session-id', Date.now().toString());
    // Clear storage
    clearStorage();
  }
}

export { clearStorage };
