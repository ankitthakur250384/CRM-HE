import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { hydrateAuthStore } from './store/authStore';

// Create a pre-loading state for the app
const preloadEl = document.getElementById('root');
if (preloadEl) {
  preloadEl.innerHTML = `
    <div style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background-color:white;">
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="height:64px; width:64px; border-radius:50%; border:4px solid #2563eb; border-top-color:transparent; animation:spin 1s linear infinite;"></div>
        <p style="margin-top:16px; font-size:18px; color:#4b5563;">Loading application...</p>
      </div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;
}

// Flag to track whether we might be in a reload situation where auth is happening
localStorage.setItem('app-starting', 'true');

/**
 * Initialize app with optimizations for authentication persistence
 */
const initApp = () => {
  // Hydrate the auth store first - this must be completed before rendering
  hydrateAuthStore();
  
  // Set a flag so the router knows we're authenticating
  localStorage.setItem('auth-checking', 'true');
  
  // Get the root element for React rendering
  const rootElement = document.getElementById('root')!;
  
  // For initial hydration and to prevent auth flicker, we'll delay the first render slightly
  setTimeout(() => {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-white">
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
  }, 100); // Small delay to ensure hydration gets priority
};

// Initialize the app
initApp();

// Performance monitoring
let renderComplete = false;
setTimeout(() => {
  if (!renderComplete) {
    console.warn('App mount taking longer than expected - possible performance issue');
  }
}, 3000);

// On successful first page load
window.addEventListener('load', () => {
  renderComplete = true;
  localStorage.removeItem('auth-checking');
});
