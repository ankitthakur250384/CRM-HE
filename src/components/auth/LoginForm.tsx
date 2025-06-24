import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { AlertCircle } from 'lucide-react';
import logo from '../../assets/asp-logo.jpg';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const { login, error, isAuthenticated } = useAuthStore();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path if available
  const from = (location.state as LocationState)?.from?.pathname || '/dashboard';
  
  // Debug info
  useEffect(() => {
    console.log('🔵 LoginForm mounted', { isAuthenticated, error });
    
    // Log store state for debugging
    try {
      console.log('🔍 Auth Store State:', useAuthStore.getState());
    } catch (err) {
      console.error('Error accessing auth store:', err);
    }
  }, [isAuthenticated, error]);
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      console.log('👉 User is authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Stabilize the login form by marking it as mounted
  useEffect(() => {
    // Mark that we've reached the login form properly
    sessionStorage.setItem('login-form-loaded', 'true');
    
    // Clear any pending auth checks or redirects
    localStorage.removeItem('auth-checking');
    localStorage.removeItem('app-starting');
    
    // Clear any previous JWT token if on login page
    // This ensures we get a fresh token on explicit login
    if (location.pathname === '/login') {
      localStorage.removeItem('jwt-token');
    }
    
    return () => {
      console.log('🔴 LoginForm unmounted');
    };
  }, [location.pathname]);
      const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('🔑 Attempting login with email:', email);
    
    // Set flag that user is explicitly logging in
    localStorage.setItem('explicit-login-performed', 'true');
    // Set flag for auth listener to know this is an explicit auth action
    sessionStorage.setItem('explicit-auth-action', 'true');
    
    try {
      // Call login function from auth store (now uses PostgreSQL)
      await login(email, password);
      // Login will update isAuthenticated, triggering the redirect effect
      console.log('✅ Login successful, redirecting to:', from);
    } catch (err) {
      // Auth store already tracks the error, but we might want to clear password
      console.error('❌ Login error:', err);
        // Show a specific error message for HTML responses
      if (err instanceof Error && (err.message.includes('<!DOCTYPE') || err.message.includes('<html>'))) {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        setRenderError(`API returned HTML instead of JSON. The API server might not be running correctly. 
          Make sure the API server is running at ${apiUrl}. You can try starting it with 'npm run server'.`);
      }
      
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle rendering errors
  if (renderError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <div className="w-full max-w-md px-6 py-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Rendering Login Form</h2>
          <p className="text-gray-700 mb-4">{renderError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  // Try to render the form with error handling
  try {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md px-8 py-12 bg-white rounded-2xl shadow-xl">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-32">
                <img 
                  src={logo} 
                  alt="ASP Cranes" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ASP Cranes CRM</h1>
            <p className="text-gray-600 text-lg">
              Sign in to access your dashboard
            </p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-6">
            <p className="text-sm text-blue-800">
              Using secure PostgreSQL authentication
            </p>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12"
                placeholder="Enter your email"
              />
              
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12"
                placeholder="Enter your password"
              />
            </div>
            
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="h-12 text-lg font-medium"
            >
              Sign in
            </Button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 ASP Cranes.</p>
          <p className="mt-1">Built by AVARIQ Tech Solutions Pvt. Ltd.</p>
        </div>
        
        {/* Debug info visible only in dev mode */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 left-4 bg-white p-4 rounded shadow-md border max-w-xs text-xs opacity-70 hover:opacity-100">
            <h4 className="font-bold">Login Debug Info:</h4>
            <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <p>From Path: {from}</p>
            <button 
              onClick={() => console.log(useAuthStore.getState())}
              className="mt-2 p-1 bg-gray-200 rounded"
            >
              Log Store State
            </button>
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error('Error rendering login form:', err);
    setRenderError(`Error rendering login form: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}