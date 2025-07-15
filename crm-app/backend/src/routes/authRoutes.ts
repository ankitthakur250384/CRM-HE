/**
 * API routes for authentication
 * This file contains API routes for user authentication with PostgreSQL
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../lib/realDbClient';
import { User, UserRole } from '../types/auth';

const router = express.Router();

// JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Interface for database user
interface DbUser {
  uid: string;
  email: string;
  display_name?: string;
  role: UserRole;
  password_hash?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Login route
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await db.oneOrNone<DbUser>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check if the user has a password (needed during migration transition)
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please reset your password to continue' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.uid,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user object and token
    return res.status(200).json({
      user: {
        id: user.uid,
        name: user.display_name || '',
        email: user.email,
        role: user.role,
      },
      token
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify token route
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Verify token
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user data from database
    const user = await db.oneOrNone<DbUser>(
      'SELECT * FROM users WHERE uid = $1',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Return user object
    return res.status(200).json({
      user: {
        id: user.uid,
        name: user.display_name || '',
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
