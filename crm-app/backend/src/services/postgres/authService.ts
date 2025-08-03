/**
 * PostgreSQL Authentication Service - Fixed version
 * 
 * This service provides authentication functionality using PostgreSQL.
 * It serves as a replacement for the Firebase authentication service.
 */

import { db } from '../../lib/dbClient';
import { User } from '../../types/auth';
// Import our browser-compatible JWT service instead of jsonwebtoken
import * as jwt from '../../lib/jwtService';

// Use dynamic import for bcrypt to avoid issues in browser
let bcrypt: any;

// Browser-compatible approach to authentication
// Instead of implementing bcrypt in the browser (which is insecure),
// we'll defer to the API for authentication
const initBcrypt = async () => {
  if (typeof window !== 'undefined') {
    // In browser environment, we don't need bcrypt directly
    // Instead, the authentication will happen through the API
    console.log('Browser environment detected, using API for authentication');
    
    // These are just placeholders - we won't actually use them
    // The real authentication happens in the authenticateUser function below
    bcrypt = {
      compare: async (_password: string, _hash: string) => {
        console.error('bcrypt.compare should not be called directly in browser');
        return false;
      },
      hash: async (_password: string) => {
        console.error('bcrypt.hash should not be called directly in browser');
        return '';
      }
    };
  } else {
    // In Node.js environment, use the actual bcrypt
    bcrypt = await import('bcryptjs');
  }
};

// Initialize bcrypt immediately
(async function() {
  console.log('Initializing bcrypt...');
  await initBcrypt();
  console.log('Bcrypt initialized');
})();

// Get JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Import UserRole type
import { UserRole } from '../../types/auth';

// Define DB user type to match the database schema
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
 * Authenticate a user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<{user: User, token: string}> {
  try {
    console.log('Authenticating user:', email);
    
    // In browser environments, use the API directly
    if (typeof window !== 'undefined') {
      console.log('Using enhanced API client for authentication');
      
      // Import our enhanced API client
      const { authApi } = await import('../../lib/apiClient');
      
      // Call the authentication API using our enhanced client
      const response = await authApi.login<{user: User, token: string}>(email, password);
      
      if (!response.success || !response.data) {
        console.error('Authentication failed:', response.error);
        throw new Error(response.error?.message || 'Authentication failed');
      }
      
      console.log('Authentication successful:', response.data);
      return response.data;
    }
    
    // For server-side/Node.js environments, use direct database access
    console.log('Using direct database authentication');
    
    // Find user by email
    const user = await db.oneOrNone<DbUser>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      console.error('User not found:', email);
      throw new Error('Invalid email or password');
    }
    
    // Check if user has a password hash
    if (!user.password_hash) {
      console.error('User does not have a password hash:', email);
      throw new Error('Please reset your password to continue');
    }
    
    // Verify password using bcrypt
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (err) {
      console.error('Error comparing passwords:', err);
      throw new Error('Authentication failed');
    }
    
    if (!isValidPassword) {
      console.error('Invalid password for user:', email);
      throw new Error('Invalid email or password');
    }
    
    // Generate JWT token
    const token = await jwt.sign(
      { 
        userId: user.uid,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user object and token
    return {
      user: {
        id: user.uid,
        name: user.display_name || email.split('@')[0],
        email: user.email,
        role: user.role,
      },
      token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Verify a JWT token and get the user
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    // Verify token
    const decoded = await jwt.verify(token, JWT_SECRET);
    
    // If in browser, use API
    if (typeof window !== 'undefined') {
      const { authApi } = await import('../../lib/apiClient');
      const response = await authApi.verifyToken<{valid: boolean, user: User}>(token);
      
      if (!response.success || !response.data) {
        console.error('Token verification failed:', response.error);
        return null;
      }
      
      // Extract user from the response structure {valid: true, user: {...}}
      const responseData = response.data;
      if (responseData.valid && responseData.user) {
        return responseData.user;
      }
      
      console.error('Token verification returned invalid response:', responseData);
      return null;
    }
    
    // For server-side, query the database directly
    const user = await db.oneOrNone<DbUser>(
      'SELECT * FROM users WHERE uid = $1',
      [decoded.userId]
    );
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.uid,
      name: user.display_name || user.email.split('@')[0],
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(email: string, password: string, name: string, role: string): Promise<User> {
  try {
    // Only allowed in Node.js environment
    if (typeof window !== 'undefined') {
      throw new Error('User creation not allowed in browser');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user in database
    const user = await db.one<DbUser>(
      `INSERT INTO users 
       (email, password_hash, display_name, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING *`,
      [email, passwordHash, name, role]
    );
    
    return {
      id: user.uid,
      name: user.display_name || user.email.split('@')[0],
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error('User creation error:', error);
    throw error;
  }
}

/**
 * Change user password
 */
export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    // Only allowed in Node.js environment
    if (typeof window !== 'undefined') {
      throw new Error('Password change not allowed in browser');
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    const result = await db.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW() 
       WHERE uid = $2`,
      [passwordHash, userId]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Password change error:', error);
    throw error;
  }
}

/**
 * Logout user (cleanup)
 */
export async function logoutUser(): Promise<void> {
  // Not much to do for logout with JWT, but we can log it
  console.log('User logged out');
}

