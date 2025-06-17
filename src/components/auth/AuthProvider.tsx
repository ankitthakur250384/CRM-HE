import { useEffect, useState, ReactNode, Suspense } from 'react';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';

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
    return () => clearTimeout(timer);
  }, []);  // Force a strict authentication check when first mounting
  useEffect(() => {
    let isMounted = true;
    
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
    };
  }, [location.pathname, navigate, checkAuth, user]);

  // Handle auth state initialization and changes
  useEffect(() => {
    // This flag prevents race conditions during authentication check
    let isMounted = true;
    
    // Keep the loading state active until we finish all checks
    setIsLoading(true);
    
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
    };
  }, [checkAuth, location.pathname, navigate]);
  // Only show loading UI if both conditions are true:
  // 1. We're still loading
  // 2. We've passed the minimum loading time (to prevent flashing)
  // This creates a smoother experience
  if (isLoading || !loadingMinTimeElapsed) {
    return (
      <div className="fixed inset-0 bg-white flex min-h-screen items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading your session...</p>
          {/* Add subtle logo or branding if available */}
          <div className="mt-8 opacity-50">
            <p className="text-sm text-gray-500">ASP Cranes CRM</p>
          </div>
        </div>
      </div>
    );
  }

  // Critical: Only render children after the auth state is fully determined
  // This prevents any premature navigation that could show login page briefly
  if (!authCheckComplete) {
    return (
      <div className="fixed inset-0 bg-white flex min-h-screen items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  // Wrap in Suspense to handle any async code rendering
  return <Suspense fallback={<div className="fixed inset-0 bg-white flex items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>}>{children}</Suspense>;
}
