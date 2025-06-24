/**
 * Fixed API client with better error handling and proper TypeScript typing
 */

// Base API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || '/api';
const DEBUG_MODE = true;

/**
 * Enhanced fetch wrapper with better error handling
 * @param {string} endpoint - API endpoint to call
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  // Build URL
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Log request details
  if (DEBUG_MODE) {
    console.log(`🔹 API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      try {
        console.log('Request Body:', typeof options.body === 'string' 
          ? JSON.parse(options.body) 
          : options.body
        );
      } catch (e) {
        console.log('Request Body:', options.body);
      }
    }
  }
  
  try {
    // Make API request
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    });
    
    // Log response details
    if (DEBUG_MODE) {
      console.log(`🔸 API Response: ${response.status} ${response.statusText} for ${url}`);
      console.log('Response Headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
      });
    }
    
    // Handle response based on status
    if (!response.ok) {
      // Handle error responses
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Parse JSON error
        const errorData = await response.json();
        if (DEBUG_MODE) {
          console.error('API Error Response (JSON):', errorData);
        }
        throw new Error(errorData.error || errorData.message || `API request failed: ${response.status} ${response.statusText}`);
      } else {
        // Handle non-JSON error response
        const errorText = await response.text();
        if (DEBUG_MODE) {
          console.error('API Error Response (Text):', 
            errorText.substring(0, 500) + (errorText.length > 500 ? '...' : '')
          );
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }
    
    // Handle successful response
    const contentType = response.headers.get('content-type');
    
    // Parse response based on content type
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (DEBUG_MODE) {
        console.log('API Success Response:', data);
      }
      return data;
    } else {
      // Handle non-JSON response
      const text = await response.text();
      if (DEBUG_MODE) {
        console.log('API Success Response (Text):', 
          text.substring(0, 500) + (text.length > 500 ? '...' : '')
        );
      }
      return text;
    }
  } catch (error) {
    // Log and re-throw any fetch errors
    console.error(`API Fetch Error for ${url}:`, error);
    throw error;
  }
}

// Define types for authentication
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthResponse = {
  user: User;
  token: string;
};

/**
 * Enhanced auth-specific API client
 */
export const authApi = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: object, token: string}>} - User and token
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    console.log('🔑 authApi.login: Authenticating user:', email);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store JWT token
      if (data.token) {
        localStorage.setItem('jwt-token', data.token);
        localStorage.setItem('last-login-time', Date.now().toString());
        console.log('✅ Authentication successful, token stored');
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      console.error('❌ Authentication error:', errorMessage);
      throw error;
    }
  },
  
  /**
   * Verify token
   * @param {string} token - JWT token
   * @returns {Promise<{user: object}>} - User data
   */
  verifyToken: async (token: string): Promise<{ user: User }> => {
    try {
      return await apiFetch('/auth/verify-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      localStorage.removeItem('jwt-token');
      throw error;
    }
  },
  
  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('jwt-token');
    localStorage.removeItem('last-login-time');
  }
};

/**
 * General API client for other endpoints
 */
export const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} - Response data
   */
  get: async <T = any>(endpoint: string): Promise<T> => {
    const token = localStorage.getItem('jwt-token');
    return apiFetch(endpoint, { 
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
    });
  },
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data
   * @returns {Promise<any>} - Response data
   */
  post: async <T = any>(endpoint: string, data: any): Promise<T> => {
    const token = localStorage.getItem('jwt-token');
    return apiFetch(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data),
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
  },
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data
   * @returns {Promise<any>} - Response data
   */
  put: async <T = any>(endpoint: string, data: any): Promise<T> => {
    const token = localStorage.getItem('jwt-token');
    return apiFetch(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data),
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
  },
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} - Response data
   */
  delete: async <T = any>(endpoint: string): Promise<T> => {
    const token = localStorage.getItem('jwt-token');
    return apiFetch(endpoint, { 
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
  }
};
