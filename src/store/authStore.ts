/**
 * authStore.ts - Safe version
 * Uses PostgreSQL authentication instead of Firebase
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '../types/auth';
import { signIn, signOutUser, getCurrentUser } from '../services/postgresAuthService';
import { 
  saveAuthToStorage, 
  clearAuthFromStorage
} from '../utils/sessionStorage';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthState['user']) => void;
  clearUser: () => void;
}

// Track hydration to prevent loops
let hasHydrated = false;

// Create the store with proper typing
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      
      login: async (email: string, password: string) => {
        try {
          set({ error: null });
          
          // Sign in with PostgreSQL authentication service
          const user = await signIn(email, password);
            // Get token from local storage (it's set by the signIn function)
          const token = localStorage.getItem('jwt-token') || '';
          
          // Update state after successful authentication
          set({ 
            user, 
            token, 
            isAuthenticated: true,
            error: null
          });
          
          // Also save to localStorage for backup persistence
          saveAuthToStorage(user, token);
          
          // CRITICAL: Mark that user has authenticated explicitly
          localStorage.setItem('explicit-login-performed', 'true');
          
          // Add a timestamp for the last successful login
          localStorage.setItem('last-login-time', Date.now().toString());
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          // Mark that we're actively logging out
          localStorage.setItem('logging-out', 'true');
          
          // Sign out using PostgreSQL auth service
          await signOutUser();
          
          // Clear all auth-related state and storage
          set({ user: null, token: null, isAuthenticated: false, error: null });
          clearAuthFromStorage();
          
          // Remove the explicit login flag
          localStorage.removeItem('explicit-login-performed');
          // Remove JWT token
          localStorage.removeItem('jwt-token');
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        } finally {
          // Always clear the logging out flag, even on error
          setTimeout(() => {
            localStorage.removeItem('logging-out');
          }, 1000);
        }
      },
      
      // Simple helpers for setting/clearing user
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user, 
        error: null 
      }),
      
      clearUser: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        error: null 
      })
    }),
    {
      name: 'auth-storage',
      // Only store in localStorage if explicit login was performed
      skipHydration: true
    }
  )
);

/**
 * Hydrate the auth store - ONLY uses explicit login state
 * This version never auto-logs in
 */
export const hydrateAuthStore = async () => {
  // Only rehydrate once to prevent infinite loops
  if (!hasHydrated) {
    try {
      console.log('💡 Starting auth store hydration');
      
      // For login page, don't force rehydration as we want fresh login
      if (window.location.pathname === '/login') {
        console.log('📌 On login page - minimal hydration only');
        hasHydrated = true;
        return;
      }
      
      // Check for explicit login flag
      const hasExplicitLogin = localStorage.getItem('explicit-login-performed') === 'true';
      
      // Only proceed if user has explicitly logged in
      if (!hasExplicitLogin) {
        console.log('📌 No explicit login detected - skipping auth hydration');
        hasHydrated = true;
        return;
      }
      
      console.log('📌 User has explicitly logged in - hydrating auth store');
      
      // Check for JWT token and try to get current user
      const token = localStorage.getItem('jwt-token');
      if (token) {
        try {
          const user = await getCurrentUser();
          if (user) {
            useAuthStore.getState().setUser(user);
            useAuthStore.setState({ token, isAuthenticated: true });
          } else {
            // Token is invalid or expired
            useAuthStore.getState().clearUser();
            localStorage.removeItem('jwt-token');
            localStorage.removeItem('explicit-login-performed');
          }
        } catch (error) {
          console.error('Error getting current user:', error);
          useAuthStore.getState().clearUser();
        }
      }
      
      // Force immediate rehydration of the store for explicit logins only
      useAuthStore.persist.rehydrate();
      
      hasHydrated = true;
    } catch (error) {
      console.error('Error during auth store hydration:', error);
      hasHydrated = true; // Mark as hydrated even on error to prevent loops
    }
  }
};
