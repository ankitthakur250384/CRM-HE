/**
 * sessionStorage.ts - Helper functions for managing persistent session data
 * SIMPLIFIED VERSION - Removes all auto-login functionality
 */
import { User } from '../types/auth';

/**
 * Saves the authentication data as a backup for persistence
 * Only saves if there was an explicit login action
 */
export const saveAuthToStorage = (user: User, token: string): void => {
  try {
    // Only save if explicit login was performed
    if (localStorage.getItem('explicit-login-performed') === 'true') {
      localStorage.setItem('auth-token', token);
      localStorage.setItem('auth-user', JSON.stringify(user));
      localStorage.setItem('auth-saved', 'complete');
    } else {
      console.log('Not saving auth data - no explicit login detected');
    }
  } catch (error) {
    console.error('Failed to save auth data to local storage:', error);
  }
};

/**
 * Clears all authentication data from storage
 */
export const clearAuthFromStorage = (): void => {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user');
  localStorage.removeItem('auth-saved');
  localStorage.removeItem('auth-checking');
  localStorage.removeItem('explicit-login-performed');
  sessionStorage.removeItem('explicit-auth-action');
};
