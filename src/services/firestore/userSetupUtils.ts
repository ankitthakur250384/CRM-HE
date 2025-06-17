/**
 * Utility for manually triggering initial user setup.
 * This is separate from the automatic process to avoid Firebase rate limits.
 */

/**
 * Request initial users setup on next app load
 * This sets a flag that will be checked in firebase.ts
 */
export const requestInitialUsersSetup = () => {
  localStorage.setItem('setup-initial-users', 'true');
  console.log('Initial users setup will be performed on next app load');
  return true;
};

/**
 * Clear any user setup cooldown periods
 * Use this if you need to force setup after hitting rate limits
 */
export const clearUserSetupCooldown = () => {
  localStorage.removeItem('user-setup-cooldown');
  localStorage.removeItem('user-setup-rate-limited');
  console.log('User setup cooldown cleared');
  return true;
};

/**
 * Check if user setup is currently in cooldown
 */
export const isUserSetupInCooldown = () => {
  const cooldownUntil = parseInt(localStorage.getItem('user-setup-cooldown') || '0', 10);
  if (cooldownUntil > Date.now()) {
    const timeRemaining = Math.ceil((cooldownUntil - Date.now()) / 60000); // minutes
    console.log(`User setup in cooldown for ${timeRemaining} more minutes`);
    return true;
  }
  return false;
};
