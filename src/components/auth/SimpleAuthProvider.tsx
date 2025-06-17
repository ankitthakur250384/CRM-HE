import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
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
  // State to track if auth check is completed to prevent multiple checks  // Track auth check completion for debugging and performance monitoring
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [loadingIndicatorShown, setLoadingIndicatorShown] = useState(false);
  
  // Log auth check completion for debugging
  useEffect(() => {
    if (authCheckComplete) {
      console.log('🏁 Auth check completed:', new Date().toISOString());
    }
  }, [authCheckComplete]);
  
  // Force ready state if we've been waiting too long
  useEffect(() => {
    // Ensure we don't hang on the loading screen for more than 3 seconds
    const forceReadyTimeout = setTimeout(() => {
      if (!isReady) {
        console.warn('⚠️ Force ready state after timeout to prevent hanging');
        setIsReady(true);
      }
    }, 3000); // Reduced from 5 seconds to 3 seconds to prevent noticeable loading periods
    
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
    
    // CRITICAL: Detect if loading indicators are shown too frequently
    if (!loadingIndicatorShown) {
      setLoadingIndicatorShown(true);
      
      // Track loading indicator frequency
      const lastLoadingTime = parseInt(localStorage.getItem('last-loading-time') || '0', 10);
      const now = Date.now();
      const timeSinceLastLoading = now - lastLoadingTime;
      
      // If loading indicators are shown too frequently, it could be a sign of reload issues
      if (lastLoadingTime && timeSinceLastLoading < 10000) { // Less than 10 seconds
        console.warn('⚠️ Loading indicators shown too frequently - may indicate periodic loading issue');
        
        // Force a longer cooldown period to break the cycle
        localStorage.setItem('auth-long-cooling-period', 'true');
        localStorage.setItem('last-loading-recovery-time', now.toString());
      }
      
      // Record the time of this loading indicator
      localStorage.setItem('last-loading-time', now.toString());
    }
    
    return () => clearTimeout(forceReadyTimeout);
  }, [isReady, loadingIndicatorShown]);
  
  // Memoize the checkAuthentication function to avoid recreating it on each render
  const checkAuthentication = useCallback(async () => {
    try {
      // CRITICAL: Check for reload loop detection flag
      if (localStorage.getItem('reload-loop-detected') === 'true' || 
          localStorage.getItem('auth-loop-broken') === 'true') {
        console.error('🚨 Loop detected by reload detector - emergency state');
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
      }
      
      // Track authentication attempts to detect loops
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
          return;
        }
      } else {
        // Reset loop counter if attempts are spaced out
        setLoopCount(0);
      }
      
      // Update attempt tracking
      sessionStorage.setItem('auth-attempt-count', (authAttempts + 1).toString());
      sessionStorage.setItem('auth-last-attempt-time', currentTime.toString());
      
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
        // Try to restore from persistent storage with required session auth
        // This prevents auto-login on fresh site visits
        const restored = await restorePersistentAuth(true);
        if (restored) {
          console.log('✅ Auth state restored successfully from persistent storage');
          setIsReady(true);
          setAuthCheckComplete(true);
          return;
        }
      }
      
      // We've tried Firebase and persistent auth - now we can check session
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
        await checkAuth();
      }
      
      // Always mark ready when check completes
      setIsReady(true);
      setAuthCheckComplete(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsReady(true);
      
      // On error, redirect to login only if not already there
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [location.pathname, navigate, checkAuth, loopCount]);
  
  useEffect(() => {
    // Check for long cooling period due to frequent loading indicators
    const inLongCoolingPeriod = localStorage.getItem('auth-long-cooling-period') === 'true';
    const lastRecoveryTime = parseInt(localStorage.getItem('last-loading-recovery-time') || '0', 10);
    const now = Date.now();
    
    // If we're in a long cooling period but it's been more than 30 seconds, exit it
    if (inLongCoolingPeriod && (now - lastRecoveryTime > 30000)) {
      console.log('🧊 Exiting long cooling period after timeout');
      localStorage.removeItem('auth-long-cooling-period');
    }
    
    // If we're in a long cooling period, skip all auth checks
    if (inLongCoolingPeriod) {
      console.log('🧊 In long cooling period - skipping all auth checks to break periodic loading');
      setIsReady(true);
      setAuthCheckComplete(true);
      return;
    }
    
    // Skip auth check entirely if we're on login page for better performance
    if (location.pathname === '/login') {
      console.log('🔑 On login page - skipping auth checks');
      setIsReady(true);
      setAuthCheckComplete(true);
      return;
    }
    
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
      console.log('🔑 Firebase user exists - fast path render');
      setIsReady(true);
      
      // Update auth store in the background without blocking UI
      setTimeout(() => {
        checkAuth().catch(e => console.error('Background auth check failed:', e));
        setAuthCheckComplete(true);
      }, 0);
    } else {
      // Last resort - run normal auth check once
      console.log('🔍 No immediate auth found - running full check once');
      checkAuthentication()
        .finally(() => {
          setTimeout(() => {
            if (!isReady) {
              console.log('⚠️ Forcing ready state after auth check');
              setIsReady(true);
            }
          }, 1000);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
