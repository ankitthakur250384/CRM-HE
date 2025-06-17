/**
 * PersistentAuth.ts
 * 
 * This module provides a highly reliable authentication persistence mechanism
 * that combines Firebase Auth with manual token persistence.
 */
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { getCurrentUser } from './authService';
import { User } from '../../types/auth';

// Storage keys used for manual auth persistence
const AUTH_TOKEN_KEY = 'persistent-auth-token';
const AUTH_USER_KEY = 'persistent-auth-user';
const AUTH_EXPIRY_KEY = 'persistent-auth-expiry';

/**
 * Save authentication state for maximum persistence
 */
export async function savePersistentAuth(user: User): Promise<void> {
  try {
    // Only proceed if we have a current user
    if (!auth.currentUser) {
      console.error('Cannot save persistent auth - no Firebase user');
      return;
    }

    // Get a fresh token with force refresh to ensure it's current
    const token = await auth.currentUser.getIdToken(true);

    // Calculate expiry - tokens last 1 hour by default
    // We set a slightly shorter expiry to be safe
    const expiry = Date.now() + (55 * 60 * 1000); // 55 minutes

    // Store in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_EXPIRY_KEY, expiry.toString());
    localStorage.setItem('auth-last-saved', Date.now().toString());

    // Also mark that user is authenticated for this session
    sessionStorage.setItem('user-authenticated-this-session', 'true');

    console.log('🔐 Auth persistence data saved successfully');
    
    // Schedule a background token refresh 5 minutes before expiry
    const refreshTime = 50 * 60 * 1000; // 50 minutes (5 min before expiry)
    setTimeout(() => {
      console.log('🔄 Background token refresh scheduled');
      auth.currentUser?.getIdToken(true)
        .then(newToken => {
          localStorage.setItem(AUTH_TOKEN_KEY, newToken);
          localStorage.setItem('auth-last-refreshed', Date.now().toString());
          console.log('✅ Token refreshed in background');
        })
        .catch(err => console.error('Failed to refresh token:', err));
    }, refreshTime);
  } catch (error) {
    console.error('Failed to save persistent auth:', error);
  }
}

/**
 * Restore authentication from persistent storage
 * Returns true if authentication was successfully restored
 */
export async function restorePersistentAuth(requirePriorSession = true): Promise<boolean> {
  try {
    console.log('🔄 Attempting to restore auth from persistent storage');
    
    // SECURITY CHECK: For fresh site visits, don't auto-login unless they've already logged in this session
    // This is the critical check to prevent auto-login on first visit to hosted app
    if (requirePriorSession && sessionStorage.getItem('user-authenticated-this-session') !== 'true') {
      console.log('🔒 SECURITY BLOCK: No prior authentication in this session - preventing auto-login');
      // Clear persistent auth to prevent future auto-login attempts
      clearPersistentAuth();
      return false;
    }
    
    // Additional check: If this is a first page visit in a new tab/window, prevent auto-login
    const isFirstPageVisit = !sessionStorage.getItem('page-visited');
    if (isFirstPageVisit) {
      console.log('🔒 First page visit detected - preventing auto-login for security');
      sessionStorage.setItem('page-visited', 'true');
      return false;
    }

    // First, check if Firebase already has a current user
    if (auth.currentUser) {
      // We already have a Firebase user - just need to update our store
      try {
        console.log('📌 Firebase user already authenticated:', auth.currentUser.uid);
        
        // Get user data
        const user = await getCurrentUser();
        if (user) {
          // Get a fresh token - force refresh to ensure it's valid
          const token = await auth.currentUser.getIdToken(true);

          // Update auth store
          useAuthStore.setState({
            user,
            token,
            isAuthenticated: true,
            error: null
          });

          // Save to storage and mark session as authenticated
          sessionStorage.setItem('user-authenticated-this-session', 'true');
          await savePersistentAuth(user);

          return true;
        }
      } catch (error) {
        console.error('Error getting current user data:', error);
      }
    }

    // Check if we have token and user in storage
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    const expiryStr = localStorage.getItem(AUTH_EXPIRY_KEY);

    // Verify we have required data
    if (!token || !userJson) {
      console.log('🔒 No persistent auth data found');
      return false;
    }

    // Check if token is expired
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
    if (expiry && Date.now() > expiry) {
      console.log('🔒 Persistent auth token expired');
      clearPersistentAuth();
      return false;
    }    // Parse user data
    let user: User;
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return false;
    }

    // Attempt to sign in with saved token if possible
    try {
      console.log('🔑 Attempting to sign in with saved credentials...');
      
      // Update auth store first (optimistically)
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
        error: null
      });

      // Mark that user is authenticated for this session
      sessionStorage.setItem('user-authenticated-this-session', 'true');
      
      // In the background, try to fetch fresh user data if possible
      setTimeout(async () => {
        try {
          // Check if we have Firebase auth after restore
          const currentUser = auth.currentUser;
          if (currentUser) {
            // If we have Firebase auth, refresh the token
            const freshToken = await currentUser.getIdToken(true);
            
            // Update the store with the fresh token
            useAuthStore.setState(state => ({
              ...state,
              token: freshToken
            }));
            
            // Save the fresh token
            localStorage.setItem(AUTH_TOKEN_KEY, freshToken);
          }
        } catch (e) {
          console.error('Error refreshing token after restore:', e);
        }
      }, 0);
    } catch (e) {
      console.error('Error during signin with saved token:', e);
      // Still proceed with local auth data
    }

    console.log('🔓 Auth successfully restored from persistent storage');
    return true;
  } catch (error) {
    console.error('Error restoring persistent auth:', error);
    return false;
  }
}

/**
 * Clear persistent authentication data
 */
export function clearPersistentAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
  console.log('🔒 Persistent auth data cleared');
}

/**
 * Check if we have persistent auth data
 */
export function hasPersistentAuth(): boolean {
  return !!localStorage.getItem(AUTH_TOKEN_KEY) && !!localStorage.getItem(AUTH_USER_KEY);
}
