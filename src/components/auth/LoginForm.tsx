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
  const [apiState, setApiState] = useState<'loading' | 'available' | 'error'>('loading');
  const { login, error, isAuthenticated, user } = useAuthStore();
  
  // Debug logging for LoginForm render
  console.log("LoginForm rendering");
  console.log("Auth state:", { error, isAuthenticated });
  
  useEffect(() => {
    console.log("LoginForm mounted");
    // Check if the API is reachable
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    fetch(`${apiUrl}/health`, {
      // Add credentials and mode to support CORS
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log("API health check response:", response.status);
        setApiState(response.ok ? 'available' : 'error');
        return response.text();
      })
      .then(data => {
        console.log("API health check data:", data);
      })
      .catch(err => {
        console.error("API health check failed:", err);
        setApiState('error');
        setRenderError(`API connection error: ${err.message}. Make sure the API server is running at ${apiUrl}`);
      });
      
    // Check for critical environment variables
    console.log("Environment variables check:", {
      apiUrl: import.meta.env.VITE_API_URL || 'not set',
      dbHost: import.meta.env.VITE_DB_HOST || 'not set'
    });
  }, []);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path if available
  const from = (location.state as LocationState)?.from?.pathname || '/dashboard';
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    console.log('🔍 LoginForm useEffect - Authentication check:', { isAuthenticated, user: user?.name });
    if (isAuthenticated && user) {
      console.log('✅ User is authenticated, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);
  
  // Stabilize the login form by marking it as mounted
  useEffect(() => {
    // Clear any previous JWT token if on login page
    // This ensures we get a fresh token on explicit login
    if (location.pathname === '/login') {
      localStorage.removeItem('jwt-token');
    }
  }, [location.pathname]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setRenderError("Email and password are required");
      return;
    }
    
    setIsLoading(true);
    console.log("🔑 Login attempt for:", email);
    
    try {
      // Check if API is reachable before attempting login
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      try {
        const healthCheck = await fetch(`${apiUrl}/health`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!healthCheck.ok) {
          console.error("API health check failed before login attempt:", await healthCheck.text());
          setApiState('error');
          throw new Error(`API server is not responding correctly. Status: ${healthCheck.status}`);
        }
        
        setApiState('available');
        console.log("API health check passed, proceeding with login");
      } catch (healthErr) {
        console.error("Failed to connect to API:", healthErr);
        setApiState('error');
        throw new Error("Cannot connect to API. Please ensure the server is running.");
      }
      
      // Call login function from auth store (now uses PostgreSQL)
      console.log('🔐 Calling auth store login...');
      await login(email, password);
      console.log('✅ Login attempt successful, auth state should be updated');
      
      // Wait a moment for state to update, then force navigation
      setTimeout(() => {
        const currentState = useAuthStore.getState();
        console.log('🔍 Current auth state after login:', {
          isAuthenticated: currentState.isAuthenticated,
          user: currentState.user?.name,
          userRole: currentState.user?.role,
          token: currentState.token ? 'Present' : 'Missing',
          fullUser: currentState.user
        });
        
        // Force navigation if authenticated
        if (currentState.isAuthenticated && currentState.user) {
          console.log('🚀 Forcing navigation to dashboard...');
          console.log('👤 User object before navigation:', JSON.stringify(currentState.user, null, 2));
          navigate('/dashboard', { replace: true });
        } else {
          console.log('❌ Auth state not updated properly, user may need to refresh');
        }
      }, 500);
      
      // Login will update isAuthenticated, triggering the redirect effect
    } catch (err) {
      console.error("Login error:", err);
      
      // Auth store already tracks the error, but we might want to clear password
      // Show a specific error message for HTML responses
      if (err instanceof Error) {
        if (err.message.includes('<!DOCTYPE') || err.message.includes('<html>')) {
          const apiUrl = import.meta.env.VITE_API_URL || '/api';
          setRenderError(`API returned HTML instead of JSON. The API server might not be running correctly. 
            Make sure the API server is running at ${apiUrl}.`);
        } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
          setRenderError(`Network error: Cannot connect to API server. 
            Please check your network connection and make sure the server is running.`);
        }
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
  
  // Show API status
  if (apiState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <div className="w-full max-w-md px-6 py-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">API Connection Error</h2>
          <p className="text-gray-700 mb-4">
            Unable to connect to the API server. The server might not be running.
            <br />
            API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}
          </p>
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Troubleshooting steps:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure the API server is running</li>
              <li>Check your .env file configuration</li>
              <li>Verify database connection settings</li>
              <li>Check browser console for network errors</li>
            </ol>
          </div>
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
                  onError={(e) => {
                    e.currentTarget.src = 'https://placeholder.pics/svg/300x200/DEDEDE/555555/ASP%20Cranes';
                    console.error('Logo image failed to load');
                  }}
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
      </div>
    );
  } catch (err) {
    console.error('Error rendering login form:', err);
    setRenderError(`Error rendering login form: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}