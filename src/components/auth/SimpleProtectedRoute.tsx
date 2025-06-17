import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children?: ReactNode;
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

/**
 * A simplified ProtectedRoute component with extensive debugging
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  allowedRoles
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();
  
  // Debug log authentication state when rendering a protected route
  console.log(`🔒 Protected Route Check - Authenticated: ${isAuthenticated}, User: ${user?.id || 'none'}`);
  
  // Basic check - no auth, no access
  if (!isAuthenticated || !user) {
    console.log(`❌ Route protection failed - redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }
  
  // Role check - if allowedRoles is specified, check if user has one of those roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`❌ Role protection failed - user has ${user.role} but needs one of [${allowedRoles.join(',')}]`);
    return <Navigate to="/dashboard" replace />;
  }
  
  // All checks passed - render children or outlet
  console.log('✅ Route protection passed - rendering protected content');
  
  return children ? <>{children}</> : <Outlet />;
}
