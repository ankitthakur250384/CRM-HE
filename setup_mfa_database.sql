-- ============================================
-- ASP Cranes CRM - MFA Database Schema
-- Multi-Factor Authentication Support
-- ============================================

-- Add MFA columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS mfa_enabled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_mfa_used TIMESTAMP;

-- Create table for temporary MFA secrets (during setup)
CREATE TABLE IF NOT EXISTS user_mfa_temp_secrets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    temp_secret TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_mfa_temp_secrets_user_id ON user_mfa_temp_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_temp_secrets_expires ON user_mfa_temp_secrets(expires_at);

-- Create table for MFA backup codes
CREATE TABLE IF NOT EXISTS user_mfa_backup_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_mfa_backup_codes_user_id ON user_mfa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_backup_codes_hash ON user_mfa_backup_codes(code_hash);

-- Create table for MFA attempt logging (security)
CREATE TABLE IF NOT EXISTS mfa_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
DELETE FROM user_mfa_temp_secrets WHERE expires_at < CURRENT_TIMESTAMP;

-- Add security constraints
ALTER TABLE user_mfa_temp_secrets 
ADD CONSTRAINT unique_user_temp_secret UNIQUE (user_id);

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

COMMIT;
