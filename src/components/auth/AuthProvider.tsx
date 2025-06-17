import { useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { hasUserAuthenticatedThisSession } from '../../utils/sessionStorage';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { checkAuth, isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Keep track of initial authentication check
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // This helps prevent flickering - we'll wait a minimum amount of time to show loader
  // to avoid rapid UI changes that feel jarring
  const [loadingMinTimeElapsed, setLoadingMinTimeElapsed] = useState(false);
    useEffect(() => {
    // Ensure loading shows for at least 500ms to prevent flashing
    const timer = setTimeout(() => setLoadingMinTimeElapsed(true), 500);
    
    // Hard safety timeout - force redirect if still loading after 8 seconds
    const hardTimeoutTimer = setTimeout(() => {
      console.warn('Critical timeout reached - forcing hard redirect to login');
      window.location.href = '/login';
    }, 8000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(hardTimeoutTimer);
    };
  }, []);// Force a strict authentication check when first mounting
  useEffect(() => {
    let isMounted = true;
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        console.warn('Auth check timed out - forcing navigation to login');
        // Force navigation to login screen
        navigate('/login', { replace: true });
        setAuthCheckComplete(true);
        setIsLoading(false);
      }
    }, 5000); // 5 seconds maximum wait time
    
    const strictAuthCheck = async () => {
      try {
        // Check if user has authenticated in this browser session
        // We use this instead of sessionStorage.getItem('app-visited') to make it clearer
        const hasAuthenticatedInSession = sessionStorage.getItem('user-authenticated-this-session') === 'true';
        
        // Force login on first visit in this browser session
        if (!hasAuthenticatedInSession) {
          console.log('User has not authenticated in this session, forcing login');
          
          // Clear any potential cached authentication to force verification
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
          localStorage.removeItem('auth-timestamp');
          localStorage.removeItem('auth-expiry');
          localStorage.removeItem('auth-saved');
          localStorage.removeItem('auth-checking');
          
          // Redirect to login for proper authentication
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
          setAuthCheckComplete(true);
          return;
        }
        
        // For subsequent page loads in the same session, check authentication normally
        const isAuthenticated = await checkAuth();
        
        if (!isAuthenticated) {
          // If we're not at the login page already, redirect there
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        } else if (location.pathname === '/login' && user) {
          // We're authenticated but on login page, redirect to dashboard
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Authentication verification failed:', error);
        // On any auth error, go to login
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } finally {
        if (isMounted) {
          setAuthCheckComplete(true);
        }
      }
    };
      strictAuthCheck();
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [location.pathname, navigate, checkAuth, user, authCheckComplete]);
  // Handle auth state initialization and changes
  useEffect(() => {
    // This flag prevents race conditions during authentication check
    let isMounted = true;
    
    // Keep the loading state active until we finish all checks
    setIsLoading(true);
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        console.warn('Firebase auth state check timed out - forcing navigation to login');
        // Force completion and navigation
        setAuthCheckComplete(true);
        setIsLoading(false);
        navigate('/login', { replace: true });
      }
    }, 6000); // 6 seconds maximum wait time
    
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isMounted) {
        try {
          if (firebaseUser) {
            // User is signed in, refresh token and auth state
            await checkAuth();
          } else {
            // User is signed out, clear auth state and redirect if needed
            await checkAuth();
            if (location.pathname !== '/login') {
              navigate('/login', { replace: true });
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          // On error, redirect to login
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        } finally {
          if (isMounted) {
            setAuthCheckComplete(true);
            setIsLoading(false);
          }
        }
      }
    });

    // Cleanup subscription and prevent state updates after unmount
    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(safetyTimeout);
    };  }, [checkAuth, location.pathname, navigate, authCheckComplete]);  
  
  // Only show loading UI if both conditions are true:
  // 1. We're still loading
  // 2. We've passed the minimum loading time (to prevent flashing)
  // This creates a smoother experience
  if (isLoading || !loadingMinTimeElapsed) {
    return (
      <div className="fixed inset-0 bg-white flex min-h-screen items-center justify-center z-50 loading-screen" id="auth-loading-screen">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading your session...</p>
          {/* Add subtle logo or branding if available */}
          <div className="mt-8 opacity-50">
            <p className="text-sm text-gray-500">ASP Cranes CRM</p>
          </div>{/* Add a retry button in case of hanging */}
          <button 
            onClick={() => {
              console.log('Manual auth retry requested - forcing hard reload');
              // Clear all auth state
              localStorage.removeItem('auth-token');
              localStorage.removeItem('auth-user');
              localStorage.removeItem('auth-timestamp');
              localStorage.removeItem('auth-expiry');
              localStorage.removeItem('auth-saved');
              localStorage.removeItem('auth-checking');
              localStorage.removeItem('app-starting');
              
              // Force hard reload to login
              window.location.href = '/login';
            }} 
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Click here if loading takes too long
          </button>
        </div>
      </div>
    );
  }
  // Critical: Only render children after the auth state is fully determined
  // This prevents any premature navigation that could show login page briefly
  if (!authCheckComplete) {
    return (
      <div className="fixed inset-0 bg-white flex min-h-screen items-center justify-center z-50 loading-screen" id="dashboard-loading-screen">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Preparing your dashboard...</p>
          {/* Add a retry button in case of hanging */}
          <button 
            onClick={() => {
              console.log('Manual dashboard prep retry - forcing hard reload');
              localStorage.removeItem('auth-checking');
              localStorage.removeItem('app-starting');
              window.location.href = '/login';
            }} 
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Click here if loading takes too long
          </button>
        </div>
      </div>
    );
  }
  // Wrap in Suspense to handle any async code rendering
  return children;
}
