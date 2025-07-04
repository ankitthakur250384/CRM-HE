/**
 * Empty Module Shim
 * Used to replace development-only modules in production builds
 * 
 * IMPORTANT: This file is used in production to replace development modules.
 * Make sure all exported functions match the original module signatures
 * but return safe null values to prevent any execution of dev code.
 */

// Export empty/no-op functions for any commonly used exports from devLogin.ts
export const createDevToken = () => {
  console.log('🔒 Development authentication disabled in production');
  return null;
};

// Export no-op functions for authDebug.ts
export const initAuthDebug = () => {};
export const logAuthState = () => {};
export const debugAuth = () => {};
export const checkAuthStatus = () => {};

// Export functions from devCleanup.ts
export const cleanupDevArtifacts = () => {};
export const checkForDevTokens = () => false;
export const removeDevTokens = () => {};

// Default export as empty object for any default imports
export default {
  createDevToken: () => null,
  initAuthDebug: () => {},
  logAuthState: () => {},
};
