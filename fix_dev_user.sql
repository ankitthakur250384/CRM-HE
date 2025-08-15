-- Fix for dev-user foreign key constraint issue
-- This script ensures we have a valid user for template creation

-- Insert dev-user if it doesn't exist (safe insert)
INSERT INTO users (uid, email, password_hash, display_name, role)
VALUES ('dev-user', 'dev@aspcranes.com', '$2b$10$dummy.hash.for.dev.user.only', 'Development User', 'admin')
ON CONFLICT (uid) DO NOTHING;

-- Also ensure usr_test001 exists (from backup data)
INSERT INTO users (uid, email, password_hash, display_name, role)
VALUES ('usr_test001', 'test@aspcranes.com', '$2b$10$RNMvy1HM4Bbrc5/Cw6YGlOmFAksr2AxubVoiSAVXs1eNPU5olDJf6', 'Test User', 'sales_agent')
ON CONFLICT (uid) DO NOTHING;

-- Verify users exist
SELECT uid, email, display_name, role FROM users WHERE uid IN ('dev-user', 'usr_test001');
