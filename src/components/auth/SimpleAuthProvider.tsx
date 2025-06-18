import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Minimal AuthProvider - NO auto login, NO auto reload
 * Only checks auth on explicit user actions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Just one state - ready to show children
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // On mount, ALWAYS check for explicit login and Firebase auto-session
  useEffect(() => {
    console.log("🔒 Automatic login disabled - explicit login required");
    
    // Clean up any auto-reload related flags
    localStorage.removeItem("reload-loop-detected");
    localStorage.removeItem("auth-loop-broken");
    localStorage.removeItem("auth-long-cooling-period");
    localStorage.removeItem("last-render-time");
    localStorage.removeItem("render-cycle-count");
    sessionStorage.removeItem("auth-check-in-progress");
    sessionStorage.removeItem("path-auth-checked");
    sessionStorage.removeItem("last-auth-path-check");

    // CRITICAL: If we are not on login page and no explicit login was performed, ALWAYS redirect to login
    // This makes any Firebase auto-login ineffective
    const isLoginPage = location.pathname === "/login";
    const hasExplicitLogin = localStorage.getItem("explicit-login-performed") === "true";
    
    // FORCE redirect to login if not on login page and no explicit login
    if (!isLoginPage && !hasExplicitLogin) {
      console.log("🚨 No explicit login detected - FORCING redirect to login");
      navigate("/login", { replace: true });
    } else if (hasExplicitLogin) {
      console.log("✅ Explicit login detected - allowing access");
    } else {
      console.log("🔑 On login page - no redirect needed");
    }
    
    // Always set ready to show content - no auto refresh/reload
    setIsReady(true);
  }, [location.pathname, navigate]);

  // No other effects that could cause auto-login
  
  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Loading application...</p>
          <button 
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Just render the children - no auth checking
  return children;
}
