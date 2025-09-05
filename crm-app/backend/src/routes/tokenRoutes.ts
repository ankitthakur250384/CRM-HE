/**
 * Token Refresh Endpoint
 * Handles automatic token refresh for the enhanced JWT system
 */

import express from 'express';
import { 
  verifyRefreshToken, 
  generateTokenPair, 
  setTokenCookies, 
  extractTokenFromRequest 
} from '../services/jwtService.js';

const router = express.Router();

/**
 * POST /refresh - Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    // Extract refresh token from HTTP-only cookie
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token not found'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded || decoded.tokenType !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      });
    }

    // TODO: In production, fetch user data from database using decoded.id
    // For now, using decoded data (this should be replaced with database query)
    const userPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      name: decoded.name || decoded.email
    };

    // Generate new token pair
    const tokens = generateTokenPair(userPayload);

    // Set new cookies
    setTokenCookies(res, tokens);

    // Log successful refresh
    console.log(`🔄 Token refreshed for user: ${userPayload.email}`);

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear invalid cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    
    res.status(401).json({
      success: false,
      error: 'REFRESH_FAILED',
      message: 'Failed to refresh token'
    });
  }
});

/**
 * GET /token-info - Get current token information
 */
router.get('/token-info', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'No access token found'
      });
    }

    // Decode token without verification (just to get expiry info)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    
    if (!decoded || typeof decoded !== 'object') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Invalid token format'
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = decoded.exp;
    const timeUntilExpiry = (expiresAt - now) * 1000; // Convert to milliseconds
    
    res.json({
      success: true,
      tokenInfo: {
        issuedAt: new Date(decoded.iat * 1000).toISOString(),
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        timeUntilExpiry,
        isExpired: now >= expiresAt,
        needsRefresh: timeUntilExpiry < (5 * 60 * 1000), // Less than 5 minutes
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      }
    });

  } catch (error) {
    console.error('Token info error:', error);
    res.status(500).json({
      success: false,
      error: 'TOKEN_INFO_FAILED',
      message: 'Failed to get token information'
    });
  }
});

export default router;
