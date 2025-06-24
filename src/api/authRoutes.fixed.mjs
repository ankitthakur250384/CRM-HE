/**
 * Fixed API routes for authentication
 * This file contains API routes for user authentication with PostgreSQL with improved error handling
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Database connection parameters
const dbConfig = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: 'vedant21',  // Hardcoding the password to ensure consistency
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Log database connection parameters (hiding password)
console.log('Auth API: Database connection parameters:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  passwordProvided: dbConfig.password ? 'Yes' : 'No',
  ssl: !!dbConfig.ssl
});

// Create a new pool with appropriate error handling
let pool;
try {
  pool = new pg.Pool(dbConfig);
  console.log('✅ Auth API: PostgreSQL connection pool created');
  
  // Verify connection works
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Auth API: PostgreSQL connection test failed:', err);
    } else {
      console.log('✅ Auth API: PostgreSQL connection test successful:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('❌ Auth API: Failed to create PostgreSQL connection pool:', error);
}

// JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

/**
 * Check if users table exists and is properly set up
 */
async function ensureUsersTable(client) {
  try {
    console.log('🏗️ Ensuring users table exists...');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log(`📊 Users table exists: ${tableExists}`);
    
    // Create table if it doesn't exist
    if (!tableExists) {
      console.log('🔧 Creating users table...');
      
      await client.query(`
        CREATE TABLE users (
          uid VARCHAR(50) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255),
          password_hash VARCHAR(255),
          role VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ Users table created successfully');
      
      // Create default admin user
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (uid, email, display_name, password_hash, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        'admin-1',
        'admin@example.com',
        'Administrator',
        adminPasswordHash,
        'admin'
      ]);
      
      console.log('✅ Default admin user created:');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    }
    
    // Check for any users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Users table has ${userCount.rows[0].count} users`);
    
    return { 
      success: true, 
      tableCreated: !tableExists,
      userCount: parseInt(userCount.rows[0].count)
    };
  } catch (error) {
    console.error('❌ Error ensuring users table exists:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Debug endpoint to check auth status
 */
router.get('/debug', async (req, res) => {
  try {
    console.log('Auth debug endpoint hit');
    
    if (!pool) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Database connection not available',
        timestamp: new Date().toISOString()
      });
    }
    
    // Test database connection
    const client = await pool.connect();
    try {
      // Check database connection
      const dbTest = await client.query('SELECT NOW() as time');
      
      // Check users table
      const tablesResult = await ensureUsersTable(client);
      
      res.json({ 
        status: 'ok', 
        message: 'Auth routes are loaded',
        dbConnection: 'ok',
        dbTime: dbTest.rows[0].time,
        userTable: tablesResult,
        timestamp: new Date().toISOString()
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Auth debug error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Login route with improved error handling
 */
router.post('/login', async (req, res) => {
  console.log('\n🔐 POST /api/auth/login endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  // Check for required fields
  const { email, password } = req.body;
  if (!email || !password) {
    console.error('❌ Missing required fields:', { email: !!email, password: !!password });
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  console.log(`👤 Login attempt for user: ${email}`);
  
  let client;
  try {
    // Get database client
    client = await pool.connect();
    
    // Ensure the users table exists
    const tablesResult = await ensureUsersTable(client);
    console.log('📊 Users table check:', tablesResult);
    
    // Find user by email
    console.log(`🔍 Looking up user: ${email}`);
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    // Check if user exists
    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    console.log(`✅ User found: ${user.email} (${user.role})`);
    
    // Check if the user has a password hash
    if (!user.password_hash) {
      console.log(`❌ User ${email} does not have a password hash`);
      return res.status(401).json({ error: 'Please reset your password to continue' });
    }
    
    // Verify password with bcrypt
    console.log('🔐 Verifying password...');
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('🔑 Password verification result:', isValidPassword);
    } catch (err) {
      console.error('❌ Error comparing passwords:', err);
      return res.status(500).json({ error: 'Password verification failed' });
    }
    
    if (!isValidPassword) {
      console.log(`❌ Invalid password for user: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: user.uid,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ User ${email} authenticated successfully`);
    
    // Return user object and token
    const response = {
      user: {
        id: user.uid,
        name: user.display_name || email.split('@')[0],
        email: user.email,
        role: user.role,
      },
      token
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed: ' + error.message });
  } finally {
    if (client) client.release();
  }
});

/**
 * Verify token route
 */
router.post('/verify-token', async (req, res) => {
  console.log('\n🔐 POST /api/auth/verify-token endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  const { token } = req.body;
  if (!token) {
    console.error('❌ No token provided');
    return res.status(400).json({ error: 'Token is required' });
  }
  
  try {
    // Verify token
    console.log('🔑 Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ Token verified for user ID: ${decoded.userId}`);
    
    // Get user from database to ensure they still exist
    const client = await pool.connect();
    try {
      const userResult = await client.query(
        'SELECT * FROM users WHERE uid = $1',
        [decoded.userId]
      );
      
      if (userResult.rows.length === 0) {
        console.log(`❌ User not found: ${decoded.userId}`);
        return res.status(401).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      console.log(`✅ User verified: ${user.email} (${user.role})`);
      
      // Return user data
      return res.status(200).json({
        user: {
          id: user.uid,
          name: user.display_name || user.email.split('@')[0],
          email: user.email,
          role: user.role,
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token: ' + error.message });
  }
});

export default router;
