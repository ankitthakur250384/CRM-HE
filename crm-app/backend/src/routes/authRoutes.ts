/**
 * Enhanced Authentication Routes with Refresh Token Support
 * Implements secure login, registration, token refresh, and MFA preparation
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { authenticateToken, generateTokenPair, verifyRefreshToken } from '../middleware/authMiddleware.js';
import * as authRepository from '../services/postgres/authRepository.js';

const router = express.Router();

/**
 * Enhanced Login with Refresh Token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember = false } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'MISSING_CREDENTIALS',
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await authRepository.findUserByEmail(email);
    
    if (!user || !user.password_hash) {
      return res.status(401).json({ 
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ 
        error: 'ACCOUNT_INACTIVE',
        message: 'Account is not active. Please contact administrator.' 
      });
    }

    // Prepare JWT payload
    const tokenPayload = {
      id: user.uid,
      email: user.email,
      role: user.role,
      name: user.display_name || user.email
    };

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    // Set refresh token as httpOnly cookie
    const refreshTokenExpiry = remember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days if remember, 7 days otherwise
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: refreshTokenExpiry
    });

    // Update last login timestamp
    await authRepository.updateLastLogin(user.uid);

    // Return access token and user data
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.uid,
        email: user.email,
        role: user.role,
        name: user.display_name || user.email,
        lastLogin: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Internal server error during login' 
    });
  }
});

/**
 * Token Refresh Endpoint
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token not found. Please login again.' 
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get fresh user data to ensure account is still valid
    const user = await authRepository.findUserById(decoded.id);
    
    if (!user || (user.status && user.status !== 'active')) {
      // Clear invalid refresh token
      res.clearCookie('refreshToken');
      return res.status(401).json({ 
        error: 'USER_INVALID',
        message: 'User account is no longer valid. Please login again.' 
      });
    }

    // Generate new token pair
    const tokenPayload = {
      id: user.uid,
      email: user.email,
      role: user.role,
      name: user.display_name || user.email
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(tokenPayload);

    // Update refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken,
      user: {
        id: user.uid,
        email: user.email,
        role: user.role,
        name: user.display_name || user.email
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.clearCookie('refreshToken');
    res.status(401).json({ 
      error: 'REFRESH_FAILED',
      message: 'Token refresh failed. Please login again.' 
    });
  }
});

/**
 * Enhanced Logout
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    // Optionally: Add access token to blacklist (requires Redis or similar)
    // await addTokenToBlacklist(req.headers.authorization?.substring(7));
    
    res.status(200).json({ 
      message: 'Logout successful' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'LOGOUT_ERROR',
      message: 'Error during logout' 
    });
  }
});

/**
 * Enhanced Registration with Security Features
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'operator' } = req.body;
    
    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'MISSING_FIELDS',
        message: 'Email, password, and name are required' 
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid email address' 
      });
    }

    // Check if user exists
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'USER_EXISTS',
        message: 'User with this email already exists' 
      });
    }

    // Validate role
    const allowedRoles = ['admin', 'sales_agent', 'operations_manager', 'operator', 'support'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'INVALID_ROLE',
        message: `Role must be one of: ${allowedRoles.join(', ')}` 
      });
    }

    // Hash password with increased rounds for better security
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Generate unique user ID
    const userUid = 'usr_' + Math.random().toString(36).substring(2, 15);
    
    // Create user
    await authRepository.createUser(userUid, email, hashedPassword, role, name);
    
    // Generate token pair for immediate login
    const tokenPayload = { id: userUid, email, role, name };
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      user: { id: userUid, email, role, name }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'REGISTRATION_ERROR',
      message: 'Internal server error during registration' 
    });
  }
});

/**
 * Get Current User Profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await authRepository.findUserById(req.user!.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'USER_NOT_FOUND',
        message: 'User profile not found' 
      });
    }

    res.status(200).json({
      user: {
        id: user.uid,
        email: user.email,
        role: user.role,
        name: user.display_name || user.email,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'PROFILE_ERROR',
      message: 'Error fetching user profile' 
    });
  }
});

/**
 * Validate Token (for frontend token validation)
 */
router.get('/validate', authenticateToken, (req, res) => {
  res.status(200).json({
    valid: true,
    user: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      name: req.user!.name
    }
  });
});

/**
 * Get Sales Agents (for lead assignment)
 */
router.get('/sales-agents', authenticateToken, async (req, res) => {
  try {
    const salesAgents = await authRepository.findUsersByRole('sales_agent');
    
    const formattedAgents = salesAgents.map(agent => ({
      id: agent.uid,
      name: agent.display_name || agent.email,
      email: agent.email
    }));
    
    res.status(200).json(formattedAgents);

  } catch (error) {
    console.error('Error fetching sales agents:', error);
    res.status(500).json({ 
      error: 'FETCH_ERROR',
      message: 'Error fetching sales agents' 
    });
  }
});

export default router;
