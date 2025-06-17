/**
 * Debug helper utilities for tracking and preventing page freezes and infinite loops
 */

// Default timeout for detecting potential infinite loops (in ms)
const DEFAULT_TIMEOUT = 3000;

/**
 * Utility to detect potential infinite loops or long-running operations
 * that might cause the UI to become unresponsive
 */
export const monitorOperation = (
  operation: string,
  timeoutMs = DEFAULT_TIMEOUT
): () => void => {
  const startTime = performance.now();
  const timeoutId = setTimeout(() => {
    const elapsedTime = performance.now() - startTime;
    console.warn(`Operation "${operation}" is taking unusually long (${elapsedTime.toFixed(2)}ms)`);
  }, timeoutMs);
  
  // Return a function to call when operation completes
  return () => {
    clearTimeout(timeoutId);
    const elapsedTime = performance.now() - startTime;
    
    if (process.env.NODE_ENV !== 'production' && elapsedTime > 500) {
      console.debug(`Operation "${operation}" completed in ${elapsedTime.toFixed(2)}ms`);
    }
  };
};

/**
 * Detects React render loop issues by tracking component render counts
 * @param componentName - Name of the component for identification
 * @param renderCount - Current render count (from useRef)
 * @param threshold - Max acceptable renders in short succession
 */
export const detectRenderLoop = (
  componentName: string, 
  renderCount: number,
  threshold = 25
): void => {
  if (renderCount > threshold) {
    console.warn(
      `Potential render loop detected in ${componentName}: ` +
      `${renderCount} renders in quick succession`
    );
  }
};
