// @ts-nocheck
/**
 * Very early browser compatibility script
 * Loaded before any module parsing to ensure global objects are available
 * 
 * This script prevents the page from going blank due to missing globals
 * or server-only modules that cause errors
 */

// Create process global if it doesn't exist
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  window.process = {
    env: {
      NODE_ENV: 'development',
      // Default values for any environment variables needed
      VITE_API_URL: '/api',
    },
    browser: true,
    nextTick: function(fn) { setTimeout(fn, 0); },
    version: '',
    versions: { node: '0.0.0' },
    platform: 'browser'
  };
  console.log('[compat] Created process shim');
}

// Create global if it doesn't exist
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
  console.log('[compat] Set window as global');
}

// Fallback for database libraries - more complete implementation
window.pg = window.pg || {};
window.pgPromise = function() {
  console.warn('[compat] Using browser mock for pg-promise');
  return {
    query: () => Promise.resolve({ rows: [] }),
    none: () => Promise.resolve(),
    one: () => Promise.resolve({}),
    oneOrNone: () => Promise.resolve(null),
    many: () => Promise.resolve([]),
    manyOrNone: () => Promise.resolve([]),
    any: () => Promise.resolve([]),
    task: (cb) => Promise.resolve(cb ? cb({}) : {})
  };
};

// Important: Add pg-promise.as property that's commonly used
window.pgPromise.as = {
  text: (v) => String(v),
  bool: (v) => Boolean(v),
  number: (v) => Number(v),
  json: (v) => typeof v === 'string' ? v : JSON.stringify(v)
};

// Polyfill for dotenv.config()
window.dotenv = {
  config: function() {
    console.warn('[compat] dotenv.config() called (no-op in browser)');
    return { parsed: {} };
  }
};

// Global error handler to prevent blank pages due to missing modules
window.addEventListener('error', function(e) {
  if (e && e.message && (
    e.message.includes('process is not defined') ||
    e.message.includes('pg-promise') ||
    e.message.includes('dotenv') ||
    e.message.includes('has been externalized for browser compatibility')
  )) {
    console.warn('[compat] Intercepted error:', e.message);
    // Prevent the error from crashing the app
    e.preventDefault();
    return false;
  }
}, true);

console.log('[compat] Early compatibility layer loaded');
