/**
 * Authentication Middleware
 * 
 * This file contains middleware functions for authenticating API requests
 * using JWT tokens. It supports development mode bypassing for easier testing.
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Authentication middleware that verifies JWT tokens
 * Attaches the decoded user to the request object if successful
 */
export const authenticateToken = (req, res, next) => {
  // Skip authentication check if we're in development mode with bypass header
  if (
    process.env.NODE_ENV === 'development' && 
    (
      req.headers['x-bypass-auth'] === 'development-only-123' ||
      req.headers['x-bypass-auth'] === 'true'
    )
  ) {
    console.log('⚠️ Bypassing authentication in development mode');
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'No authentication token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_for_development', (err, user) => {
    if (err) {
      console.log('❌ Invalid token:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

/**
 * Role-based authorization middleware
 * Usage: authorizeRoles(['admin', 'manager'])
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ message: 'Insufficient permissions' });
  };
};
