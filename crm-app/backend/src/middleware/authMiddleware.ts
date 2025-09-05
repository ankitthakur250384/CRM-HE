/**
 * Production-Ready JWT Authentication Middleware
 * Implements secure token validation, role-based access control, and refresh token logic
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
// import rateLimit from 'express-rate-limit'; // Will install this separately
import { findUserById } from '../services/postgres/authRepository.js';

// Environment variables with secure defaults
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  return 'development-only-secret-key';
})();

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REFRESH_TOKEN_SECRET must be set in production environment');
  }
  return 'development-only-refresh-secret';
})();

// Rate limiting for authentication endpoints - TODO: Install express-rate-limit package
// export const authRateLimit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: {
//     error: 'Too many authentication attempts, please try again later',
//     retryAfter: 15 * 60 // seconds
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Extended Request interface with user data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    iat?: number;
    exp?: number;
  };
}

/**
 * Main JWT Authentication Middleware
 * Validates access tokens and attaches user data to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Security logging (without sensitive data)
    console.log(`🔒 [AUTH] ${req.method} ${req.originalUrl} from ${req.ip}`);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'UNAUTHORIZED',
        message: 'Access token required. Please include Bearer token in Authorization header.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Validate token payload structure
    if (!decoded.id || !decoded.email || !decoded.role) {
      res.status(401).json({ 
        error: 'INVALID_TOKEN_PAYLOAD',
        message: 'Token payload is missing required fields'
      });
      return;
    }

    // Optional: Verify user still exists in database (for high-security scenarios)
    if (process.env.VERIFY_USER_ON_EACH_REQUEST === 'true') {
      const user = await findUserById(decoded.id);
      if (!user) {
        res.status(401).json({ 
          error: 'USER_NOT_FOUND',
          message: 'User account no longer exists'
        });
        return;
      }
    }

    // Attach user data to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      iat: decoded.iat,
      exp: decoded.exp
    };

    console.log(`✅ [AUTH] User authenticated: ${decoded.email} (${decoded.role})`);
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'TOKEN_EXPIRED',
        message: 'Access token has expired. Please refresh your token.'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'INVALID_TOKEN',
        message: 'Invalid access token format'
      });
      return;
    }

    // Generic error handling
    console.error('🔒 [AUTH] Authentication error:', error);
    res.status(500).json({ 
      error: 'AUTHENTICATION_ERROR',
      message: 'Internal authentication error'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'AUTHENTICATION_REQUIRED',
        message: 'User must be authenticated to access this resource'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`🚫 [RBAC] Access denied: ${req.user.email} (${req.user.role}) attempted to access ${req.originalUrl}`);
      res.status(403).json({ 
        error: 'INSUFFICIENT_PRIVILEGES',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      });
      return;
    }

    console.log(`✅ [RBAC] Access granted: ${req.user.email} (${req.user.role}) accessing ${req.originalUrl}`);
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user data if token is present, but doesn't require authentication
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      };
    } catch (error) {
      // Silently fail for optional auth
      console.log('🔒 [OPTIONAL_AUTH] Invalid token provided, continuing without authentication');
    }
  }
  
  next();
};

/**
 * Refresh Token Verification
 * Used specifically for token refresh endpoints
 */
export const verifyRefreshToken = (refreshToken: string): any => {
  try {
    return jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Generate Token Pair (Access + Refresh)
 */
export const generateTokenPair = (payload: object) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '15m' // Short-lived access token
  });
  
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { 
    expiresIn: '7d' // Long-lived refresh token
  });
  
  return { accessToken, refreshToken };
};

/**
 * Security Headers Middleware
 * Adds essential security headers to all responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com;"
  );
  
  next();
};

export { JWT_SECRET, REFRESH_TOKEN_SECRET };
