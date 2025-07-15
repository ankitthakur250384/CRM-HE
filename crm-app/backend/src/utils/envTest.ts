/**
 * Environment Detection Test Script
 * Use this to verify that environment detection is working correctly
 */

import { isProd, isDev } from './envConfig';

console.log('========================================');
console.log('Environment Detection Test');
console.log('========================================');

console.log('\nEnvironment variables:');
console.log('- process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('- import.meta.env.MODE:', import.meta.env.MODE);
console.log('- import.meta.env.DEV:', import.meta.env.DEV);
console.log('- import.meta.env.PROD:', import.meta.env.PROD);

console.log('\nEnvironment detection results:');
console.log('- isProd():', isProd());
console.log('- isDev():', isDev());

console.log('\nBrowser environment:');
if (typeof window !== 'undefined') {
  console.log('- window.location.hostname:', window.location.hostname);
  console.log('- localStorage env marker:', localStorage.getItem('env-deploy-type'));
} else {
  console.log('- Not in browser environment');
}

console.log('\n========================================');

// Simulate production environment
if (!isProd()) {
  console.log('Simulating production environment:');
  
  // Set localStorage marker
  if (typeof window !== 'undefined') {
    localStorage.setItem('env-deploy-type', 'production');
    console.log('- Set localStorage env-deploy-type to "production"');
  }
  
  // Re-check environment
  console.log('- isProd() after simulation:', isProd());
}

// Export a function to run this test
export function runEnvironmentTest() {
  console.log('Environment test executed at:', new Date().toISOString());
  
  return {
    isProd: isProd(),
    isDev: isDev(),
    nodeEnv: process.env.NODE_ENV,
    viteMode: import.meta.env.MODE,
    viteDev: import.meta.env.DEV,
    viteProd: import.meta.env.PROD,
  };
}
