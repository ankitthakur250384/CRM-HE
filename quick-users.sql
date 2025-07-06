-- Quick User Setup Script
-- This creates essential users for immediate testing

-- Essential Admin User
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_admin001', 'admin@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Admin User', 'admin')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

-- Essential Sales Agent
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_sales001', 'sales@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Sales Agent', 'sales_agent')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

-- Essential Operations Manager
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_ops001', 'operations@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Operations Manager', 'operations_manager')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

-- Essential Operator
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_op001', 'operator@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Crane Operator', 'operator')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

RAISE NOTICE '✅ Essential users created successfully!';
RAISE NOTICE 'Login with: admin@aspcranes.com / password123';
