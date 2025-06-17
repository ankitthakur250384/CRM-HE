import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { hydrateAuthStore } from './store/authStore';
import { initAuthDebug, logAuthState } from './utils/authDebug';
import { initAuthStateListener } from './services/firestore/authListener';
import { initReloadDetector } from './utils/reloadDetector';
import { auth } from './lib/firebase';

// Create a pre-loading state for the app
const preloadEl = document.getElementById('root');
if (preloadEl) {
  preloadEl.innerHTML = `
    <div style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background-color:white;">
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="height:64px; width:64px; border-radius:50%; border:4px solid #2563eb; border-top-color:transparent; animation:spin 1s linear infinite;"></div>
        <p style="margin-top:16px; font-size:18px; color:#4b5563;">Loading application...</p>
        <p style="margin-top:8px; font-size:14px; color:#6b7280;">Restoring your session...</p>
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
 * Emergency redirect function that bypasses React and directly navigates
 * This is a safety mechanism for users stuck on loading screens
 */
function forceRedirectToLogin(force = false) {
  try {
    // If we're not on login page or force is true, redirect
    if (force || !window.location.pathname.includes('/login')) {
      // Clear all auth state to start fresh
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login page
      window.location.href = '/login';
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error in emergency redirect:', err);
    return false;
  }
}

// Maximum time to wait for app initialization before forcing login
const EMERGENCY_TIMEOUT = 8000; // 8 seconds

/**
 * Initialize app with optimizations for authentication persistence
 */
const initApp = async () => {
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
  
  // Initialize the Firebase Auth listener with debouncing
  initAuthStateListener();
  
  // Check if we're on the login page
  const isAtLogin = window.location.pathname === '/login';
  
  // IMPORTANT: Check if the app is already initialized to prevent reload loops
  const isAlreadyInitialized = sessionStorage.getItem('app-initialized') === 'true';
  const lastInitTime = parseInt(sessionStorage.getItem('app-last-init-time') || '0', 10);
  const now = Date.now();
  
  // Only run full initialization if not done recently (within 5 seconds)
  if (isAlreadyInitialized && (now - lastInitTime < 5000)) {
    console.log('🛑 App already initialized recently - preventing potential reload loop');
  } else {
    // Mark the app as initialized for this session with timestamp
    sessionStorage.setItem('app-initialized', 'true');
    sessionStorage.setItem('app-last-init-time', now.toString());
    
    // Login page optimization - clear flags that might trigger redirects
    if (isAtLogin) {
      localStorage.removeItem('app-starting');
      localStorage.removeItem('auth-checking');
    } else {      // For non-login pages: Try to restore auth from persistent storage
      try {
        const { hasPersistentAuth, restorePersistentAuth } = await import('./services/firestore/persistentAuth');
        if (hasPersistentAuth()) {
          console.log('🔍 Found persistent auth data during app init - attempting to restore');
          // Only auto-login if they've authenticated in this session before
          // This prevents auto-login on fresh site visits
          await restorePersistentAuth(true); // true = require prior session auth
        }
      } catch (e) {
        console.error('Error checking persistent auth during initialization:', e);
      }
    }
  }
  
  // STEP 2: Hydrate auth store (safe to do on any page)
  hydrateAuthStore();
  
  // STEP 3: Set up emergency timeout for non-login pages
  let emergencyTimeoutId: number | undefined;
  
  if (!isAtLogin) {
    emergencyTimeoutId = window.setTimeout(() => {
      // If we still see a loading screen, it's an emergency
      const loadingElements = document.querySelectorAll('.loading-screen');
      if (loadingElements.length > 0) {
        console.warn('⚠️ Emergency timeout reached - redirecting to login');
        window.location.href = '/login';
      }
    }, EMERGENCY_TIMEOUT);
  }
  
  // STEP 4: Render the React app
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // Small delay for React rendering to ensure auth is checked first
  setTimeout(() => {
    // Enable debug logging
    initAuthDebug();
    logAuthState();
    
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-white loading-screen">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-lg text-gray-700 font-medium">Loading your dashboard...</p>
            </div>
          </div>
        }>
          <App />
        </Suspense>
      </StrictMode>
    );
    
    // Signal that we've started the app
    localStorage.removeItem('app-starting');
  }, 100);

  // Clean up emergency timeout on successful initialization
  return () => {
    if (emergencyTimeoutId) {
      clearTimeout(emergencyTimeoutId);
    }
  };
};

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
  
  // Final emergency redirect check
  setTimeout(() => {
    const loadingScreens = document.querySelectorAll('.loading-screen');
    if (loadingScreens.length > 0 && !window.location.pathname.includes('/login')) {
      console.warn('Still on loading screen after timeout - emergency redirect');
      forceRedirectToLogin();
    }
  }, EMERGENCY_TIMEOUT);
});
