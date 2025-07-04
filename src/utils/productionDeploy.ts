/**
 * Production Deployment Utilities
 * 
 * This module contains utility functions specifically designed for production deployments
 * on private cloud infrastructure. It provides checks and validations to ensure
 * proper security and configuration.
 */

import { isProd, logError, logWarning } from './envConfig';

/**
 * Checks if the current environment is suitable for production deployment
 */
export const validatePrivateCloudDeployment = (): boolean => {
  if (!isProd()) {
    logWarning('Not running in production mode - skipping private cloud deployment checks');
    return false;
  }

  let isValid = true;
  const issues: string[] = [];

  // Check API URL configuration
  const apiUrl = process.env.API_URL || '';
  if (!apiUrl || apiUrl === '/api' || apiUrl.includes('localhost')) {
    issues.push('Invalid or missing API URL configuration for production');
    isValid = false;
  }

  // Check JWT secret configuration
  const jwtSecret = process.env.JWT_SECRET || '';
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret === 'your-secure-jwt-secret-key-change-in-production') {
    issues.push('JWT secret is not properly configured for production');
    isValid = false;
  }

  // Check for development artifacts in production build
  try {
    // Check for development files that should never be in production
    const devFiles = [
      '../utils/devLogin',
      '../utils/authDebug',
      '../components/auth/SimpleAuthProviderFixed'
    ];

    for (const file of devFiles) {
      try {
        // This should fail in production since these files shouldn't be included
        require(file);
        issues.push(`Development file ${file} found in production build`);
        isValid = false;
      } catch (e) {
        // Expected behavior in production - file should not be found
      }
    }
  } catch (e) {
    // Ignore dynamic import errors
  }

  // Report issues if any were found
  if (!isValid) {
    logError('Private cloud deployment validation failed:');
    issues.forEach(issue => logError(`- ${issue}`));

    // Log to monitoring system if available
    try {
      fetch('/api/deployment-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'failed',
          issues,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch (e) {
      // Ignore fetch errors
    }
  }

  return isValid;
};

/**
 * Provides configuration for private cloud deployment
 */
export const getPrivateCloudConfig = () => {
  return {
    apiUrl: process.env.API_URL || '/api',
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    useSecureCookies: true,
    requireHttps: true,
    tokenExpirySeconds: 28800, // 8 hours
    maxRetries: 3
  };
};

/**
 * Initializes production-only security features
 */
export const initializeProductionSecurity = () => {
  if (!isProd()) return;

  // Set secure HTTP headers if running in browser
  if (typeof window !== 'undefined') {
    // These would normally be set on the server, but we can check for them
    // and warn if they're not present in a production deployment
    const securityHeaders = [
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'X-Content-Type-Options'
    ];

    // Check if security headers are set
    if (document.location.protocol !== 'https:') {
      logWarning('Production application not running on HTTPS');
    }

    // Warn about any missing security headers
    const missingHeaders = securityHeaders.filter(
      header => !document.querySelector(`meta[http-equiv="${header}"]`)
    );
    
    if (missingHeaders.length > 0) {
      logWarning(`Missing recommended security headers: ${missingHeaders.join(', ')}`);
    }
  }

  // Apply additional production security measures
  // These can be expanded based on specific private cloud requirements
};

// Run initialization on module import in production
if (isProd()) {
  initializeProductionSecurity();
  
  // Log production startup
  console.log(
    '%c🚀 ASP Cranes CRM - Production Mode',
    'background: #1E5128; color: white; font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
  );
}
