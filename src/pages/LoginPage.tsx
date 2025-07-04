import { Component, ReactNode, useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

// Login error fallback component
function LoginErrorFallback({ error, resetError }: { error: Error, resetError: () => void }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f0f2f5'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px',
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '16px', color: '#e53e3e' }}>Login Error</h1>
        <p style={{ marginBottom: '24px' }}>We encountered a problem with the login form.</p>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '24px',
          textAlign: 'left',
          overflowWrap: 'break-word'
        }}>
          <code style={{ color: '#e53e3e' }}>{error.message}</code>
        </div>
        <button 
          onClick={resetError}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Custom error boundary for login
class LoginErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Login page error:", error);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return <LoginErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Main login content component
function LoginContent() {
  const { isAuthenticated } = useAuthStore();
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  // Render the login form
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f0f2f5'
    }}>
      <img 
        src="/asp-logo.jpg" 
        alt="ASP Cranes" 
        style={{ 
          width: '120px', 
          height: '80px', 
          objectFit: 'contain', 
          marginBottom: '16px' 
        }}
      />
      <h1 style={{ marginBottom: '20px', color: '#1a202c' }}>ASP Cranes CRM</h1>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px',
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <LoginForm />
      </div>
    </div>
  );
}

// Main LoginPage component with error boundary
export function LoginPage() {
  // Debug logging for development
  useEffect(() => {
    console.log("LoginPage mounted");
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    console.log("API URL:", apiUrl);
  }, []);
  
  return (
    <LoginErrorBoundary>
      <LoginContent />
    </LoginErrorBoundary>
  );
}