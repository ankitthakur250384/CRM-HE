/**
 * main.tsx - Updated to use PostgreSQL authentication
 * This version NEVER auto-logs in or auto-restores sessions
 */
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { hydrateAuthStore } from './store/authStore';
import { initAuthDebug } from './utils/authDebug';
import { initIntervalCleaner, clearAllTimers } from './utils/intervalCleaner';
import { initReloadDetector } from './utils/reloadDetector';
import './utils/devCleanup';
import './lib/apiService'; // Initialize centralized API service with token handling
import { initializeTokenRefreshService } from './lib/tokenRefreshService'; // Token refresh for extended sessions

// Create a pre-loading state for the app
const preloadEl = document.getElementById('root');
if (preloadEl) {
  preloadEl.innerHTML = `
    <div style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background-color:white;">
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="height:64px; width:64px; border-radius:50%; border:4px solid #2563eb; border-top-color:transparent; animation:spin 1s linear infinite;"></div>
        <p style="margin-top:16px; font-size:18px; color:#4b5563;">Loading application...</p>
        <p style="margin-top:8px; font-size:14px; color:#6b7280;">Please wait...</p>
        <button 
          onclick="window.location.href='/login'" 
          style="margin-top:16px; padding:8px 16px; background-color:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;"
        >
          Go to Login
        </button>
      </div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;
}

/**
 * Initialize app with PostgreSQL authentication
 */
const initApp = async (): Promise<void> => {
  // CRITICAL: Check for reload loops before doing anything else
  const reloadLoopDetected = localStorage.getItem('reload-loop-detected') === 'true';
  
  if (reloadLoopDetected) {
    console.error('🚨 RELOAD LOOP DETECTED - Emergency redirect to login');
    // Clear all auth state to break the loop
    localStorage.removeItem('reload-loop-detected');
    sessionStorage.clear();
    localStorage.clear();
    
    // Force to login page (if not already there)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
      return; // Stop initialization - we're redirecting
    }
  }
  
  console.log('🚀 Initializing application with PostgreSQL authentication...');
  
  // Initialize reload detector first to catch any issues
  initReloadDetector();
  
  // Initialize the interval cleaner utility
  initIntervalCleaner();
  
  // CRITICAL: Clear any potential intervals that might be causing auto-reloads
  clearAllTimers();
  
  console.log('🧹 Cleared all potential intervals and timeouts to prevent unwanted reloads');
  
  // Check if we're on the login page
  const isAtLogin = window.location.pathname === '/login';
  
  // Clear all flags that might trigger auto-login or redirects
  localStorage.removeItem('app-starting');
  localStorage.removeItem('auth-checking');
  sessionStorage.removeItem('page-visited');
  
  if (isAtLogin) {
    console.log('🔒 On login page - not attempting to restore auth');
  } else {
    // For non-login pages: ONLY proceed if explicit login was performed
    const hasExplicitLogin = localStorage.getItem('explicit-login-performed') === 'true';
    const hasJwtToken = localStorage.getItem('jwt-token') !== null;
    
    if (!hasExplicitLogin && !hasJwtToken) {
      console.log('🔒 No explicit login detected - redirecting to login');
      window.location.href = '/login';
      return; // Stop initialization - we're redirecting
    } else {
      console.log('🔑 User has valid authentication - proceeding');
    }
  }
    // STEP 2: Hydrate auth store (safe to do on any page)
  await hydrateAuthStore();
  
  // Initialize authentication debugging
  initAuthDebug();
  
  // Initialize token refresh service to keep JWT tokens valid during sessions
  initializeTokenRefreshService();

  // Create the root and render the app
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Failed to find the root element');
  
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <App />
      </Suspense>
    </StrictMode>
  );
  
  console.log('🎉 Application initialized successfully');
};

// Initialize the app
initApp().catch(error => {
  console.error('❌ Failed to initialize the application:', error);
  
  // Display error on page
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding:20px; max-width:800px; margin:0 auto; text-align:center;">
        <h1 style="color:#e11d48; font-size:24px; margin-bottom:16px;">Application Error</h1>
        <p style="margin-bottom:16px;">The application failed to initialize. Please try refreshing the page or contact support.</p>
        <pre style="background:#f1f5f9; padding:16px; border-radius:4px; text-align:left; overflow:auto;">${error?.toString() || 'Unknown error'}</pre>
        <button 
          onclick="window.location.href='/login'" 
          style="margin-top:16px; padding:8px 16px; background-color:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;"
        >
          Go to Login
        </button>
      </div>
    `;
  }
});
