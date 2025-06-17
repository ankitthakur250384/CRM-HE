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
    // Skip additional checks if we're on the login page
    const isLoginPage = window.location.pathname === '/login';
    if (isLoginPage) {
      // No need to force login if we're already there
      return null;
    }
    
    // Check for Zustand persisted auth data first (it's more reliable)
    const persistedAuth = localStorage.getItem('auth-storage');
    if (persistedAuth) {
      try {
        // If we have persisted auth data and we're being asked to get auth data,
        // we should mark the session as authenticated
        sessionStorage.setItem('user-authenticated-this-session', 'true');
        
        // Continue to check our backup storage mechanism
      } catch (e) {
        console.error('Error parsing persisted auth:', e);
      }
    }
    
    // Get our backup auth data
    const token = localStorage.getItem('auth-token');
    const userStr = localStorage.getItem('auth-user');
    const timestamp = localStorage.getItem('auth-timestamp');
    const expiry = localStorage.getItem('auth-expiry');
    const authSaved = localStorage.getItem('auth-saved');
    
    // Basic validation - need both token and user and must be a complete saved record
    if (!token || !userStr || authSaved !== 'complete') {
      // Before returning null, check if we have zustand auth data that can be used
      if (persistedAuth) {
        // We have zustand auth but our backup is missing, try to recreate it
        try {
          const parsedAuth = JSON.parse(persistedAuth);
          if (parsedAuth.state?.user && parsedAuth.state?.token) {
            // Recreate our backup from zustand state
            console.log('Recreating backup auth from zustand state');
            saveAuthToStorage(parsedAuth.state.user, parsedAuth.state.token);
            
            // Return the recreated auth data
            return {
              user: parsedAuth.state.user,
              token: parsedAuth.state.token,
              isStale: false
            };
          }
        } catch (e) {
          console.error('Failed to parse zustand auth data:', e);
        }
      }
      return null;
    }
    
    // Parse timestamp info
    const user = JSON.parse(userStr);
    const timestampValue = timestamp ? parseInt(timestamp, 10) : 0;
    const expiryValue = expiry ? parseInt(expiry, 10) : 0;
    const now = Date.now();
    
    // Check if token is completely expired (hard cutoff)
    const isExpired = expiryValue > 0 && now > expiryValue;
    if (isExpired) {
      console.log('Auth token expired, forcing re-login');
      clearAuthFromStorage(); // Clean up expired token
      return null;
    }
    
    // Calculate if the token is stale (but still valid)
    const isStale = now - timestampValue > TOKEN_VALIDITY_PERIOD_MS;
    
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
