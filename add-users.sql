-- Add demo users directly to the database
-- Run this command: psql -U postgres -d asp_crm -f add-users.sql

-- Admin user: admin@aspcranes.com / admin123
INSERT INTO users (uid, email, password_hash, display_name, role, created_at, updated_at)
VALUES ('usr_admin01', 'admin@aspcranes.com', 
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'Admin User', 'admin', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Sales user: john@aspcranes.com / sales123
INSERT INTO users (uid, email, password_hash, display_name, role, created_at, updated_at)
VALUES ('usr_sales01', 'john@aspcranes.com', 
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'John Sales', 'sales_agent', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Operations user: sara@aspcranes.com / manager123
INSERT INTO users (uid, email, password_hash, display_name, role, created_at, updated_at)
VALUES ('usr_opera01', 'sara@aspcranes.com', 
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'Sara Operations', 'operations_manager', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Operator user: mike@aspcranes.com / operator123
INSERT INTO users (uid, email, password_hash, display_name, role, created_at, updated_at)
VALUES ('usr_operat01', 'mike@aspcranes.com', 
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'Mike Operator', 'operator', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify the users were added
SELECT uid, email, role, display_name FROM users;
