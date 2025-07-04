/**
 * Development login utility for testing
 * 
 * IMPORTANT: This file is used only for development purposes and is designed to be 
 * completely stripped out from production builds. In a production deployment on a 
 * private cloud, all authentication must go through the proper authentication API.
 * 
 * WARNING: This file contains development-only authentication code that is NOT SECURE
 * for production use and must never be included in production builds.
 * 
 * For private cloud deployments, ensure your build process properly excludes
 * this file from the production bundle.
 */

import { UserRole } from '../types/auth';

// Define the user type to ensure consistency
interface DevUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Creates a properly formatted JWT token for development testing
 * This should only be called in development to bypass auth for testing
 * 
 * IMPORTANT: This file should be excluded from production builds
 * using proper bundler configurations.
 */
export const createDevToken = () => {
  // Multiple safety checks to ensure this is never used in production
  
  // Method 1: Check NODE_ENV
  const isEnvProduction = process.env.NODE_ENV === 'production';
  
  // Method 2: Check Vite environment
  const isViteProd = import.meta.env.PROD === true;
  
  // Method 3: Check for obvious production domains
  const isProdDomain = typeof window !== 'undefined' && 
    window.location.hostname.includes('aspcranes') ||
    window.location.hostname.includes('yourcompany.com') ||
    (!window.location.hostname.includes('localhost') && 
     !window.location.hostname.includes('127.0.0.1'));
  
  // If any check indicates production, abort immediately
  if (isEnvProduction || isViteProd || isProdDomain) {
    console.error('‼️ CRITICAL SECURITY ERROR: Attempted to use development authentication in production!');
    
    // Log security incident
    try {
      fetch('/api/security-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'auth_bypass_attempt',
          timestamp: new Date().toISOString(),
          environment: 'production',
          message: 'Development token creation attempted in production environment'
        })
      }).catch(() => {});  // Suppress errors from the logging attempt
      
      // Force redirect to login page in production environments
      if (typeof window !== 'undefined') {
        window.location.href = '/login?error=security_violation';
      }
    } catch (e) {
      // Silent catch - security logging should never throw or block
    }
    
    return null;
  }
  
  // Only allow in development environments
  if (import.meta.env.DEV) {
    console.log('🔐 [DEV ONLY] Creating development token for testing');
    
    // Create a proper JWT structure that will be recognized by our JWT library
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      sub: "dev-user-1", // Subject (user ID)
      name: "Dev User",
      email: "dev@example.com",
      role: "admin", // Must match UserRole type
      iat: now, // Issued at
      exp: now + 24 * 60 * 60, // Expires in 24 hours (1 day)
      // Add multiple indicators that this is a dev token to make it easier to detect
      dev: true,
      environment: 'development',
      purpose: 'local-development-only'
    };
    
    // Base64 encoding function
    const base64UrlEncode = (obj: any) => {
      return btoa(JSON.stringify(obj))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };
    
    // Create fake JWT token format (not cryptographically valid, but properly structured)
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    // Use a consistent signature pattern with clear development markers
    const signature = base64UrlEncode("dev-signature-asp-cranes-crm-local-development-only-NOT-FOR-PRODUCTION"); 
    
    const fakeToken = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    // Add a session storage flag to indicate we're using dev auth
    sessionStorage.setItem('using-development-auth', 'true');
    
    // Save to localStorage - use the same key pattern as the real authentication
    localStorage.setItem('jwt-token', fakeToken);
    
    // Create a user object that matches the structure expected by the application
    const fakeUser: DevUser = {
      id: 'dev-user-1',
      name: 'Dev User',
      email: 'dev@example.com',
      role: 'admin' // Make sure this matches the UserRole type
    };
    
    // Save user info to localStorage for convenience
    localStorage.setItem('user', JSON.stringify(fakeUser));
    
    // Show a prominent console warning to remind developers this is not for production
    console.warn(
      '%c⚠️ DEVELOPMENT AUTHENTICATION ACTIVE ⚠️',
      'background: #FF0000; color: #FFFFFF; font-size: 16px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    );
    console.warn(
      '%cThis authentication bypass is NOT SECURE and must never be deployed to a production environment.',
      'font-size: 14px; font-weight: bold;'
    );
    console.warn(
      '%cFor production deployment on a private cloud, ensure this code is completely stripped from the build.',
      'font-size: 14px;'
    );
    
    return { token: fakeToken, user: fakeUser };
  }
  
  // If we get here, we're not in dev mode but also not explicitly in production
  // We should still prevent the token from being created as a safety measure
  console.error('Development authentication not available: Not in development environment');
  
  return null;
};
