import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types/auth';
import { signIn, signOutUser, getCurrentUser } from '../services/firestore/authService';
import { auth } from '../lib/firebase';
import { 
  saveAuthToStorage, 
  getAuthFromStorage, 
  clearAuthFromStorage,
  markUserAuthenticated,
  hasUserAuthenticatedThisSession
} from '../utils/sessionStorage';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Create the store with proper typing
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,login: async (email: string, password: string) => {
        try {
          set({ error: null });
          
          // First sign in with Firebase
          const user = await signIn(email, password);
          
          // Ensure we have a current user and get their token
          if (!auth.currentUser) {
            throw new Error('Authentication failed: No current user');
          }
          
          // Get token with force refresh to ensure it's current
          const token = await auth.currentUser.getIdToken(true);
          
          // Update state after successful authentication
          set({ 
            user, 
            token, 
            isAuthenticated: true,
            error: null
          });
          
          // Also save to localStorage for backup persistence
          saveAuthToStorage(user, token);
          
          // CRITICAL: Mark that user has authenticated in this session
          // This is the only place we set this flag - ensuring they must login
          // at least once per browser session
          markUserAuthenticated();
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },      logout: async () => {
        try {
          await signOutUser();
          set({ user: null, token: null, isAuthenticated: false, error: null });
          // Clear backup auth data
          clearAuthFromStorage();
          
          // Also clear session authentication status to force login on next app open
          sessionStorage.removeItem('user-authenticated-this-session');
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },checkAuth: async (): Promise<boolean> => {
        try {
          // CRITICAL: Flag to track if we successfully authenticated during this check
          let authenticationVerified = false;
          
          // Check if we're in a fresh app load (first navigation) or a reload
          const isInitialLoad = localStorage.getItem('app-starting') === 'true';
          
          // First try Firebase's current user - this is the most authoritative source
          if (auth.currentUser) {
            try {
              // We have a Firebase user, get fresh user data and token
              const user = await getCurrentUser();
              
              if (user) {
                // Get token but don't force refresh to avoid unnecessary requests
                const token = await auth.currentUser.getIdToken(false);
                
                // Update state and mark as authenticated
                set({ user, token, isAuthenticated: true, error: null });
                
                // Store as backup for persistence
                if (token) {
                  saveAuthToStorage(user, token);
                }
                
                // We're authenticated!
                authenticationVerified = true;
                return true;
              }
            } catch (e) {
              console.error('Error with current Firebase user:', e);
              // Continue to next method
            }
          }
          
          // Get cached auth only after trying Firebase auth
          const cachedAuth = getAuthFromStorage();
          const state = get(); // Get current state
            // CRITICAL CHECK: Has user authenticated at least once this session?
          const hasAuthenticatedThisSession = hasUserAuthenticatedThisSession();
          
          // If we're in a reload scenario, we can use cached credentials temporarily
          // but ONLY if we're handling a reload and not an initial app load
          // AND the user has already authenticated at least once in this browser session
          if (cachedAuth && !state.isAuthenticated && !isInitialLoad && hasAuthenticatedThisSession) {
            // Set a flag that we're checking authentication
            localStorage.setItem('auth-checking', 'true');
            
            // Try to get user from getCurrentUser helper to validate cached user
            let user;
            try {
              user = await getCurrentUser();
            } catch (e) {
              console.error('Failed to get current user:', e);
              user = null;
            }
            
            // CRITICAL SECURITY CHECK: Only accept cached credentials if we can validate the user
            if (user && user.id === cachedAuth.user.id) {
              // We've validated that the cached user matches a real user
              const token = cachedAuth?.token || null;
              
              if (token) {
                // Set as authenticated but mark that we need to re-verify
                set({ user, token, isAuthenticated: true, error: null });
                authenticationVerified = true;
                
                // Schedule a token refresh in the background
                setTimeout(() => {
                  auth.currentUser?.getIdToken(true)
                    .then(refreshedToken => {
                      saveAuthToStorage(user, refreshedToken);
                      set({ token: refreshedToken });
                    })
                    .catch(err => console.error('Background token refresh failed:', err));
                }, 100);
                
                return true;
              }
            }
          }
          
          // If we get here, authentication failed - clear state
          if (!authenticationVerified) {
            set({ user: null, token: null, isAuthenticated: false, error: null });
            clearAuthFromStorage();
            return false;
          }
          
          // Fallback return (should never reach here)
          return false;
        } catch (error) {
          console.error('Authentication check failed:', error);
          
          // Always clear auth on error during initial load for security
          if (localStorage.getItem('app-starting') === 'true') {
            set({ user: null, token: null, isAuthenticated: false, error: null });
            clearAuthFromStorage();
            return false;
          }
          
          // On reload errors, we can be more lenient to prevent UI flashing
          const state = get();
          return state.isAuthenticated;
        } finally {
          // Clean up checking flag when done
          localStorage.removeItem('auth-checking');
        }
      },
    }),    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      // Ensure we load from storage before any components render
      skipHydration: true
    }
  )
);

// Hydrate the store from storage as early as possible
// Hydration flag to prevent multiple hydrations
let hasHydrated = false;

// Hydrate the store from storage as early as possible
// This function is used in main.tsx to ensure auth state is loaded before rendering
export const hydrateAuthStore = () => {
  // Only rehydrate once to prevent infinite loops
  if (!hasHydrated) {
    // Force immediate rehydration of the store
    useAuthStore.persist.rehydrate();
    hasHydrated = true;
    
    // Also trigger a checkAuth to make sure we have current user data
    // This happens asynchronously so we don't block rendering
    setTimeout(() => {
      const { checkAuth } = useAuthStore.getState();
      checkAuth().catch((error: Error) => {
        console.error('Error during initial auth hydration check:', error);
      });
    }, 0);
  }
};