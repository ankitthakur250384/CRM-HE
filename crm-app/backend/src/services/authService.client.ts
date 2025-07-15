/**
 * Client-side Auth Service
 * 
 * This service provides authentication functionality using API calls.
 * It serves as a frontend-only replacement for the postgresAuthService.
 */

import { User } from '../types/auth';
import * as jwt from '../lib/jwtService';

// API request headers
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  const authToken = localStorage.getItem('jwt-token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

/**
 * Sign in a user with email and password
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔑 Starting sign in process for:', email);
    
    // Use environment variable API URL or fall back to relative URL
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const loginUrl = `${apiUrl}/auth/login`;
    
    console.log('Login URL:', loginUrl);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Authentication failed');
    }
    
    const { token, user } = await response.json();
    
    console.log('🔍 Raw response from server:', { token: !!token, user });
    console.log('👤 User object:', JSON.stringify(user, null, 2));
    console.log('🏷️ User role:', user?.role);
    
    // Validate user object structure
    if (!user || !user.id || !user.email) {
      throw new Error('Invalid user data received from server');
    }
    
    // Ensure user has a valid role - assign default if missing
    if (!user.role || !['admin', 'sales_agent', 'operations_manager', 'operator', 'support'].includes(user.role)) {
      console.warn('⚠️ User role missing or invalid, assigning default role');
      user.role = 'admin'; // Default to admin for testing
    }
    
    console.log('✅ Final user object with role:', JSON.stringify(user, null, 2));
    
    // Store token in local storage
    localStorage.setItem('jwt-token', token);
    
    console.log('✅ Authentication successful');
    
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    // Call logout endpoint
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getHeaders()
    });
    
    // Clear local storage
    localStorage.removeItem('jwt-token');
  } catch (error) {
    console.error('Error signing out:', error);
    
    // Still clear token even if API call fails
    localStorage.removeItem('jwt-token');
  }
};

/**
 * Get the current user from token
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('jwt-token');
    
    if (!token) {
      return null;
    }

    // First try to decode the token without verification
    const decoded = jwt.decode(token);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('jwt-token');
      return null;
    }
    
    // Since /api/auth/me doesn't exist, we'll decode the JWT directly
    // This is safe because we trust our own backend-generated tokens
    console.log('🔍 getCurrentUser: Decoding JWT token directly');
    
    const user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    console.log('✅ getCurrentUser: User from JWT:', JSON.stringify(user, null, 2));
    
    // Validate user object
    if (!user.id || !user.email || !user.role) {
      console.error('❌ getCurrentUser: Invalid user data in JWT');
      localStorage.removeItem('jwt-token');
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('jwt-token');
    return null;
  }
};

/**
 * Update user password
 */
export const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/auth/users/${userId}/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update password');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
