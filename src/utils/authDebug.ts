/**
 * Auth Debugging Utility
 * This file provides utility functions for debugging auth-related issues
 */

/**
 * Log all authentication-related storage items to help with debugging
 */
export function logAuthState() {
  try {
    console.group('🔐 Auth State Debug');
    
    // Session storage items
    console.log('📌 Session Storage:');
    console.log('  user-authenticated-this-session:', sessionStorage.getItem('user-authenticated-this-session'));
    console.log('  login-form-loaded:', sessionStorage.getItem('login-form-loaded'));
    
    // Local storage items
    console.log('📌 Local Storage:');
    console.log('  auth-token:', localStorage.getItem('auth-token') ? '[PRESENT]' : '[MISSING]');
    console.log('  auth-user:', localStorage.getItem('auth-user') ? '[PRESENT]' : '[MISSING]');
    console.log('  auth-timestamp:', localStorage.getItem('auth-timestamp'));
    console.log('  auth-expiry:', localStorage.getItem('auth-expiry'));
    console.log('  auth-saved:', localStorage.getItem('auth-saved'));
    console.log('  auth-checking:', localStorage.getItem('auth-checking'));
    console.log('  app-starting:', localStorage.getItem('app-starting'));
    console.log('  last-login-time:', localStorage.getItem('last-login-time'));
    
    // Zustand persisted auth
    const persistedAuth = localStorage.getItem('auth-storage');
    if (persistedAuth) {
      try {
        const parsed = JSON.parse(persistedAuth);
        console.log('📌 Zustand Auth State:');
        console.log('  isAuthenticated:', parsed.state?.isAuthenticated);
        console.log('  user:', parsed.state?.user ? '[PRESENT]' : '[MISSING]');
        console.log('  token:', parsed.state?.token ? '[PRESENT]' : '[MISSING]');
      } catch (e) {
        console.log('  Failed to parse Zustand state:', e);
      }
    } else {
      console.log('📌 Zustand Auth State: [MISSING]');
    }

    // Current URL
    console.log('📌 Current URL:', window.location.pathname);
    
    console.groupEnd();
  } catch (error) {
    console.error('Error logging auth state:', error);
  }
}

/**
 * Add this to window for easy debugging in browser console
 */
declare global {
  interface Window {
    debugAuth: () => void;
  }
}

// Expose to window object for console debugging
window.debugAuth = logAuthState;

/**
 * Initialize the debug tools
 */
export function initAuthDebug() {
  // Log auth state on page load and on storage changes
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Auth debug initialized');
    logAuthState();
    
    // Log when storage changes
    window.addEventListener('storage', (e) => {
      if (e.key && (e.key.includes('auth') || e.key === 'user-authenticated-this-session')) {
        console.log(`📊 Storage changed: ${e.key}`);
        logAuthState();
      }
    });
  });
}
