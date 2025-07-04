/**
 * Browser-compatible JWT service using Web Crypto API
 */

// Import environment check utilities
import { isProd } from '../utils/envConfig';

// We need to encode and decode the JWT secret
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Convert the secret to a Uint8Array for use with Web Crypto API
const getSecretKey = (secret: string): Uint8Array => {
  return textEncoder.encode(secret);
};

// Helper to encode to base64url
const base64url = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

// Helper to decode from base64url
const base64urlDecode = (str: string): ArrayBuffer => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Uint8Array.from(atob(str), c => c.charCodeAt(0)).buffer;
};

// Parse a JWT token without verification
export const decode = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(textDecoder.decode(base64urlDecode(parts[1])));
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    throw error;
  }
};

// Sign a JWT token
export const sign = async (
  payload: Record<string, any>,
  secret: string,
  options: { expiresIn?: string | number } = {}
): Promise<string> => {
  try {
    // Prepare the header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Add expiry if provided (in seconds)
    if (options.expiresIn) {
      const now = Math.floor(Date.now() / 1000);
      let expiryTime: number;
      
      if (typeof options.expiresIn === 'string') {
        // Parse simple hour format "24h"
        if (options.expiresIn.endsWith('h')) {
          const hours = parseInt(options.expiresIn.slice(0, -1), 10);
          expiryTime = now + (hours * 60 * 60);
        } else if (options.expiresIn.endsWith('m')) {
          const minutes = parseInt(options.expiresIn.slice(0, -1), 10);
          expiryTime = now + (minutes * 60);
        } else if (options.expiresIn.endsWith('d')) {
          const days = parseInt(options.expiresIn.slice(0, -1), 10);
          expiryTime = now + (days * 24 * 60 * 60);
        } else {
          // Assume seconds
          expiryTime = now + parseInt(options.expiresIn, 10);
        }
      } else {
        // Numeric value in seconds
        expiryTime = now + options.expiresIn;
      }
      
      payload.exp = expiryTime;
    }
    
    // Add issued at timestamp
    payload.iat = Math.floor(Date.now() / 1000);

    // Encode header and payload
    const encodedHeader = base64url(textEncoder.encode(JSON.stringify(header)));
    const encodedPayload = base64url(textEncoder.encode(JSON.stringify(payload)));
    
    // Create the message to sign
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Sign the message using HMAC with SHA-256
    const key = await window.crypto.subtle.importKey(
      'raw',
      getSecretKey(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      textEncoder.encode(message)
    );
    
    // Create the complete JWT token
    const encodedSignature = base64url(signature);
    return `${message}.${encodedSignature}`;
    
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw error;
  }
};

// Verify a JWT token
export const verify = async (
  token: string,
  secret: string
): Promise<Record<string, any>> => {
  try {
    // Check token format first
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // STRICT PRODUCTION SAFETY CHECK:
    // First check if we're in production and this is a dev token - always reject
    if (isProd()) {
      // Always log in production to see what's happening with tokens
      console.log('🔒 JWT verification in production mode');
      
      try {
        // Check token format and decode payload
        const payload = decode(token);
        
        // Perform STRICT detection of development tokens using multiple indicators
        const isDevToken = payload.dev === true || 
                          payload.environment === 'development' || 
                          payload.purpose === 'local-development-only' ||
                          (payload.sub && payload.sub.startsWith('dev-user')) ||
                          (parts[2] && parts[2].includes('dev-signature'));
        
        if (isDevToken) {
          console.error('‼️ CRITICAL SECURITY ERROR: Development token detected in production environment!');
          console.error('This is a serious security issue that must be addressed immediately.');
          
          // Log the security incident
          try {
            fetch('/api/security-incident', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                type: 'dev_token_in_prod',
                timestamp: new Date().toISOString(),
                environment: 'production',
                severity: 'critical'
              })
            }).catch(() => {});  // Suppress errors from the logging attempt
            
            // Force redirect to login in production environments after a short delay
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                window.location.href = '/login?error=security_violation';
              }, 2000); // Give time for logging to complete
            }
          } catch (e) {
            // Silent catch for logging
          }
          
          // Always throw an error to prevent authentication with dev tokens in production
          throw new Error('Invalid authentication token');
        }
      } catch (parseError) {
        console.error('Token parse error in production:', parseError);
        // If we can't parse it, continue to normal verification which will fail anyway
      }
    }
    
    // No development token verification in production-ready code
    if (isProd()) {
      console.log('🔒 Production mode - performing standard verification');
    }
    
    // Standard JWT validation
    const [header, payload, providedSignature] = parts;
    const message = `${header}.${payload}`;
    
    // Import the key for verification
    const key = await window.crypto.subtle.importKey(
      'raw',
      getSecretKey(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Generate signature and verify
    const signatureValid = await window.crypto.subtle.verify(
      'HMAC',
      key,
      base64urlDecode(providedSignature),
      textEncoder.encode(message)
    );
    
    if (!signatureValid) {
      throw new Error('Invalid signature');
    }
    
    // Return the payload
    return JSON.parse(textDecoder.decode(base64urlDecode(payload)));
  } catch (error) {
    console.error('Error verifying JWT:', error);
    throw error;
  }
};
