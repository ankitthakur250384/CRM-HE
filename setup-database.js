/**
 * Database Schema Inspector
 * Checks current database structure and fixes it for authentication
 */

import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vedant21',
  ssl: process.env.DB_SSL === 'true' ? true : false
});

async function inspectAndFixDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Inspecting current database structure...');
    
    // Check current users table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Current users table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check current data
    console.log('\n👥 Current users in table:');
    try {
      const users = await client.query('SELECT * FROM users LIMIT 5');
      if (users.rows.length === 0) {
        console.log('  No users found');
      } else {
        users.rows.forEach((user, index) => {
          console.log(`  ${index + 1}.`, Object.keys(user).map(key => `${key}: ${user[key]}`).join(', '));
        });
      }
    } catch (error) {
      console.log('  Error reading users:', error.message);
    }
    
    // Check if we need to create a new table or modify existing one
    const hasRequiredColumns = tableInfo.rows.some(col => col.column_name === 'id') &&
                              tableInfo.rows.some(col => col.column_name === 'email') &&
                              tableInfo.rows.some(col => col.column_name === 'password');
    
    if (!hasRequiredColumns) {
      console.log('\n🔧 Creating new auth-compatible users table...');
      
      // Backup existing table if it has data
      try {
        const existingData = await client.query('SELECT COUNT(*) FROM users');
        if (existingData.rows[0].count > 0) {
          console.log('📦 Backing up existing users table...');
          await client.query('CREATE TABLE users_backup AS SELECT * FROM users');
          console.log('✅ Backup created as users_backup');
        }
      } catch (error) {
        console.log('Warning: Could not backup existing table:', error.message);
      }
      
      // Drop and recreate table
      await client.query('DROP TABLE IF EXISTS users');
      
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
      
      console.log('✅ New users table created!');
    }
    
    // Create default admin user
    console.log('\n👤 Creating default admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      await client.query(`
        INSERT INTO users (id, email, password, role, name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          name = EXCLUDED.name,
          updated_at = CURRENT_TIMESTAMP
      `, [
        'admin-001',
        'admin@aspcranes.com',
        hashedPassword,
        'admin',
        'Admin User'
      ]);
      
      console.log('✅ Default admin user created/updated!');
    } catch (error) {
      console.log('Warning: Could not create admin user:', error.message);
    }
    
    // Create a test user as well
    try {
      const testHashedPassword = await bcrypt.hash('test123', 10);
      
      await client.query(`
        INSERT INTO users (id, email, password, role, name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, [
        'test-001',
        'test@aspcranes.com',
        testHashedPassword,
        'user',
        'Test User'
      ]);
      
      console.log('✅ Test user created!');
    } catch (error) {
      console.log('Warning: Could not create test user:', error.message);
    }
    
    // Show final table structure and users
    console.log('\n📋 Final users table:');
    const finalUsers = await client.query('SELECT id, email, role, name, created_at FROM users ORDER BY created_at');
    finalUsers.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name} [${user.id}]`);
    });
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n📝 Test credentials:');
    console.log('   Admin: admin@aspcranes.com / admin123');
    console.log('   Test:  test@aspcranes.com / test123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

inspectAndFixDatabase();
