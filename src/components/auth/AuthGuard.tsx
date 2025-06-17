import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  
  // Check if we're in the middle of an auth operation
  const isAuthenticating = localStorage.getItem('auth-checking') === 'true';
  
  // On initial render, verify authentication status
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      try {
        // Trust the cached auth temporarily to prevent flashing
        const cachedAuth = localStorage.getItem('auth-token');
        const isValid = await checkAuth();
        
        // If verification fails but we have cached auth, let the AuthProvider decide
        if (!isValid && cachedAuth) {
          console.log('Using cached auth temporarily in AuthGuard');
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };
    
    // Only do an extra check if we're not already authenticated
    if (!isAuthenticated || !user) {
      verifyAuth();
    } else {
      setIsChecking(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [checkAuth, isAuthenticated, user]);
  
  // Show a loading indicator while checking to prevent flash of redirect
  if (isChecking || isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login, but remember where they were going
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
