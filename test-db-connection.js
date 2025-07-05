/**
 * Database Connection Test
 * Tests PostgreSQL connection and creates necessary tables
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vedant21',
  ssl: process.env.DB_SSL === 'true' ? true : false
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Connection config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: '***masked***',
      ssl: process.env.DB_SSL === 'true'
    });

    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📝 Creating users table...');
      await client.query(`
        CREATE TABLE users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Users table created successfully!');
      
      // Create a default admin user for testing
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (id, email, password, role, name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, [
        'admin-001',
        'admin@aspcranes.com',
        hashedPassword,
        'admin',
        'Admin User'
      ]);
      
      console.log('✅ Default admin user created!');
      console.log('   Email: admin@aspcranes.com');
      console.log('   Password: admin123');
    }
    
    // List all users
    const users = await client.query('SELECT uid, email, role, display_name, created_at FROM users');
    console.log('\n👥 Existing users:');
    users.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.display_name}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure PostgreSQL is running');
      console.log('   2. Check if the database "asp_crm" exists');
      console.log('   3. Verify connection credentials in .env file');
      console.log('   4. Check if PostgreSQL is listening on port 5432');
    }
  }
}

testConnection();
