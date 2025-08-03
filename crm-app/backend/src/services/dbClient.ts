/**
 * Browser-compatible database client
 * 
 * This file provides a frontend-compatible interface for making database requests.
 * It uses fetch API to communicate with backend API endpoints instead of connecting
 * directly to PostgreSQL, which isn't possible in a browser environment.
 * 
 * This file supports both development mode (with mocked responses) and production mode
 * (with real API calls to the backend).
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
      format: (query: string, _values: any[]) => query
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

// import { UserRole } from '../types/auth'; // Removed unused import

// Generic interface to match pg-promise's query method signature
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

// Removed unused DbUser interface

// Define API base URL
const API_BASE_URL = process.env.VITE_API_URL || '/api';
const USE_MOCKS = process.env.VITE_USE_MOCKS === 'true';

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
 * Database client for frontend use
 * This emulates the pg-promise interface but works in browser environments
 */
export const db: DbClient = {
  /**
   * Execute a query that returns one or no result
   */
  oneOrNone: async <T>(query: string, values: any[] = []): Promise<T | null> => {
    console.log('DB oneOrNone query:', { query, values });
    
    // Use real API calls in production
    if (!USE_MOCKS) {
      console.log('Using real DB API');
      
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('jwt-token');
        if (!token) {
          console.error('No JWT token available for API call');
          return null;
        }
        
        // Make API call to the server
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query,
            values,
            type: 'oneOrNone'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }
        
        // Parse and return the result
        const result = await response.json();
        return result as T | null;
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      }
    }
      // No longer using mocks for authentication
    console.log('Mock authentication is disabled, please use the real API');
    
    // Authentication operations should always use the real API
    if (query.includes('SELECT * FROM users WHERE email =')) {
      console.warn('Authentication operations should use the API, not direct DB access in browser');
      throw new Error('Authentication requires the backend API. Set VITE_USE_MOCKS=false in .env');
    }
    // No longer using mocks for token verification
    if (query.includes('SELECT * FROM users WHERE uid =')) {
      console.warn('Token verification should use the API, not direct DB access in browser');
      throw new Error('User verification requires the backend API. Set VITE_USE_MOCKS=false in .env');
    }
    
    // Default response for unknown queries
    console.warn('Unhandled DB query in mock dbClient:', query);
    return null;
  },
  
  /**
   * Execute a query that returns exactly one result
   */
  one: async <T>(query: string, values: any[] = []): Promise<T> => {
    console.log('DB one query:', { query, values });
    
    // Use real API calls in production
    if (!USE_MOCKS) {
      console.log('Using real DB API');
      
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('jwt-token');
        if (!token) {
          console.error('No JWT token available for API call');
          throw new Error('Authentication required');
        }
        
        // Make API call to the server
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query,
            values,
            type: 'one'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }
        
        // Parse and return the result
        const result = await response.json();
        return result as T;
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      }
    }
      // No longer using mocks for authentication
    console.log('Mock authentication is disabled, please use the real API');
    
    // Authentication operations should always use the real API
    if (query.includes('SELECT * FROM users WHERE email =')) {
      console.warn('Authentication operations should use the API, not direct DB access in browser');
      throw new Error('Authentication requires the backend API. Set VITE_USE_MOCKS=false in .env');
    }
    
    throw new Error('No data found for the query');
  },
  
  /**
   * Execute a query that returns any number of results
   */
  any: async <T>(query: string, values: any[] = []): Promise<T[]> => {
    console.log('DB any query:', { query, values });
    
    // Use real API calls in production
    if (!USE_MOCKS) {
      console.log('Using real DB API');
      
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('jwt-token');
        if (!token) {
          console.error('No JWT token available for API call');
          throw new Error('Authentication required');
        }
        
        // Make API call to the server
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query,
            values,
            type: 'any'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }
        
        // Parse and return the result
        const result = await response.json();
        return result as T[];
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      }
    }
    
    // Use mocks for development
    console.log('Using mock DB responses for any()');
    return [] as T[];
  },
  
  /**
   * Execute a query that doesn't return results
   */
  none: async (query: string, values: any[] = []): Promise<null> => {
    console.log('DB none query:', { query, values });
    
    // Use real API calls in production
    if (!USE_MOCKS) {
      console.log('Using real DB API');
      
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('jwt-token');
        if (!token) {
          console.error('No JWT token available for API call');
          throw new Error('Authentication required');
        }
        
        // Make API call to the server
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query,
            values,
            type: 'none'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }
        
        return null;
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      }
    }
    
    // Use mocks for development
    return null;
  },
  
  /**
   * Execute a raw query
   */
  query: async <T>(query: string, values: any[] = []): Promise<QueryResult<T>> => {
    console.log('DB query:', { query, values });
    
    // Use real API calls in production
    if (!USE_MOCKS) {
      console.log('Using real DB API');
      
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('jwt-token');
        if (!token) {
          console.error('No JWT token available for API call');
          throw new Error('Authentication required');
        }
        
        // Make API call to the server
        const response = await fetch(`${API_BASE_URL}/db/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query,
            values,
            type: 'query'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API request failed');
        }
        
        // Parse and return the result
        const result = await response.json();
        return result as QueryResult<T>;
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      }
    }
    
    // Mock implementation for development
    console.log('Using mock DB query response');
    return {
      rows: [],
      rowCount: 0
    };
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
