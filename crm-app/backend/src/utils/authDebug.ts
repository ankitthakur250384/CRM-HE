/**
 * Auth Debug Utility
 * 
 * A simplified version that replaces the removed auth debug helper.
 * This version provides minimal auth debugging support with no actual functionality in production.
 */

// Check if we're in development mode
const isDev = !import.meta.env.PROD && process.env.NODE_ENV !== 'production';

/**
 * Debug auth bypass check - ONLY enabled in development
 * Always returns false in production builds
 */
export const shouldBypassAuth = (): boolean => {
  if (!isDev) return false;
  
  try {
    // In development, check for a special localStorage flag
    return localStorage.getItem('debug_bypass_auth') === 'true';
  } catch (e) {
    return false;
  }
};

/**
 * Log authentication debug info
 * No-op in production
 */
export const logAuthDebug = (...args: any[]): void => {
  if (isDev) {
    console.log('[AUTH DEBUG]', ...args);
  }
};

/**
 * Reset auth debug state
 * No-op in production
 */
export const resetAuthDebugState = (): void => {
  if (isDev) {
    try {
      localStorage.removeItem('debug_bypass_auth');
      console.log('[AUTH DEBUG] Debug state reset');
    } catch (e) {
      // Ignore errors
    }
  }
};

export default {
  shouldBypassAuth,
  logAuthDebug,
  resetAuthDebugState
};
