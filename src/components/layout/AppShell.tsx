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
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const authChecked = useRef(false);
  
  // Check auth only once on initial mount instead of every render
  useEffect(() => {
    // Skip repeated auth checks if already done
    if (authChecked.current) return;
    
    const validateAuth = async () => {
      try {
        setIsLoading(true);
        
        // Only check auth if we're not already authenticated
        if (!isAuthenticated || !user) {
          const isValid = await checkAuth();
          if (!isValid) {
            navigate('/login', { replace: true });
          }
        }
        
        authChecked.current = true;
      } catch (error) {
        console.error('Auth validation error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Monitor this operation to detect potential freezes
    const endMonitoring = monitorOperation('AppShell Auth Validation');
    validateAuth().finally(() => {
      endMonitoring();
    });
  }, [checkAuth, navigate, isAuthenticated, user]);

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