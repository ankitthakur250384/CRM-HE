/**
 * Production Utilities
 * 
 * This module provides utility functions for ensuring production-readiness
 * and proper operation with the database.
 */

import { api } from '../lib/apiService';

/**
 * Ensures that we handle API errors correctly in production without falling back to mock data
 * 
 * @param error The error that occurred during API call
 * @param operation The operation that was being performed (for logging purposes)
 * @param entityType The type of entity being operated on (for logging purposes)
 * @throws The original error with clear messaging
 */
export const handleProductionApiError = (error: any, operation: string, entityType: string): never => {
  // Log the error with detailed information
  console.error(`[API ERROR] ${operation} ${entityType} failed:`, error);
  
  // If we're in production, ensure detailed errors aren't leaked to the client
  const errorMessage = process.env.NODE_ENV === 'production'
    ? `Unable to ${operation} ${entityType}. Please contact support.`
    : `Unable to ${operation} ${entityType}: ${error.message || 'Unknown error'}`;
  
  // Throw an error to be handled by the caller
  throw new Error(errorMessage);
};

/**
 * Verifies a database connection can be established
 * @returns Promise that resolves when connection is verified, rejects if connection fails
 */
export const verifyDatabaseConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get<{ status: string }>('/health');
    return response?.status === 'ok';
  } catch (error) {
    console.error('Failed to verify database connection:', error);
    return false;
  }
};

/**
 * Ensures proper database operation by checking database health
 * before performing an operation. This should be used at app initialization time
 * to verify the database is accessible.
 */
export const ensureDatabaseOperation = async (): Promise<void> => {
  const isConnected = await verifyDatabaseConnection();
  
  if (!isConnected && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Database connection could not be established in production mode. ' + 
      'Please check your environment configuration and ensure the database is running.'
    );
  }

  if (!isConnected) {
    console.warn(
      '⚠️ Database connection could not be established. ' +
      'The application may not function correctly without a database connection.'
    );
  }
};

