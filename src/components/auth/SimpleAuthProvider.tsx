import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logAuthState } from '../../utils/authDebug';
import { auth } from '../../lib/firebase';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Simplified AuthProvider that prevents hanging on login screens
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Simple loading state - when false, show a loading indicator
  const [isReady, setIsReady] = useState(false);
  const { checkAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  // Add a guard against multiple auth checks to prevent reload loops
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  
  // Force ready state if we've been waiting too long
  useEffect(() => {
    // Ensure we don't hang on the loading screen for more than 5 seconds
    const forceReadyTimeout = setTimeout(() => {
      if (!isReady) {
        console.warn('⚠️ Force ready state after timeout to prevent hanging');
        setIsReady(true);
      }
    }, 5000);
    
    // When the component mounts, check for loop detection and reset if needed
    const isLoopDetected = localStorage.getItem('reload-loop-detected') === 'true' || 
                           localStorage.getItem('auth-loop-broken') === 'true';
                           
    if (isLoopDetected) {
      // Stop infinite reloads by clearing all state
      console.error('🚨 Loop detected on AuthProvider mount - emergency reset');
      localStorage.removeItem('reload-loop-detected');
      localStorage.removeItem('auth-loop-broken');
      sessionStorage.clear();
      
      // Force ready state
      setIsReady(true);
      setAuthCheckComplete(true);
    }
    
    return () => clearTimeout(forceReadyTimeout);
  }, [isReady]);
  
  // Memoize the checkAuthentication function to avoid recreating it on each render
  const checkAuthentication = useCallback(async () => {
    try {
      // CRITICAL: Check for reload loop detection flag
      if (localStorage.getItem('reload-loop-detected') === 'true' || 
          localStorage.getItem('auth-loop-broken') === 'true') {
        console.error('🚨 Loop detected by reload detector - emergency state');
        // Clear the loop flags
        localStorage.removeItem('reload-loop-detected');
        localStorage.removeItem('auth-loop-broken');
        sessionStorage.clear();
        
        // Force to login page if needed
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          return;
        }
        
        // If we're already at login, just show the UI
        setIsReady(true);
        setAuthCheckComplete(true);
        return;
      }// Track authentication attempts to detect loops
      const authAttempts = parseInt(sessionStorage.getItem('auth-attempt-count') || '0', 10);
      const currentTime = Date.now();
      const lastAttemptTime = parseInt(sessionStorage.getItem('auth-last-attempt-time') || '0', 10);
      
      // If attempts are happening too quickly, might be in a loop
      if (lastAttemptTime && currentTime - lastAttemptTime < 2000) {
        // Increment local loop counter to break out faster
        setLoopCount(prev => prev + 1);
        
        if (loopCount > 2) {
          console.error('🚨 Loop detected in SimpleAuthProvider - breaking out');
          setIsReady(true);
          setAuthCheckComplete(true);
          // Set loop emergency flag in case we need to reload
          localStorage.setItem('auth-provider-loop-detected', 'true');
          return;
        }
      } else {
        // Reset loop counter if attempts are spaced out
        setLoopCount(0);
      }
      
      // Update attempt tracking
      sessionStorage.setItem('auth-attempt-count', (authAttempts + 1).toString());
      sessionStorage.setItem('auth-last-attempt-time', currentTime.toString());
      
      // Break out of potential loops
      if (authAttempts > 3) {
        console.warn('⚠️ Too many auth attempts - stopping to prevent loops');
        setIsReady(true);
        setAuthCheckComplete(true);
        return;
      }
      
      // Prevent multiple auth checks in the same component lifecycle
      if (authCheckComplete) {
        console.log('🛑 Auth check already completed - skipping to prevent loops');
        setIsReady(true);
        return;
      }
      
      console.log('🔍 Running auth check in SimpleAuthProvider');
      logAuthState(); // Log current auth state
      
      // First, check if this is the login page
      if (location.pathname === '/login') {
        // On login page, immediately set ready without any auth checks
        setIsReady(true);
        setAuthCheckComplete(true);
        return;
      }
      
      // Check if we have a valid auth in our store already
      const { user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && user) {
        console.log('✅ Auth store already has valid user - proceeding');
        setIsReady(true);
        setAuthCheckComplete(true);
        return;
      }
      
      // Check if Firebase has an active user already - MOST IMPORTANT CHECK
      // This should work correctly with Firebase persistence
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        console.log('🔑 Firebase auth already active with user:', firebaseUser.uid);
        
        // Perform a full auth check to ensure we have proper user data
        await checkAuth();
        
        setIsReady(true);
        setAuthCheckComplete(true);
        return;
      }
      
      // Import the persistent auth module
      const { restorePersistentAuth, hasPersistentAuth } = await import('../../services/firestore/persistentAuth');
      
      // Otherwise check our persistent auth system
      console.log('🔍 Checking for persistent auth data...');
      if (hasPersistentAuth()) {
        // Try to restore from persistent storage
        const restored = await restorePersistentAuth();
        if (restored) {
          console.log('✅ Auth state restored successfully from persistent storage');
          setIsReady(true);
          setAuthCheckComplete(true);
          return;
        } else {
          console.log('❌ Failed to restore persistent auth');
        }
      } else {
        console.log('❌ No persistent auth data available');
      }
        // We've tried Firebase and persistent auth - now we can check session
      // but we'll be careful not to redirect in a loop
      const hasAuthenticated = sessionStorage.getItem('user-authenticated-this-session') === 'true';
      const redirectRecently = sessionStorage.getItem('recent-login-redirect-time');
      const currentTimeStr = Date.now().toString();
      
      // If not authenticated and we haven't redirected recently (within 5 seconds)
      if (!hasAuthenticated && (!redirectRecently || (parseInt(currentTimeStr) - parseInt(redirectRecently)) > 5000)) {
        console.log('🔐 No authentication detected - redirecting to login once');
        sessionStorage.setItem('recent-login-redirect-time', currentTimeStr);
        navigate('/login', { replace: true });
      } else if (hasAuthenticated) {
        // We've authenticated before, so try a full auth check
        console.log('🔍 Running full auth check...');
        const validAuth = await checkAuth();
        
        if (!validAuth) {
          console.log('❌ Auth check failed');
          // Don't redirect here - let the app render and show an error if needed
        } else {
          console.log('✅ Auth check succeeded');
        }
      }
      
      // Always mark ready when check completes
      setIsReady(true);
      setAuthCheckComplete(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
      setIsReady(true);
    }
  }, [location.pathname, navigate, checkAuth]);  // Run once on mount only - removed dependencies to prevent re-runs and reload loops
  useEffect(() => {
    // CRITICAL: Check if we're in a loop by tracking auth check counts
    const authCheckCount = parseInt(sessionStorage.getItem('auth-check-count') || '0', 10);
    sessionStorage.setItem('auth-check-count', (authCheckCount + 1).toString());
    
    // If we've checked more than 3 times in quick succession, we might be in a loop
    if (authCheckCount > 3 && (Date.now() - parseInt(sessionStorage.getItem('auth-check-timestamp') || '0', 10) < 10000)) {
      console.warn('🛑 LOOP DETECTED - Too many auth checks in short time. Breaking out of potential loop.');
      setIsReady(true);
      setAuthCheckComplete(true);
      return;
    }
    
    sessionStorage.setItem('auth-check-timestamp', Date.now().toString());
    console.log('🔄 Running auth effect (count: ' + authCheckCount + ')');
    
    // HACK: If we've been loading for too long, force a redirect to login
    // But increased the timeout to avoid premature redirects
    const emergencyTimeout = setTimeout(() => {
      if (!isReady) {
        console.warn('⚠️ Emergency timeout reached - forcing redirect to login');
        sessionStorage.setItem('auth-emergency-triggered', 'true');
        // Don't use window.location.href here as it may contribute to loops
        // Instead set a flag and then check it on next render
        sessionStorage.setItem('auth-emergency-redirect', 'true');
        setIsReady(true); // Just show the UI even if not authenticated
      }
    }, 8000); // Increased timeout further
    
    // Skip auth check entirely if we're on login page for better performance
    if (location.pathname === '/login') {
      console.log('🔑 On login page - skipping auth checks');
      setIsReady(true);
      setAuthCheckComplete(true);
    } else {
      // For refresh/reload scenarios, check if Firebase has a current user or store already has user
      const { isAuthenticated, user } = useAuthStore.getState();
      const currentUser = auth.currentUser;
      
      if (isAuthenticated && user) {
        // We're already authenticated according to our store
        console.log('✅ Already authenticated in store - fast path render');
        setIsReady(true);
        setAuthCheckComplete(true);
      } else if (currentUser) {
        // Firebase says we're authenticated
        console.log('� Firebase user exists - fast path render');
        setIsReady(true);
        
        // Update auth store in the background without blocking UI
        setTimeout(() => {
          checkAuth().catch(e => console.error('Background auth check failed:', e));
          setAuthCheckComplete(true);
        }, 0);
      } else {
        // Last resort - run normal auth check, but only once
        if (!authCheckComplete) {
          console.log('🔍 No immediate auth found - running full check once');
          checkAuthentication()
            .finally(() => {
              // After check is done, set ready even if it failed
              // This prevents hanging on loading screens
              setTimeout(() => {
                if (!isReady) {
                  console.log('⚠️ Forcing ready state after auth check');
                  setIsReady(true);
                }
              }, 1000);
            });
        } else {
          setIsReady(true);
        }
      }
    }

    // Cleanup on unmount
    return () => {
      clearTimeout(emergencyTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  // Show loading UI until ready
  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-white flex min-h-screen items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading your session...</p>
          <div className="mt-8 opacity-50">
            <p className="text-sm text-gray-500">ASP Cranes CRM</p>
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Click here if loading takes too long
          </button>
        </div>
      </div>
    );
  }

  // Render children when ready
  return <>{children}</>;
}
