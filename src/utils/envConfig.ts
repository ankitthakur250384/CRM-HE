/**
 * Environment Configuration Utility
 * 
 * This utility provides environment-specific configuration and behavior
 * to properly separate development conveniences from production requirements.
 */

/**
 * Environment detection
 * Enhanced with safer checking logic for production deployments
 * 
 * IMPORTANT: This is a critical utility that determines whether development
 * code paths should be taken. In production, we MUST return true for isProd()
 * to prevent any dev authentication bypasses.
 */

// Cache the environment result to avoid inconsistencies during runtime
let _isProdCache: boolean | null = null;

export const isProd = (): boolean => {
  // Return cached result if available to ensure consistency
  if (_isProdCache !== null) {
    return _isProdCache;
  }
  
  // Multiple checks to ensure we detect production correctly
  const checks = {
    // Check 1: Node.js environment variable
    nodeEnvCheck: process.env.NODE_ENV === 'production',
    
    // Check 2: Vite mode indicator
    viteModeCheck: import.meta.env.MODE === 'production',
    
    // Check 3: Vite dev flag (inverse)
    viteDevCheck: import.meta.env.DEV === false,
    
    // Check 4: Vite PROD flag (direct)
    viteProdCheck: import.meta.env.PROD === true,
    
    // Check 5: URL hostname check (only if in browser)
    urlCheck: typeof window !== 'undefined' && (
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('.local')
    ),
    
    // Check 6: Look for production deployment marker
    prodMarkerCheck: localStorage.getItem('env-deploy-type') === 'production'
  };
  
  // Log the results in development mode for debugging
  if (import.meta.env.DEV) {
    console.log('Environment detection results:', checks);
  }
  
  // STRICT PRODUCTION DETECTION:
  // In a Vite application, the most reliable indicators are:
  // 1. Vite's PROD flag
  // 2. NODE_ENV being set to production
  const isProdBuild = checks.viteProdCheck || checks.nodeEnvCheck;
  
  // For browser environment, we can further validate with URL check
  // but only as a secondary indicator, not a primary one
  const isLikelyProdEnv = isProdBuild || (checks.viteDevCheck && checks.urlCheck);
  
  // Cache the result
  _isProdCache = isLikelyProdEnv;
  return isLikelyProdEnv;
};

export const isDev = (): boolean => {
  // If it's not production, treat as development
  return !isProd();
};

/**
 * API configuration
 */
export const getApiBaseUrl = (): string => {
  // In production, use environment variables for configuration
  if (isProd()) {
    return process.env.API_URL || '/api';
  }
  
  // In development, use Vite environment variables
  return import.meta.env.VITE_API_URL || '/api';
};

/**
 * Authorization headers with proper environment handling
 */
export const getAuthHeaders = (includeDevBypass: boolean = false): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add JWT token if available
  const token = localStorage.getItem('jwt-token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // No longer adding development bypass headers for production readiness

  return headers;
};

/**
 * Production-only code guard
 * @param fn Function to execute only in production
 */
export const runInProdOnly = (fn: () => void): void => {
  if (isProd()) {
    fn();
  }
};

/**
 * Development-only code guard
 * @param fn Function to execute only in development
 */
export const runInDevOnly = (fn: () => void): void => {
  if (isDev()) {
    fn();
  }
};

/**
 * Log messages appropriate for the current environment
 */
export const logDebug = (message: string, ...args: any[]): void => {
  if (isDev()) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

export const logWarning = (message: string, ...args: any[]): void => {
  console.warn(`[WARNING] ${message}`, ...args);
};

export const logError = (message: string, ...args: any[]): void => {
  console.error(`[ERROR] ${message}`, ...args);
};

/**
 * Production deployment check
 * Helps identify if development features are accidentally included in production
 */
export const validateProductionDeploy = (): void => {
  if (isProd() && typeof window !== 'undefined') {
    // Check for development artifacts that shouldn't be in production
    const devTokenCheck = localStorage.getItem('jwt-token');
    if (devTokenCheck && devTokenCheck.includes('dev-signature')) {
      logError('CRITICAL SECURITY RISK: Development authentication token found in production!');
      // Try to clear it immediately
      try {
        localStorage.removeItem('jwt-token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('using-development-auth');
        logWarning('Removed development authentication token from storage');
      } catch (e) {
        logError('Failed to remove development token:', e);
      }
      
      // Report the security incident
      try {
        fetch('/api/security-incident', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'dev_token_in_prod',
            timestamp: new Date().toISOString(),
            severity: 'critical',
            message: 'Development token found in production environment'
          })
        }).catch(() => {});  // Suppress errors from the logging attempt
      } catch (e) {
        // Silent catch
      }
    }
    
    // Check for development flag in session storage
    if (sessionStorage.getItem('using-development-auth') === 'true') {
      logError('SECURITY RISK: Development authentication flag found in production!');
      sessionStorage.removeItem('using-development-auth');
    }
    
    // Check if window.location.hostname indicates a development environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      logWarning('Production build running in development environment!');
    }
    
    // Check for development environment variables that might have been embedded
    if ((window as any).devBypassEnabled || (window as any).__DEV__ || (window as any).__DEBUG__) {
      logError('SECURITY RISK: Development flags found in production build!');
    }
    
    // Add more production validations as needed
  }
};

/**
 * Enhanced production startup checks
 * These runs immediately when this module is imported in production
 */
const runProductionStartupChecks = () => {
  if (isProd()) {
    // Main validation
    validateProductionDeploy();
    
    // Console banner for production mode
    console.log(
      '%c🔒 PRODUCTION MODE ACTIVE',
      'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    );
    
    // Check if development files are present
    try {
      Promise.all([
        import('../utils/devLogin').catch(() => null),
        import('../utils/authDebug').catch(() => null)
      ]).then(modules => {
        const hasDevelopmentModules = modules.some(m => m !== null);
        if (hasDevelopmentModules) {
          logError('SECURITY RISK: Development modules found in production build!');
        }
      });
    } catch (e) {
      // This is actually good - means those modules aren't available
    }
    
    // Apply production-specific patches or behaviors
    // For example, disable console.log in production for security
    try {
      if (typeof window !== 'undefined' && isProd()) {
        const originalConsoleLog = console.log;
        console.log = function(...args: any[]) {
          // Only log errors and warnings in production, filter out debug logs
          if (args[0] && typeof args[0] === 'string' && 
              (args[0].includes('[ERROR]') || args[0].includes('[WARNING]'))) {
            originalConsoleLog.apply(console, args);
          }
        };
      }
    } catch (e) {
      // Ignore console patching errors
    }
  }
};

// Run validation on module import in production
runInProdOnly(() => {
  runProductionStartupChecks();
});
