/**
 * main.tsx - Entry point for ASP Cranes CRM
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { hydrateAuthStore } from './store/authStore';

// Initialize and render the app
const initAndRenderApp = async (): Promise<void> => {
  try {
    // Hydrate auth store to load user authentication state
    await hydrateAuthStore();
    console.log('✅ Auth store hydrated successfully');
  } catch (error) {
    // If auth store hydration fails, log but continue to render
    console.warn('⚠️ Auth store hydration failed:', error);
  }
  
  // Render the application
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Failed to find root element');
    return;
  }
  
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
  console.log('🎉 Application rendered successfully');
};

// Start the application
initAndRenderApp().catch(error => {
  console.error('❌ Application initialization error:', error);
});
