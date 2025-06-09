import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RefreshCw } from 'lucide-react';

interface AppShellProps {
  requiredRole?: 'sales_agent' | 'operations_manager' | 'operator';
  children?: React.ReactNode;
}

export function AppShell({ requiredRole, children }: AppShellProps) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if token is valid
  useEffect(() => {
    const validateAuth = async () => {
      try {
        setIsLoading(true);
        const isValid = await checkAuth();
        if (!isValid) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error validating auth:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    validateAuth();
  }, [checkAuth, navigate]);
  
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
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}