import { ReactNode, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children?: ReactNode;
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

/**
 * A wrapper component that protects routes requiring authentication
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  allowedRoles
}: ProtectedRouteProps) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  
  // Check if we're in the middle of an auth operation
  // This prevents the login page flash during reload
  const isAuthenticating = localStorage.getItem('auth-checking') === 'true';
  
  // On initial render, verify authentication status
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      try {
        const isValid = await checkAuth();
        
        // If verification fails but we have cached auth, trust the cache temporarily
        // This prevents flashing during reloads
        if (!isValid && localStorage.getItem('auth-token')) {
          // We'll let the AuthProvider handle the final decision
          console.log('Using cached auth while verification completes');
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
          localStorage.removeItem('auth-checking');
        }
      }
    };
    
    // Always verify auth on route change, but avoid showing loading state
    // if we're already authenticated
    if (!isAuthenticated || !user) {
      verifyAuth();
    } else {
      setIsChecking(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [checkAuth, isAuthenticated, user]);
  
  // Show loading while checking auth to prevent flash of redirect
  if (isChecking || isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  
  // First check if the user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Then check if they have the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render children or outlet
  return children ? <>{children}</> : <Outlet />;
}
