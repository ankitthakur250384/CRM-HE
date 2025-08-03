/**
 * Client-side environment variables
 * 
 * This module provides a browser-safe alternative to process.env
 * to prevent "process is not defined" errors.
 */

// Default values for client-side use
const defaultValues: Record<string, string> = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  VITE_API_URL: process.env.VITE_API_URL || '/api',
  JWT_SECRET: 'default_client_side_secret_not_for_actual_use',
};

/**
 * Safe environment accessor that doesn't use process.env
 */
export const env = new Proxy({} as Record<string, any>, {
  get: (_target, prop: string) => {
    // First try import.meta.env
    if (typeof process.env[prop] !== 'undefined') {
      return process.env[prop];
    }
    
    // For NODE_ENV, use process.env.NODE_ENV
    if (prop === 'NODE_ENV') {
      return process.env.NODE_ENV;
    }
    
    // Fall back to our default values
    if (prop in defaultValues) {
      return defaultValues[prop];
    }
    
    // For any other props, return undefined instead of throwing
    console.warn(`Environment variable ${String(prop)} is not defined in client environment`);
    return undefined;
  }
});

/**
 * Mock process.env for libraries that depend on it
 */
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  // Only in browser context and if process isn't already defined
  try {
    // @ts-ignore - Creating a mock process global for libraries that expect it
    window.process = {
      env: env,
      browser: true,
      version: '',
      // @ts-ignore - Just providing the minimum needed
      versions: { node: '0.0.0' },
      nextTick: (fn: Function) => setTimeout(fn, 0),
    };
    console.log('Created browser-compatible process.env shim');
  } catch (e) {
    console.error('Failed to create process.env shim:', e);
  }
}

export default env;

