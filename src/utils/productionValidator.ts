/**
 * Production Deployment Validator
 * This module checks that the production build is correctly configured
 * and doesn't contain any development authentication bypasses
 */

import { isProd } from './envConfig';

/**
 * Validates that the current deployment is properly configured for production
 * and doesn't contain any development artifacts or security bypasses
 */
export const validateProductionDeploy = () => {
  // Only run these checks in production builds
  if (!isProd()) {
    console.log('ℹ️ Production deployment validation skipped in development environment');
    return;
  }
  
  console.log('🔒 Validating production deployment...');
  
  // Check 1: Ensure environment is correctly set to production
  const checks = {
    envNodeEnv: process.env.NODE_ENV === 'production',
    envImportMeta: import.meta.env.PROD === true,
    envDevFalse: import.meta.env.DEV !== true,
    envMarker: localStorage.getItem('env-deploy-type') === 'production'
  };
  
  console.log('Environment checks:', checks);
  
  // Check 2: Look for development auth tokens
  const localStorageKeys = Object.keys(localStorage);
  const devTokensInLocalStorage = localStorageKeys.filter(key => {
    const value = localStorage.getItem(key);
    if (!value) return false;
    
    return key.includes('dev') || 
           key.includes('test') ||
           key.includes('mock') ||
           key.includes('bypass') ||
           (key === 'jwt-token' && (
             value.includes('dev-user') || 
             value.includes('development') ||
             value.includes('dev-signature'))
           );
  });
  
  // Check 3: Verify that devLogin module is not accessible
  let devLoginAccessible = false;
  
  try {
    // This should fail in production because the module should be replaced with an empty shim
    import('../utils/devLogin')
      .then((module) => {
        // Check if the module has the dev function
        if (module && typeof module.createDevToken === 'function') {
          // Call it to see if it returns null (correct in production) or a token (security issue)
          const result = module.createDevToken();
          if (result !== null) {
            devLoginAccessible = true;
            console.error('‼️ CRITICAL SECURITY ERROR: Development authentication module is accessible and functional in production!');
          } else {
            console.log('✅ Development authentication module properly disabled in production');
          }
        }
      })
      .catch(() => {
        console.log('✅ Development authentication module correctly blocked in production');
      });
  } catch (e) {
    // This is good - module should not be accessible
    console.log('✅ Development authentication module correctly blocked in production');
  }
  
  // Check 4: Verify that JWT tokens in storage are not dev tokens
  const jwtToken = localStorage.getItem('jwt-token');
  let hasDevJWT = false;
  
  if (jwtToken) {
    try {
      // Check if token starts with standard JWT format
      if (jwtToken.startsWith('eyJ')) {
        // Try to parse the middle part (payload)
        const parts = jwtToken.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1]));
            
            if (payload.dev === true || 
                payload.environment === 'development' ||
                payload.purpose === 'local-development-only') {
              hasDevJWT = true;
              console.error('‼️ CRITICAL SECURITY ERROR: Development JWT token found in production!');
            }
          } catch (e) {
            // Parsing failed, which is fine - it means it's not a valid JWT
          }
        }
      }
    } catch (e) {
      // Error handling token, which is acceptable
    }
  }
  
  // Summarize validation results
  const validationResults = {
    isCorrectEnvironment: Object.values(checks).every(v => v === true),
    devTokensFound: devTokensInLocalStorage.length > 0,
    devLoginModuleAccessible: devLoginAccessible,
    hasDevJwtToken: hasDevJWT
  };
  
  const isValid = validationResults.isCorrectEnvironment && 
                  !validationResults.devTokensFound &&
                  !validationResults.devLoginModuleAccessible &&
                  !validationResults.hasDevJwtToken;
  
  if (isValid) {
    console.log('%c✅ Production deployment validation PASSED!', 
      'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px;');
  } else {
    console.error('%c❌ Production deployment validation FAILED!', 
      'background: #F44336; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px;');
    
    console.error('Validation results:', validationResults);
    
    // If in production and validation fails, show a critical error
    if (isProd()) {
      try {
        // Log security incident
        fetch('/api/security-incident', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({
            type: 'production_validation_failed',
            timestamp: new Date().toISOString(),
            details: validationResults
          })
        }).catch(() => {});
        
        // Optionally, redirect to a security error page
        // if (typeof window !== 'undefined') {
        //   window.location.href = '/security-error.html';
        // }
      } catch (e) {
        // Quiet catch
      }
    }
  }
  
  return isValid;
};
