import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RefreshCw } from 'lucide-react';
import { monitorOperation } from '../../utils/debugHelper';

interface AppShellProps {
  requiredRole?: 'sales_agent' | 'operations_manager' | 'operator';
  children?: React.ReactNode;
}

export function AppShell({ requiredRole, children }: AppShellProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const authChecked = useRef(false);
  
  // Add sidebar logout event listener
  useEffect(() => {
    const handleSidebarLogout = () => {
      logout().then(() => {
        navigate('/login');
      }).catch(error => {
        console.error("Logout error:", error);
        navigate('/login'); // Navigate even if there's an error
      });
    };
    
    document.addEventListener('sidebar-logout', handleSidebarLogout);
    
    return () => {
      document.removeEventListener('sidebar-logout', handleSidebarLogout);
    };
  }, [logout, navigate]);
  
  // Simplified auth check - only relying on isAuthenticated and user state
  useEffect(() => {
    // Skip if we've already checked
    if (authChecked.current) return;
    
    const validateAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have valid authentication state now
        const { user, isAuthenticated } = useAuthStore.getState();
        
        // Check for explicit login flag
        const hasExplicitLogin = localStorage.getItem('explicit-login-performed') === 'true';
        
        // If auth is invalid or no explicit login, redirect
        if (!isAuthenticated || !user || !hasExplicitLogin) {
          console.log('❌ AppShell auth check failed - redirecting to login');
          navigate('/login', { replace: true });
          return;
        }
        
        // Role validation if requiredRole is specified
        if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
          console.log(`❌ User does not have required role: ${requiredRole}`);
          navigate('/dashboard', { replace: true });
          return;
        }
        
        console.log('✅ AppShell auth validation complete');
        authChecked.current = true;
      } catch (error) {
        console.error('Auth validation error:', error);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Monitor this operation to detect potential freezes
    const endMonitoring = monitorOperation('AppShell Auth Validation');
    validateAuth().finally(() => {
      endMonitoring();
    });
  }, [navigate, isAuthenticated, user, requiredRole]);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If requiredRole is specified and user role doesn't match, redirect to dashboard
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMobileMenuClick={toggleMobileSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="max-w-[1600px] mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}