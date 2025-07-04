/**
 * Initialize Users for Authentication
 * Creates default admin and test users in the existing database
 */

import { initializeUsersTable } from './src/services/postgres/authRepository.js';

console.log('🚀 Initializing users for ASP Cranes CRM...');

try {
  await initializeUsersTable();
  console.log('✅ User initialization complete!');
  
  console.log('\n🔐 Available login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin User:');
  console.log('   Email: admin@aspcranes.com');
  console.log('   Password: admin123');
  console.log('   Role: admin');
  console.log('');
  console.log('👤 Test User:');
  console.log('   Email: test@aspcranes.com');
  console.log('   Password: test123');
  console.log('   Role: sales_agent');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
} catch (error) {
  console.error('❌ Failed to initialize users:', error.message);
  process.exit(1);
}

process.exit(0);
