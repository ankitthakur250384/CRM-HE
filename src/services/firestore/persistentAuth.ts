/**
 * PersistentAuth.ts
 * 
 * This module maintains authentication tokens but does not auto-login users.
 * It only supports explicit login actions initiated by the user.
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
 * Save authentication state after explicit login
 */
export async function savePersistentAuth(user: User): Promise<void> {
  try {
    // Only proceed if we have a current user from explicit login
    if (!auth.currentUser || localStorage.getItem('explicit-login-performed') !== 'true') {
      console.log('Cannot save persistent auth - no explicit login detected');
      return;
    }

    // Get a fresh token with force refresh to ensure it's current
    const token = await auth.currentUser.getIdToken(true);

    // Calculate expiry - tokens last 1 hour by default
    const expiry = Date.now() + (55 * 60 * 1000); // 55 minutes

    // Store in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_EXPIRY_KEY, expiry.toString());
    localStorage.setItem('auth-last-saved', Date.now().toString());

    console.log('🔐 Auth persistence data saved after explicit login');
  } catch (error) {
    console.error('Failed to save persistent auth:', error);
  }
}

/**
 * Manual restore function - ONLY called from explicit user action
 * This should NEVER be called automatically
 */
export async function restorePersistentAuth(): Promise<boolean> {
  // Check if this is an explicit action
  if (sessionStorage.getItem('explicit-auth-action') !== 'true') {
    console.log('❌ Not an explicit auth action - rejecting auto-restore attempt');
    return false;
  }

  try {
    console.log('🔄 Attempting to restore auth from explicit action');
    
    // First, check if Firebase already has a current user
    if (auth.currentUser) {
      // We already have a Firebase user - just need to update our store
      try {
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

          return true;
        }
      } catch (error) {
        console.error('Error getting current user data:', error);
      }
    }

    // Only when explicitly triggered, check for tokens
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    
    // Verify we have required data
    if (!token || !userJson) {
      console.log('🔒 No persistent auth data found');
      return false;
    }

    // Parse user data
    let user: User;
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return false;
    }

    // Update auth store with explicit user action flag
    useAuthStore.setState({
      user,
      token,
      isAuthenticated: true,
      error: null
    });
    
    console.log('🔓 Auth successfully restored from persistent storage via explicit action');
    return true;  } catch (error) {
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
  localStorage.removeItem('explicit-login-performed');
  sessionStorage.removeItem('explicit-auth-action');
  console.log('🔒 Persistent auth data cleared');
}

/**
 * Check if we have persistent auth data
 */
export function hasPersistentAuth(): boolean {
  return !!localStorage.getItem(AUTH_TOKEN_KEY) && !!localStorage.getItem(AUTH_USER_KEY);
}
