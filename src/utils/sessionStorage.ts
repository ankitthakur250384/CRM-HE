// sessionStorage.ts - Helper functions for managing persistent session data
// This complements our Zustand store to maintain authentication state
import { User } from '../types/auth';

// Enhanced session storage that helps prevent login page flashing

// Control how long auth data is considered valid without refresh
// For CRM applications where security is important, we use a shorter window
const TOKEN_VALIDITY_PERIOD_MS = 8 * 60 * 60 * 1000; // 8 hours

// Key for checking if user has authenticated in this browser session
const SESSION_AUTH_KEY = 'user-authenticated-this-session';

/**
 * Saves the authentication data as a backup for persistence
 * Also records precise timing information to help with auth restoration
 */
export const saveAuthToStorage = (user: User, token: string): void => {
  try {
    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user', JSON.stringify(user));
    
    // Set a timestamp to help us determine if data might be stale
    const now = Date.now();
    localStorage.setItem('auth-timestamp', now.toString());
    
    // Also track when the session should be considered expired
    const expiry = now + TOKEN_VALIDITY_PERIOD_MS;
    localStorage.setItem('auth-expiry', expiry.toString());
    
    // Add a flag showing we saved the auth data properly
    localStorage.setItem('auth-saved', 'complete');
  } catch (error) {
    console.error('Failed to save auth data to local storage:', error);
  }
};

interface AuthCacheData {
  user: User;
  token: string;
  isStale: boolean;
}

/**
 * Retrieves cached auth data from storage with enhanced validation
 */
export const getAuthFromStorage = (): AuthCacheData | null => {
  try {
    // CRITICAL: Check if user has authenticated this session before restoring any auth data
    // This ensures users must login at least once per browser session
    const hasAuthenticated = hasUserAuthenticatedThisSession();
    if (!hasAuthenticated) {
      console.log('No authentication recorded for this session, forcing login');
      clearAuthFromStorage(); // Clear any lingering auth data
      return null;
    }
    
    const token = localStorage.getItem('auth-token');
    const userStr = localStorage.getItem('auth-user');
    const timestamp = localStorage.getItem('auth-timestamp');
    const expiry = localStorage.getItem('auth-expiry');
    const authSaved = localStorage.getItem('auth-saved');
    const appStarting = localStorage.getItem('app-starting');
    
    // Basic validation - need both token and user and must be a complete saved record
    if (!token || !userStr || authSaved !== 'complete') {
      return null;
    }
    
    // Parse timestamp info
    const user = JSON.parse(userStr);
    const timestampValue = timestamp ? parseInt(timestamp, 10) : 0;
    const expiryValue = expiry ? parseInt(expiry, 10) : 0;
    const now = Date.now();
    
    // Check if token is completely expired (hard cutoff)
    const isExpired = expiryValue > 0 && now > expiryValue;
    if (isExpired && !appStarting) {
      console.log('Auth token expired, forcing re-login');
      clearAuthFromStorage(); // Clean up expired token
      return null;
    }
    
    // If data is older than threshold, consider it stale but still return
    // App startup gets extra grace period to prevent login flashing
    const stalePeriod = appStarting === 'true' 
      ? TOKEN_VALIDITY_PERIOD_MS * 2  // Double the period during app startup
      : TOKEN_VALIDITY_PERIOD_MS;
    
    const isStale = now - timestampValue > stalePeriod;
    
    // Return auth data with stale flag
    return {
      user,
      token,
      isStale
    };
  } catch (error) {
    console.error('Failed to read auth data from local storage:', error);
    return null;
  }
};

/**
 * Sets a flag in sessionStorage to indicate the user has authenticated in this session
 */
export const markUserAuthenticated = (): void => {
  sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
};

/**
 * Checks if user has authenticated at least once in this browser session
 */
export const hasUserAuthenticatedThisSession = (): boolean => {
  return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
};

/**
 * Clears all authentication data from storage
 */
export const clearAuthFromStorage = (): void => {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
  localStorage.removeItem('auth-timestamp');
  localStorage.removeItem('auth-expiry');
  localStorage.removeItem('auth-saved');
  localStorage.removeItem('auth-checking');
  
  // Don't clear sessionStorage for session tracking
  // We specifically want to remember if they logged in this session
};
