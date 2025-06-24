import { useState, useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

// Debug component to help diagnose rendering issues
const LoginDebug = () => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const authStore = useAuthStore.getState();
      console.log('Auth store state:', authStore);
    } catch (err) {
      setError(`Error accessing auth store: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error accessing auth store:', err);
    }
  }, []);
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: 'rgba(255,255,255,0.9)', 
      padding: '10px', 
      borderRadius: '5px',
      border: '1px solid #ccc',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h3>Debug Info</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <p>LoginPage rendered at: {new Date().toISOString()}</p>
      <p>URL: {window.location.href}</p>
      <button 
        onClick={() => localStorage.clear()} 
        style={{ padding: '5px', margin: '5px' }}
      >
        Clear localStorage
      </button>
    </div>
  );
};

export function LoginPage() {
  const [renderError, setRenderError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    console.log('LoginPage mounted', { isAuthenticated });
  }, [isAuthenticated]);
  
  // Safely try to render the component
  try {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" />;
    }
    
    return (
      <>
        <LoginForm />
        {import.meta.env.DEV && <LoginDebug />}
        {renderError && (
          <div style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            background: 'white', 
            padding: '20px', 
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            zIndex: 9999
          }}>
            <h2>Error Rendering Login Form</h2>
            <p>{renderError}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '10px', background: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              Reload Page
            </button>
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error('Error rendering LoginPage:', error);
    setRenderError(`Error rendering login page: ${error instanceof Error ? error.message : String(error)}`);
    
    // Render a fallback UI
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        <h1>Login Error</h1>
        <p>There was an error displaying the login page.</p>
        <p style={{ color: 'red' }}>{error instanceof Error ? error.message : String(error)}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ padding: '10px', background: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Try Again
        </button>
      </div>
    );
  }
}