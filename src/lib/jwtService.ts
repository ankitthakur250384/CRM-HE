/**
 * Browser-compatible JWT service using Web Crypto API
 */

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
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
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
    
    // Decode and parse the payload
    const decodedPayload = JSON.parse(textDecoder.decode(base64urlDecode(payload)));
    
    // Check expiration
    if (decodedPayload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= decodedPayload.exp) {
        throw new Error('Token expired');
      }
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    throw error;
  }
};

export default {
  sign,
  verify,
  decode
};