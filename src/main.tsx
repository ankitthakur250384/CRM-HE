/**
 * main.tsx - Completely rewritten to prevent auto-login and auto-reload
 * This version NEVER auto-logs in or auto-restores sessions
 */
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { hydrateAuthStore } from './store/authStore';
import { initAuthDebug, logAuthState } from './utils/authDebug';
import { initAuthStateListener } from './services/firestore/authListener';
import { initReloadDetector } from './utils/reloadDetector';
import { initIntervalCleaner, clearAllTimers } from './utils/intervalCleaner';
import { auth } from './lib/firebase';

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

// REMOVED emergency redirect function and timeout to prevent unwanted redirects

/**
 * Initialize app with NO automatic login
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
  
  console.log('🚀 Initializing application...');
  
  // Initialize reload detector first to catch any issues
  initReloadDetector();
  
  // Initialize the interval cleaner utility
  initIntervalCleaner();
  
  // Initialize the Firebase Auth listener (only responds to explicit actions)
  initAuthStateListener();
  
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
    
    if (!hasExplicitLogin && !auth.currentUser) {
      console.log('🔒 No explicit login detected - redirecting to login');
      window.location.href = '/login';
      return; // Stop initialization - we're redirecting
    } else if (auth.currentUser) {
      console.log('🔑 User already logged in from explicit action');
    }
  }
  
  // STEP 2: Hydrate auth store (safe to do on any page)
  hydrateAuthStore();
    // STEP 3: REMOVED emergency timeout to prevent unwanted redirects
  // No automatic redirects to login after timeouts
  console.log('🛑 Emergency timeout redirects disabled to prevent auto-reloads');
  
  // STEP 4: Render the React app
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }
  
  // Render React application
  setTimeout(() => {
    // Enable debug logging
    initAuthDebug();
    logAuthState();
    
    // Clear any reload detection flags
    localStorage.removeItem('auth-long-cooling-period');
    localStorage.removeItem('render-cycle-count');
    localStorage.removeItem('last-loading-recovery-time');
    localStorage.removeItem('last-render-time');
    
    // Log the render
    console.log('🚀 Rendering React application');
    
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-white loading-screen">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-lg text-gray-700 font-medium">Loading your dashboard...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait...</p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        }>
          <App />
        </Suspense>
      </StrictMode>
    );
    
    // Signal that we've started the app
    localStorage.removeItem('app-starting');
    
    // Clear any reload loop flags to give this render a clean start
    localStorage.removeItem('reload-loop-detected');
    localStorage.removeItem('auth-loop-broken');
  }, 200); // Slight delay to ensure initialization completes first
}

// Call the initApp function once to start the application
initApp().catch(err => {
  console.error('Error during app initialization:', err);
  
  // Show fallback UI if initialization fails
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background-color:white;">
        <div style="display:flex; flex-direction:column; align-items:center; max-width:400px; text-align:center;">
          <div style="color:red; font-size:24px; margin-bottom:12px;">⚠️ Error</div>
          <p style="margin-top:16px; font-size:18px; color:#4b5563;">There was a problem loading the application</p>
          <p style="margin-top:8px; font-size:14px; color:#6b7280; margin-bottom:20px;">Please try again or go to login</p>
          <button 
            onclick="window.location.href='/login'" 
            style="padding:8px 16px; background-color:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;"
          >
            Go to Login
          </button>
        </div>
      </div>
    `;
  }
});

// Performance monitoring
let renderComplete = false;
setTimeout(() => {
  if (!renderComplete) {
    console.warn('App mount taking longer than expected - possible performance issue');
  }
}, 3000);

// On successful page load
window.addEventListener('load', () => {
  renderComplete = true;
  localStorage.removeItem('auth-checking');
  
  // REMOVED emergency redirect check to prevent unwanted redirects
  console.log('🛑 Page load complete - no automatic redirects will occur');
});
