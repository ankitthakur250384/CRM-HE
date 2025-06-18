/**
 * Utility to clean up all intervals and timeouts that might cause reloads
 * This is used to break any reload cycles by forcibly clearing all timers
 */

// Arrays to track active interval and timeout IDs
const activeIntervals: number[] = [];
const activeTimeouts: number[] = [];

// Track if we've already initialized to prevent double wrapping
let isInitialized = false;

/**
 * Initialize the interval cleaner
 */
export function initIntervalCleaner() {
  // Prevent double initialization
  if (isInitialized) {
    console.log('⚠️ Interval cleaner already initialized - skipping');
    return;
  }
  
  console.log('🔄 Initializing interval and timeout tracking');
  
  // Use a safer approach by wrapping calls instead of overriding native functions
  const originalSetInterval = window.setInterval;
  const originalSetTimeout = window.setTimeout;

  // Wrap setInterval
  window.setInterval = function setIntervalTracked(callback: Function, ms?: number, ...args: any[]) {
    const id = originalSetInterval(callback as any, ms, ...args);
    activeIntervals.push(id as unknown as number);
    return id;
  } as typeof setInterval;

  // Wrap setTimeout
  window.setTimeout = function setTimeoutTracked(callback: Function, ms?: number, ...args: any[]) {
    const id = originalSetTimeout(callback as any, ms, ...args);
    activeTimeouts.push(id as unknown as number);
    return id;
  } as typeof setTimeout;
    // REMOVED interval monitoring to prevent potential auto-reloads
  console.log('🛑 Interval monitoring disabled to prevent auto-reloads');
  
  // Mark as initialized
  isInitialized = true;
}

/**
 * Clear all active intervals and timeouts
 * Use this to break potential reload loops
 */
export function clearAllTimers() {
  console.log(`🧹 Clearing ${activeIntervals.length} tracked intervals and ${activeTimeouts.length} tracked timeouts`);
  
  try {
    // Clear all tracked intervals
    activeIntervals.forEach(id => {
      try {
        window.clearInterval(id);
      } catch (err) {
        console.warn(`Failed to clear interval ${id}:`, err);
      }
    });
    
    // Clear all tracked timeouts
    activeTimeouts.forEach(id => {
      try {
        window.clearTimeout(id);
      } catch (err) {
        console.warn(`Failed to clear timeout ${id}:`, err);
      }
    });
    
    // Reset arrays
    activeIntervals.length = 0;
    activeTimeouts.length = 0;
    
    // Emergency cleanup: Clear any other potential intervals up to a high ID
    // This is a safety net in case some intervals were created before our tracking was initialized
    console.log('Performing additional emergency interval cleanup...');
    for (let i = 1; i < 1000; i++) {
      window.clearInterval(i);
      window.clearTimeout(i);
    }
    
    console.log('✅ All timers successfully cleared');
  } catch (e) {
    console.error('❌ Error during timer cleanup:', e);
  }
}

/**
 * Get the current count of active timers
 * Useful for debugging purposes
 */
export function getTimerCounts() {
  return {
    intervalCount: activeIntervals.length,
    timeoutCount: activeTimeouts.length
  };
}
