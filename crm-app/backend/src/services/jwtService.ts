/**
 * JWT Token Management Service
 * Handles token generation, validation, and automatic refresh
 */

import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

// Token expiry times
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

// JWT Secrets from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be configured in environment variables');
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
  name?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

/**
 * Generate access and refresh token pair
 */
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  const accessToken = jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'asp-cranes-crm',
    audience: 'asp-cranes-users'
  });

  const refreshToken = jwt.sign(
    { 
      id: payload.id, 
      email: payload.email,
      tokenType: 'refresh'
    }, 
    JWT_REFRESH_SECRET as string, 
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'asp-cranes-crm',
      audience: 'asp-cranes-users'
    }
  );

  // Calculate expiry times in milliseconds
  const accessExpiry = getTokenExpiryMs(ACCESS_TOKEN_EXPIRY);
  const refreshExpiry = getTokenExpiryMs(REFRESH_TOKEN_EXPIRY);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiry,
    refreshExpiresIn: refreshExpiry
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET as string, {
      issuer: 'asp-cranes-crm',
      audience: 'asp-cranes-users'
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET as string, {
      issuer: 'asp-cranes-crm',
      audience: 'asp-cranes-users'
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Set HTTP-only cookies for tokens
 */
export const setTokenCookies = (res: Response, tokens: TokenPair): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Access token cookie (shorter expiry)
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: tokens.expiresIn,
    path: '/'
  });

  // Refresh token cookie (longer expiry)
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: tokens.refreshExpiresIn,
    path: '/api/auth/refresh'
  });
};

/**
 * Clear authentication cookies
 */
export const clearTokenCookies = (res: Response): void => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
};

/**
 * Extract token from request (cookie or header)
 */
export const extractTokenFromRequest = (req: Request): string | null => {
  // Try cookie first (preferred)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Fallback to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Check if token is about to expire (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;

    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return (expiryTime - currentTime) < fiveMinutes;
  } catch {
    return true;
  }
};

/**
 * Get token expiry in milliseconds from string format
 */
const getTokenExpiryMs = (expiryString: string): number => {
  const value = parseInt(expiryString);
  const unit = expiryString.slice(-1);

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return value * 60 * 1000; // Default to minutes
  }
};

/**
 * Generate a new access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // In a real application, you'd fetch user data from database
    // For now, using the decoded data
    const payload: TokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    };

    const newAccessToken = jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'asp-cranes-crm',
      audience: 'asp-cranes-users'
    });

    return newAccessToken;
  } catch (error) {
    throw new Error('Failed to refresh access token');
  }
};

/**
 * Validate token structure and format
 */
export const validateTokenStructure = (token: string): boolean => {
  if (!token) return false;
  
  const parts = token.split('.');
  return parts.length === 3; // JWT has 3 parts: header.payload.signature
};

/**
 * Get token expiry date
 */
export const getTokenExpiry = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Generate API key for service-to-service communication
 */
export const generateApiKey = (serviceId: string): string => {
  const payload = {
    serviceId,
    type: 'api-key',
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: '1y', // API keys last longer
    issuer: 'asp-cranes-crm',
    audience: 'asp-cranes-services'
  });
};

export default {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  extractTokenFromRequest,
  isTokenExpiringSoon,
  refreshAccessToken,
  validateTokenStructure,
  getTokenExpiry,
  generateApiKey
};
