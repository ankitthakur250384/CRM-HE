/**
 * Debug Helper Utility
 * 
 * A simplified version that replaces the removed debug helper file.
 * This version logs operations in development mode but does nothing in production.
 */

// Function to safely monitor operations - will only log in development
export const monitorOperation = (
  operationName: string, 
  callback: () => Promise<any>,
  options: { 
    silent?: boolean,
    timeoutMs?: number 
  } = {}
): Promise<any> => {
  const isProd = import.meta.env.PROD || process.env.NODE_ENV === 'production';
  
  // In production, just execute the callback without monitoring
  if (isProd) {
    return callback();
  }
  
  // In development, add some monitoring
  console.log(`[DEBUG] Starting operation: ${operationName}`);
  const startTime = performance.now();
  
  return callback()
    .then(result => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!options.silent) {
        console.log(`[DEBUG] Completed operation: ${operationName} in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    })
    .catch(error => {
      console.error(`[DEBUG] Error in operation: ${operationName}`, error);
      throw error;
    });
};

// No-op function for operations that don't need monitoring
export const noopMonitor = <T>(value: T): T => value;

// Debug logger that only logs in development
export const debugLog = (...args: any[]): void => {
  if (!import.meta.env.PROD) {
    console.log('[DEBUG]', ...args);
  }
};

export default {
  monitorOperation,
  noopMonitor,
  debugLog
};
