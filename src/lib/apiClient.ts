/**
 * Enhanced API Client
 * 
 * This provides a better fetch wrapper with debugging and error handling
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';
const enableDebug = true;

/**
 * Enhanced fetch wrapper with better error handling
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  if (enableDebug) {
    console.log(`🔹 API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('Request Body:', typeof options.body === 'string' ? JSON.parse(options.body) : options.body);
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (enableDebug) {
      console.log(`🔸 API Response: ${response.status} ${response.statusText} for ${url}`);
      console.log('Response Headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
      });
    }
    
    // Clone the response so we can read it twice
    const clonedResponse = response.clone();
    
    // If not ok, try to get error details
    if (!response.ok) {
      try {
        // Try to parse as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          if (enableDebug) {
            console.error('API Error Response (JSON):', errorData);
          }
          throw new Error(errorData.error || errorData.message || 'API request failed');
        } else {
          // If not JSON, try to get the text response
          const errorText = await response.text();
          if (enableDebug) {
            console.error('API Error Response (Text):', errorText.substring(0, 500) + (errorText.length > 500 ? '...' : ''));
          }
          throw new Error('API request failed with non-JSON response');
        }
      } catch (parseError) {
        if (enableDebug) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }
    
    // For successful responses
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (enableDebug) {
          console.log('API Success Response:', data);
        }
        return data;
      } else {
        const text = await response.text();
        if (enableDebug) {
          console.log('API Success Response (Text):', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
        }
        return text;
      }
    } catch (parseError) {
      if (enableDebug) {
        console.error('Error parsing success response:', parseError);
      }
      
      // Try to get the raw text for debugging
      try {
        const text = await clonedResponse.text();
        if (enableDebug) {
          console.error('Raw response text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
        }
      } catch (textError) {
        if (enableDebug) {
          console.error('Could not get raw response text:', textError);
        }
      }
      
      throw new Error('Failed to parse API response');
    }
  } catch (error) {
    if (enableDebug) {
      console.error(`API Fetch Error for ${url}:`, error);
    }
    throw error;
  }
}

/**
 * GET request helper
 */
export function apiGet(endpoint: string, options: RequestInit = {}) {
  return apiFetch(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export function apiPost(endpoint: string, data: any, options: RequestInit = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export function apiPut(endpoint: string, data: any, options: RequestInit = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export function apiDelete(endpoint: string, options: RequestInit = {}) {
  return apiFetch(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Authentication helpers
 */
export const authApi = {
  login: (email: string, password: string) => 
    apiPost('/auth/login', { email, password }),
  
  verifyToken: (token: string) => 
    apiPost('/auth/verify-token', { token }),
  
  logout: () => 
    apiPost('/auth/logout', {})
};

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  auth: authApi,
};
