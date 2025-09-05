-- ============================================
-- ASP Cranes CRM - MFA Database Schema
-- Multi-Factor Authentication Support
-- Database: asp_crm
-- ============================================

-- First, let's check what primary key column exists in users table
-- This will help us create proper foreign key references

-- Add MFA columns to users table (using proper IF NOT EXISTS syntax)
DO $$ 
BEGIN
    -- Add mfa_enabled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mfa_enabled') THEN
        ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added mfa_enabled column to users table';
    END IF;
    
    -- Add mfa_secret column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mfa_secret') THEN
        ALTER TABLE users ADD COLUMN mfa_secret TEXT;
        RAISE NOTICE 'Added mfa_secret column to users table';
    END IF;
    
    -- Add mfa_backup_codes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mfa_backup_codes') THEN
        ALTER TABLE users ADD COLUMN mfa_backup_codes TEXT[];
        RAISE NOTICE 'Added mfa_backup_codes column to users table';
    END IF;
    
    -- Add mfa_enabled_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_enabled_at' AND column_name = 'mfa_enabled_at') THEN
        ALTER TABLE users ADD COLUMN mfa_enabled_at TIMESTAMP;
        RAISE NOTICE 'Added mfa_enabled_at column to users table';
    END IF;
    
    -- Add last_mfa_used column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_mfa_used') THEN
        ALTER TABLE users ADD COLUMN last_mfa_used TIMESTAMP;
        RAISE NOTICE 'Added last_mfa_used column to users table';
    END IF;
END $$;

-- Check if users table has 'id' column or find the actual primary key
DO $$
DECLARE
    pk_column TEXT;
BEGIN
    -- Find the primary key column name
    SELECT a.attname INTO pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'users'::regclass AND i.indisprimary;
    
    IF pk_column IS NULL THEN
        RAISE NOTICE 'No primary key found in users table. Please check table structure.';
    ELSE
        RAISE NOTICE 'Primary key column in users table: %', pk_column;
    END IF;
END $$;

-- Create table for temporary MFA secrets (during setup)
-- Note: Will add foreign key constraint after identifying correct primary key column
CREATE TABLE IF NOT EXISTS user_mfa_temp_secrets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    temp_secret TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_mfa_temp_secrets_user_id ON user_mfa_temp_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_temp_secrets_expires ON user_mfa_temp_secrets(expires_at);

-- Create table for MFA backup codes
-- Note: Will add foreign key constraint after identifying correct primary key column
CREATE TABLE IF NOT EXISTS user_mfa_backup_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_mfa_backup_codes_user_id ON user_mfa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_backup_codes_hash ON user_mfa_backup_codes(code_hash);

-- Create table for MFA attempt logging (security)
-- Note: Will add foreign key constraint after identifying correct primary key column
CREATE TABLE IF NOT EXISTS mfa_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    attempt_type VARCHAR(50) NOT NULL, -- 'totp', 'backup_code', 'setup'
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for security monitoring
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_id ON mfa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_created_at ON mfa_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_failed ON mfa_attempts(user_id, success, created_at) WHERE success = FALSE;

-- Clean up expired temporary secrets (run this periodically)
-- Only delete if table exists and has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_mfa_temp_secrets') THEN
        DELETE FROM user_mfa_temp_secrets WHERE expires_at < CURRENT_TIMESTAMP;
        RAISE NOTICE 'Cleaned up expired temporary MFA secrets';
    END IF;
END $$;

-- Add security constraints (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_mfa_temp_secrets') THEN
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'user_mfa_temp_secrets' 
                      AND constraint_name = 'unique_user_temp_secret') THEN
            ALTER TABLE user_mfa_temp_secrets 
            ADD CONSTRAINT unique_user_temp_secret UNIQUE (user_id);
            RAISE NOTICE 'Added unique constraint to user_mfa_temp_secrets';
        END IF;
    END IF;
END $$;

-- Sample data verification queries (run after setup)
/*
-- Check MFA status for all users
SELECT 
    id, 
    username, 
    email, 
    mfa_enabled, 
    mfa_enabled_at,
    last_mfa_used
FROM users 
ORDER BY mfa_enabled DESC, mfa_enabled_at DESC;

-- Check for pending MFA setups
SELECT 
    u.username,
    u.email,
    t.created_at as setup_started,
    t.expires_at as setup_expires
FROM user_mfa_temp_secrets t
JOIN users u ON t.user_id = u.id
WHERE t.expires_at > CURRENT_TIMESTAMP;

-- MFA security monitoring
SELECT 
    u.username,
    ma.attempt_type,
    ma.success,
    ma.ip_address,
    ma.created_at
FROM mfa_attempts ma
JOIN users u ON ma.user_id = u.id
ORDER BY ma.created_at DESC
LIMIT 50;
*/

-- Grant permissions (adjust as needed for your database user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa_temp_secrets TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa_backup_codes TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_attempts TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE user_mfa_temp_secrets_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE user_mfa_backup_codes_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE mfa_attempts_id_seq TO your_app_user;

-- Remove the COMMIT statement since we're not in an explicit transaction
-- COMMIT;
