/**
 * Firebase Auth State Change Listener - Simplified
 * Only responds to explicit login/logout actions
 */
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';

let isInitialized = false;

/**
 * Initialize the auth state listener
 * This version is simplified to NEVER auto-reload or auto-login
 */
export const initAuthStateListener = () => {
  // Skip if already initialized
  if (isInitialized) {
    console.log(' Auth state listener already initialized');
    return;
  }
  
  // Mark as initialized
  isInitialized = true;
  console.log(' Initializing simplified Firebase Auth listener - NO auto-login');
  
  // Clear any reload detection flags
  localStorage.removeItem('reload-loop-detected');
  localStorage.removeItem('auth-loop-broken');
  sessionStorage.removeItem('prevent-auto-reloads');
  
  // Set up basic auth listener
  onAuthStateChanged(auth, (firebaseUser) => {
    // Only respond to explicit login/logout actions
    const isExplicitAction = sessionStorage.getItem('explicit-auth-action') === 'true';
    
    if (!isExplicitAction) {
      console.log(' Ignoring automatic auth state change - requires explicit login');
      return;
    }
    
    // Process the auth change
    if (firebaseUser) {
      console.log(' User logged in via explicit action');
      
      // Update auth store
      const { setUser } = useAuthStore.getState();
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'User',
        role: 'admin', // Default role - should be retrieved from your user profile in a real app
      });
      
      // Clear the explicit action flag after processing
      sessionStorage.removeItem('explicit-auth-action');
    } else {
      console.log(' User logged out via explicit action');
      
      // Clear auth store
      const { clearUser } = useAuthStore.getState();
      clearUser();
      
      // Clear the explicit action flag after processing
      sessionStorage.removeItem('explicit-auth-action');
    }
  });
};
