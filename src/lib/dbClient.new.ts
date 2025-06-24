/**
 * Browser-compatible database client
 * 
 * This file provides a frontend-compatible interface for making database requests.
 * It uses fetch API to communicate with backend API endpoints instead of connecting
 * directly to PostgreSQL, which isn't possible in a browser environment.
 */

// Create a mock process object for browser environments
// This needs to be before any other imports to ensure it's available
if (typeof window !== 'undefined') {
  if (typeof process === 'undefined') {
    (window as any).process = {
      env: {},
      cwd: () => '/',
      platform: navigator.platform.toLowerCase().includes('win') ? 'win32' : 'posix'
    };
  }
  
  // Mock pg-promise modules needed by other imported libraries
  (window as any).pgPromise = {
    as: {
      format: (query: string) => query
    }
  };
  
  // Create required Node.js modules
  if (!(window as any).require) {
    (window as any).require = (moduleName: string) => {
      console.log(`Mock require: ${moduleName}`);
      // Return empty mock implementations for Node.js modules
      if (moduleName === 'os') {
        return { 
          hostname: () => 'browser-environment',
          networkInterfaces: () => ({})
        };
      }
      if (moduleName === 'crypto') {
        return { randomBytes: () => ({ toString: () => 'mock-random-bytes' }) };
      }
      return {};
    };
  }
}

import { UserRole } from '../types/auth';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.MODE === 'development';

// Generic interface to match pg-promise's query method signature
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

// Interface for database user
interface DbUser {
  uid: string;
  email: string;
  display_name?: string;
  role: UserRole;
  password_hash?: string;
}

// Type definition for the database client
interface DbClient {
  oneOrNone: <T>(query: string, values?: any[]) => Promise<T | null>;
  one: <T>(query: string, values?: any[]) => Promise<T>;
  any: <T>(query: string, values?: any[]) => Promise<T[]>;
  none: (query: string, values?: any[]) => Promise<null>;
  query: <T>(query: string, values?: any[]) => Promise<QueryResult<T>>;
  connect: () => Promise<{ done: () => void }>;
}

/**
 * Simplified database client for frontend use
 * This emulates the pg-promise interface but works in browser environments
 */
export const db: DbClient = {
  /**
   * Execute a query that returns one or no result
   */
  oneOrNone: async <T>(query: string, values: any[] = []): Promise<T | null> => {
    console.log('DB oneOrNone query:', { query, values });
    
    // Use mocks for development or when explicitly enabled
    if (USE_MOCKS) {
      console.log('Using mock DB responses');
      
      // Mock authentication for testing
      if (query.includes('SELECT * FROM users WHERE email =')) {
        const email = values[0];
        
        // Mock admin user
        if (email === 'admin@example.com' || email === 'admin@aspcranes.com') {
          return {
            uid: 'admin-uid-123',
            email: email,
            display_name: 'Admin User',
            role: 'admin' as UserRole,
            password_hash: '$2a$10$zG2.NRH1UEXyA3HmlzNK7.LpWK8wlJ96jr9MWBR4Viq.3nhzqGE4G', // bcrypt hash for "password123"
          } as T;
        }
        
        // For testing other roles
        if (email === 'sales@example.com') {
          return {
            uid: 'sales-uid-456',
            email: 'sales@example.com',
            display_name: 'Sales Agent',
            role: 'sales_agent' as UserRole,
            password_hash: '$2a$10$zG2.NRH1UEXyA3HmlzNK7.LpWK8wlJ96jr9MWBR4Viq.3nhzqGE4G',
          } as T;
        }
        
        if (email === 'ops@example.com') {
          return {
            uid: 'ops-uid-789',
            email: 'ops@example.com',
            display_name: 'Operations Manager',
            role: 'operations_manager' as UserRole,
            password_hash: '$2a$10$zG2.NRH1UEXyA3HmlzNK7.LpWK8wlJ96jr9MWBR4Viq.3nhzqGE4G',
          } as T;
        }
        
        // No user found
        return null;
      }
      
      // Mock get user by ID for token verification
      if (query.includes('SELECT * FROM users WHERE uid =')) {
        const uid = values[0];
        
        // Mock responses based on user ID
        if (uid === 'admin-uid-123') {
          // Use the last login email if available, or default to example.com
          const email = localStorage.getItem('last-login-email') || 'admin@example.com';
          
          return {
            uid: 'admin-uid-123',
            email: email,
            display_name: 'Admin User',
            role: 'admin' as UserRole,
          } as T;
        }
        
        if (uid === 'sales-uid-456') {
          return {
            uid: 'sales-uid-456',
            email: 'sales@example.com',
            display_name: 'Sales Agent',
            role: 'sales_agent' as UserRole,
          } as T;
        }
        
        if (uid === 'ops-uid-789') {
          return {
            uid: 'ops-uid-789',
            email: 'ops@example.com',
            display_name: 'Operations Manager',
            role: 'operations_manager' as UserRole,
          } as T;
        }
        
        return null;
      }
      
      // Default response for unknown queries in mock mode
      console.warn('Unhandled DB query in mock dbClient:', query);
      return null;
    } 
    else {
      // In production, make API calls to the real backend
      try {
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt-token') || ''}`,
          },
          body: JSON.stringify({
            query,
            values,
            type: 'oneOrNone'
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Database query failed');
        }
        
        const data = await response.json();
        return data as T;
      } catch (error) {
        console.error('DB query error:', error);
        throw error;
      }
    }
  },
  
  /**
   * Execute a query that returns exactly one result
   */
  one: async <T>(query: string, values: any[] = []): Promise<T> => {
    const result = await db.oneOrNone<T>(query, values);
    if (!result) {
      throw new Error('No data returned from the query.');
    }
    return result;
  },
  
  /**
   * Execute a query that returns multiple results
   */
  any: async <T>(query: string, values: any[] = []): Promise<T[]> => {
    console.log('DB any query:', { query, values });
    
    if (USE_MOCKS) {
      // Mock implementation
      return [] as T[];
    } else {
      // Real implementation using API
      try {
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt-token') || ''}`,
          },
          body: JSON.stringify({
            query,
            values,
            type: 'any'
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Database query failed');
        }
        
        const data = await response.json();
        return data as T[];
      } catch (error) {
        console.error('DB query error:', error);
        throw error;
      }
    }
  },
  
  /**
   * Execute a query that doesn't return results
   */
  none: async (query: string, values: any[] = []): Promise<null> => {
    console.log('DB none query:', { query, values });
    
    if (USE_MOCKS) {
      return null;
    } else {
      // Real implementation using API
      try {
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt-token') || ''}`,
          },
          body: JSON.stringify({
            query,
            values,
            type: 'none'
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Database query failed');
        }
        
        return null;
      } catch (error) {
        console.error('DB query error:', error);
        throw error;
      }
    }
  },
  
  /**
   * Execute a raw query
   */
  query: async <T>(query: string, values: any[] = []): Promise<QueryResult<T>> => {
    console.log('DB raw query:', { query, values });
    
    if (USE_MOCKS) {
      return {
        rows: [],
        rowCount: 0
      };
    } else {
      // Real implementation using API
      try {
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt-token') || ''}`,
          },
          body: JSON.stringify({
            query,
            values,
            type: 'query'
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Database query failed');
        }
        
        const data = await response.json();
        return data as QueryResult<T>;
      } catch (error) {
        console.error('DB query error:', error);
        throw error;
      }
    }
  },
  
  /**
   * Mock function to test connection
   */
  connect: async () => {
    console.log('Mock DB connection test');
    return {
      done: () => {}
    };
  }
};

export default db;
