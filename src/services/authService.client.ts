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
    
    // Verify token with server
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Invalid or expired token');
    }
    
    const { user } = await response.json();
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
