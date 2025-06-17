import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '../types/auth';
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
          // This is the main place we set this flag - ensuring login is tracked
          markUserAuthenticated();
          
          // Add a timestamp for the last successful login
          localStorage.setItem('last-login-time', Date.now().toString());
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },      logout: async () => {
        try {
          // Mark that we're actively logging out
          // This helps the auth listener avoid ambiguity during the logout process
          localStorage.setItem('logging-out', 'true');
          
          // Clear persistent auth first
          const { clearPersistentAuth } = await import('../services/firestore/persistentAuth');
          clearPersistentAuth();
          
          // Sign out from Firebase
          await signOutUser();
          
          // Clear all auth-related state and storage
          set({ user: null, token: null, isAuthenticated: false, error: null });
          clearAuthFromStorage();
          
          // Clear session authentication status to force login on next app open
          sessionStorage.removeItem('user-authenticated-this-session');
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        } finally {
          // Always clear the logging out flag, even on error
          setTimeout(() => {
            localStorage.removeItem('logging-out');
          }, 1000);
        }
      },checkAuth: async (): Promise<boolean> => {
        try {
          console.log('🔐 Running checkAuth in authStore');
          
          // If we're on the login page, no need to check auth
          if (window.location.pathname === '/login') {
            return false;
          }
          
          // FIREBASE CHECK: First check if Firebase already has a current user
          // This is the most reliable check since Firebase handles persistence itself
          if (auth.currentUser) {
            console.log('✅ Firebase auth check - found authenticated user:', auth.currentUser.uid);
            
            try {
              // Get a fresh token with force refresh
              const token = await auth.currentUser.getIdToken(true);
              
              // Get the user data from Firestore
              const user = await getCurrentUser();
              
              if (user) {
                // Update the store
                set({ 
                  user, 
                  token, 
                  isAuthenticated: true,
                  error: null
                });
                
                // Mark that user has authenticated in this session
                markUserAuthenticated();
                
                return true;
              }
            } catch (e) {
              console.error('Error getting user data from Firebase auth:', e);
            }
          }
          
          // PERSISTENT AUTH CHECK: Try to revive persistent auth state
          try {
            const { hasPersistentAuth, restorePersistentAuth } = await import('../services/firestore/persistentAuth');
            if (hasPersistentAuth()) {
              console.log('🔍 Found persistent auth data - attempting to restore');
              const restored = await restorePersistentAuth();
              if (restored) {
                console.log('✅ Successfully restored auth from persistent storage');
                return true;
              }
            }
          } catch (e) {
            console.error('Error checking persistent auth:', e);
          }
          
          // QUICK CHECK: If we already have state, use it (for faster UI rendering)
          const currentState = get();
          if (currentState.isAuthenticated && currentState.user && currentState.token) {
            console.log('🔐 Using existing auth state - already authenticated');
            
            // Still verify in the background but don't block UI
            setTimeout(async () => {
              try {
                // Check with Firebase if our user is still valid
                if (auth.currentUser) {
                  console.log('🔐 Background verification of existing auth');
                  const token = await auth.currentUser.getIdToken(true);
                  if (token) {                    // Refresh token in storage
                    if (currentState.user) {
                      saveAuthToStorage(currentState.user, token);
                      
                      // Also save to persistent auth
                      const { savePersistentAuth } = await import('../services/firestore/persistentAuth');
                      await savePersistentAuth(currentState.user);
                    }
                  }
                }
              } catch (e) {
                console.error('Background token refresh failed:', e);
              }
            }, 0);
            
            return true;
          }
          
          // CRITICAL: Flag to track if we successfully authenticated during this check
          let authenticationVerified = false;
          
          // Check if we're in a fresh app load (first navigation) or a reload
          const isInitialLoad = localStorage.getItem('app-starting') === 'true';
          
          // First try Firebase's current user - this is the most authoritative source
          if (auth.currentUser) {
            try {
              // We have a Firebase user, get fresh user data and token with timeout
              const userPromise = getCurrentUser();
              
              // Set up a timeout to prevent hanging
              const timeoutPromise = new Promise<null>((_, reject) => {
                setTimeout(() => reject(new Error('getCurrentUser timeout')), 5000);
              });
              
              // Race the promises to prevent hanging
              const user = await Promise.race([
                userPromise,
                timeoutPromise
              ]).catch(err => {
                console.error('User data fetch timed out:', err);
                return null;
              });
              
              if (user) {
                // Get token but don't force refresh to avoid unnecessary requests
                // Also apply a timeout to token fetch
                const tokenPromise = auth.currentUser.getIdToken(false);
                const timeoutTokenPromise = new Promise<null>((_, reject) => {
                  setTimeout(() => reject(new Error('getIdToken timeout')), 3000);
                });
                
                const token = await Promise.race([
                  tokenPromise,
                  timeoutTokenPromise
                ]).catch(err => {
                  console.error('Token fetch timed out:', err);
                  return null;
                });
                
                // Update state and mark as authenticated if we got both user and token
                if (token) {
                  set({ user, token, isAuthenticated: true, error: null });
                  
                  // Store as backup for persistence
                  saveAuthToStorage(user, token);
                  
                  // We're authenticated!
                  authenticationVerified = true;
                  return true;
                }
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
              // Add timeout protection for getCurrentUser
              const userPromise = getCurrentUser();
              const timeoutPromise = new Promise<null>((_, reject) => {
                setTimeout(() => reject(new Error('Cached auth check timeout')), 4000);
              });
              
              // Race promises to prevent hanging
              user = await Promise.race([
                userPromise,
                timeoutPromise
              ]).catch(err => {
                console.error('Cached auth validation timed out:', err);
                return null;
              });
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
          }          // One last check before failing: see if Firebase auth still has a user
          // This is crucial for handling page reloads where Firebase auth persists
          if (!authenticationVerified && auth.currentUser) {
            console.log('🔄 Found Firebase user on reload but verification incomplete');
            try {
              // Get fresh user data from Firestore
              const user = await getCurrentUser();
              if (user) {
                // Get a fresh token (but don't force refresh to avoid rate limits)
                const token = await auth.currentUser.getIdToken(false);
                if (token) {
                  console.log('🔄 Successfully recovered auth state after reload');
                  // Update state and storage
                  set({ user, token, isAuthenticated: true, error: null });
                  saveAuthToStorage(user, token);
                  sessionStorage.setItem('user-authenticated-this-session', 'true');
                  return true;
                }
              }
            } catch (e) {
              console.error('Error recovering auth state:', e);
            }
          }
            // One last fallback - check if we have existing state in the store
          const existingState = get();
          if (existingState.isAuthenticated && existingState.user && existingState.token) {
            console.log('🔄 Using existing auth state from store as last resort');
            // Just to be safe, mark the session as authenticated
            sessionStorage.setItem('user-authenticated-this-session', 'true');
            return true;
          }
          
          // Otherwise clear the state and return false
          set({ user: null, token: null, isAuthenticated: false, error: null });
          clearAuthFromStorage();
          return false;
        } catch (error) {
          console.error('Authentication check failed:', error);
          
          // Get current state before deciding what to do
          const currentState = get();
          const isFirstLoad = localStorage.getItem('app-starting') === 'true';
          
          // If we're on first app load, be strict about auth
          if (isFirstLoad) {
            set({ user: null, token: null, isAuthenticated: false, error: null });
            clearAuthFromStorage();
            return false;
          }
          
          // On reload or navigation errors, check if we have existing auth state
          if (currentState.isAuthenticated && currentState.user && currentState.token) {
            console.log('Error during auth check but using existing state');
            return true;
          }
          
          // Last resort - clear auth and return false
          set({ user: null, token: null, isAuthenticated: false, error: null });
          return false;
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
      // We need immediate hydration for proper auth persistence
      skipHydration: false,
      // Make sure we use localStorage (default), not sessionStorage
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
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
    try {
      console.log('💡 Starting auth store hydration');
      
      // Check for Firebase auth state first - this is the source of truth
      const currentFirebaseUser = auth.currentUser;
      if (currentFirebaseUser) {
        console.log('📌 Firebase auth already active - user authenticated');
        // We have an active Firebase session - mark that user has authenticated
        sessionStorage.setItem('user-authenticated-this-session', 'true');
      }
      
      // For login page, don't force rehydration as we want fresh login
      if (window.location.pathname === '/login') {
        console.log('📌 On login page - minimal hydration only');
        hasHydrated = true;
        useAuthStore.persist.rehydrate();
        return;
      }
      
      // Force immediate rehydration of the store
      console.log('📌 Full rehydration of auth store');
      
      // If we have auth data in localStorage, mark that user has authenticated this session
      // This allows us to maintain auth state across page reloads
      if (localStorage.getItem('auth-storage')) {
        console.log('📌 Found persistent auth data, marking session as authenticated');
        sessionStorage.setItem('user-authenticated-this-session', 'true');
      }
      
      // Rehydrate the store from persistent storage
      useAuthStore.persist.rehydrate();
      hasHydrated = true;
      
      // Also trigger a checkAuth to make sure we have current user data
      // This happens asynchronously so we don't block rendering
      setTimeout(async () => {
        try {
          // Skip auth check if on login page
          if (window.location.pathname !== '/login') {
            const { checkAuth, isAuthenticated, user } = useAuthStore.getState();
            
            console.log('📌 Current auth state after hydration:', 
              isAuthenticated ? `Authenticated as ${user?.name || 'unknown'}` : 'Not authenticated');
            
            // Check if Firebase has a current user that doesn't match our store
            if (currentFirebaseUser && (!isAuthenticated || !user)) {
              console.log('📌 Firebase has user but store does not - syncing state');
              // Get the user details from Firestore
              const freshUser = await getCurrentUser();
              if (freshUser) {
                const token = await currentFirebaseUser.getIdToken(false);
                // Update store with Firebase user
                useAuthStore.setState({ 
                  user: freshUser,
                  token,
                  isAuthenticated: true,
                  error: null
                });
                // Save to storage
                saveAuthToStorage(freshUser, token);
                sessionStorage.setItem('user-authenticated-this-session', 'true');
              }
            } else {
              // Run normal auth check
              await checkAuth();
            }
          }
        } catch (error) {
          console.error('Error during auth hydration check:', error);
        }
      }, 0);
    } catch (error) {
      console.error('Error during auth store hydration:', error);
      hasHydrated = true; // Mark as hydrated even on error to prevent loops
    }
  }
};