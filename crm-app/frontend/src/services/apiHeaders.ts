/**
 * API Headers Utility
 * 
 * Shared utility for creating API request headers with authentication tokens
 * Production-ready implementation with proper environment handling for private cloud deployment
 */

import { isProd, isDev, logDebug, getAuthHeaders, logError, logWarning } from './envConfig';

/**
 * Get auth headers for API requests
 * Sets up Content-Type, Authorization with JWT token, and dev bypass headers when needed
 * 
 * @param includeDevBypass Whether to include development bypass headers (use with caution)
 */
export const getHeaders = (includeDevBypass: boolean = true): HeadersInit => {
  // Only include dev bypass if explicitly requested and not in production
  if (isProd()) {
    includeDevBypass = false;
  }
  
  const headers = getAuthHeaders(includeDevBypass);
  const typedHeaders = headers as Record<string, string>;
  
  // Add production-specific security headers
  if (isProd()) {
    typedHeaders['X-Requested-With'] = 'XMLHttpRequest'; // CSRF protection
    typedHeaders['X-Application-Type'] = 'asp-cranes-crm';
  }
  
  // Log header usage in development only
  if (isDev()) {
    const hasToken = !!typedHeaders['Authorization'];
    logDebug(`API headers prepared: Auth token ${hasToken ? 'present' : 'missing'}${
      includeDevBypass ? ', dev bypass enabled' : ''
    }`);
  }
  
  return typedHeaders;
};

/**
 * Headers for sensitive data operations
 * Includes stronger protection measures for sensitive operations
 */
export const getSensitiveOperationHeaders = (): HeadersInit => {
  const standardHeaders = getHeaders(false); // Never include bypass for sensitive ops
  const headers = { ...standardHeaders as Record<string, string> };
  
  // Add timestamp to prevent replay attacks
  headers['X-Request-Timestamp'] = Date.now().toString();

  // Add a request ID for better traceability
  headers['X-Request-ID'] = generateRequestId();

  return headers;
};

/**
 * Headers for file upload operations
 */
export const getFileUploadHeaders = (): HeadersInit => {
  // Don't include Content-Type as it will be set by the browser
  // with the correct multipart boundary
  const baseHeaders = getHeaders(false);
  const uploadHeaders: Record<string, string> = {};
  
  // Copy over auth header if present
  if ((baseHeaders as Record<string, string>)['Authorization']) {
    uploadHeaders['Authorization'] = (baseHeaders as Record<string, string>)['Authorization'];
  }
  
  // Copy other security headers
  if ((baseHeaders as Record<string, string>)['X-Requested-With']) {
    uploadHeaders['X-Requested-With'] = (baseHeaders as Record<string, string>)['X-Requested-With'];
  }
  
  if ((baseHeaders as Record<string, string>)['X-Application-Type']) {
    uploadHeaders['X-Application-Type'] = (baseHeaders as Record<string, string>)['X-Application-Type'];
  }

  return uploadHeaders;
};

/**
 * Generate a unique request ID for tracing
 */
const generateRequestId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

/**
 * Check if current token appears to be a development token
 * Used to warn users if they somehow have a dev token in production
 */
export const isUsingDevToken = (): boolean => {
  try {
    const token = localStorage.getItem('jwt-token');
    if (!token) return false;

    const isDevSignature = token.includes('dev-signature');
    const isDevFlag = sessionStorage.getItem('using-development-auth') === 'true';

    if (isProd() && (isDevSignature || isDevFlag)) {
      logError('CRITICAL SECURITY WARNING: Development token detected in production environment');
      return true;
    }

    return isDevSignature || isDevFlag;
  } catch (e) {
    return false;
  }
};
