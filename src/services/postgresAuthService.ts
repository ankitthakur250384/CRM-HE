/**
 * PostgreSQL Authentication Service
 * 
 * This service provides authentication functionality using PostgreSQL.
 * It serves as a replacement for the Firebase authentication service.
 */

import { authenticateUser, verifyToken, createUser, changePassword, logoutUser } from './postgres/authService';
import { User } from '../types/auth';

/**
 * Sign in a user with email and password
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔑 Starting PostgreSQL sign in process for:', email);
    
    // Authenticate user and get token
    const { user, token } = await authenticateUser(email, password);
    
    // Store token in local storage
    localStorage.setItem('jwt-token', token);
    
    console.log('✅ PostgreSQL authentication successful');
    
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign up a new user
 */
export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: string
): Promise<User> => {
  try {
    // Create user in PostgreSQL
    const user = await createUser(email, password, name, role);
    
    // Generate token and sign in
    await signIn(email, password);
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    // Clear JWT token from localStorage
    localStorage.removeItem('jwt-token');
    
    // Call logout function (mostly for logging/cleanup)
    await logoutUser();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get the current user from JWT token
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('jwt-token');
    
    if (!token) {
      return null;
    }
    
    // Verify token and get user
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    // Token may be invalid or expired
    localStorage.removeItem('jwt-token');
    return null;
  }
};

/**
 * Update user password
 */
export const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    return await changePassword(userId, newPassword);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
