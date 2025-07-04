/**
 * Token Refresh Service
 * 
 * This service handles automatic refresh of JWT tokens before they expire
 * to ensure continuous authentication during user sessions.
 */

import { getCurrentUser } from '../services/authService.client';

// Configuration
const REFRESH_INTERVAL_MINUTES = 10; // Check token every 10 minutes
const TOKEN_EXPIRY_THRESHOLD_MINUTES = 5; // Refresh if less than 5 minutes remaining

// Keep track of the refresh timer
let tokenRefreshTimer: number | null = null;

/**
 * Parse JWT token to get its payload
 */
const parseJwt = (token: string): { exp?: number } => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return {};
  }
};

/**
 * Check if the token is close to expiring
 */
const isTokenNearExpiry = (token: string): boolean => {
  const payload = parseJwt(token);
  
  if (!payload.exp) {
    return false; // Can't determine expiry, assume it's still valid
  }
  
  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeRemaining = expiryTime - currentTime;
  
  // Check if token will expire within the threshold
  return timeRemaining < TOKEN_EXPIRY_THRESHOLD_MINUTES * 60 * 1000;
};

/**
 * Refresh the JWT token if needed
 */
const refreshTokenIfNeeded = async (): Promise<void> => {
  try {
    // Get current token
    const token = localStorage.getItem('jwt-token');
    
    // If no token or not logged in, don't do anything
    if (!token || !localStorage.getItem('explicit-login-performed')) {
      return;
    }
    
    // Check if token needs refreshing
    if (isTokenNearExpiry(token)) {
      console.log('🔄 Token is near expiry, refreshing...');
      
      // Call the token refresh endpoint
      const refreshedUser = await getCurrentUser();
      
      if (refreshedUser) {
        console.log('✅ Token refreshed successfully');
        
        // Update Zustand store if it exists
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsedStorage = JSON.parse(authStorage);
            if (parsedStorage.state) {
              parsedStorage.state.user = refreshedUser;
              localStorage.setItem('auth-storage', JSON.stringify(parsedStorage));
            }
          }
        } catch (error) {
          console.error('Error updating auth storage:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
};

/**
 * Start the token refresh timer
 */
export const startTokenRefreshService = (): void => {
  // Clear any existing timer
  if (tokenRefreshTimer !== null) {
    clearInterval(tokenRefreshTimer);
  }
  
  // Start the refresh timer
  tokenRefreshTimer = window.setInterval(
    refreshTokenIfNeeded,
    REFRESH_INTERVAL_MINUTES * 60 * 1000
  );
  
  console.log('🔄 Token refresh service started');
  
  // Do an immediate check in case token is already near expiry
  refreshTokenIfNeeded();
};

/**
 * Stop the token refresh timer
 */
export const stopTokenRefreshService = (): void => {
  if (tokenRefreshTimer !== null) {
    clearInterval(tokenRefreshTimer);
    tokenRefreshTimer = null;
    console.log('🛑 Token refresh service stopped');
  }
};

/**
 * Initialize the token refresh service
 * Call this during application startup
 */
export const initializeTokenRefreshService = (): void => {
  // Only start if we have an explicit login
  const hasExplicitLogin = localStorage.getItem('explicit-login-performed') === 'true';
  
  if (hasExplicitLogin) {
    startTokenRefreshService();
  }
  
  // Listen for login/logout events to start/stop the service
  window.addEventListener('storage', (event) => {
    if (event.key === 'explicit-login-performed' && event.newValue === 'true') {
      startTokenRefreshService();
    } else if (event.key === 'explicit-login-performed' && !event.newValue) {
      stopTokenRefreshService();
    }
  });
};
