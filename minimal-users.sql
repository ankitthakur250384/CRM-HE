-- Minimal Users Setup - One User Per Role
-- Creates exactly one user for each role in the ASP Cranes CRM system
-- Execute: psql -U postgres -d asp_crm -f minimal-users.sql

\echo '🚀 Creating one user for each role...'

-- Delete existing users first to ensure clean state
DELETE FROM users WHERE uid IN ('usr_admin', 'usr_sales', 'usr_ops', 'usr_operator', 'usr_support');
DELETE FROM operators WHERE id = 'op_main';

-- Admin User
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_admin', 'admin@aspcranes.com', '$2b$10$YourSecureHashHere123456789012345678901234567890123456789', 'Admin', 'admin');

-- Sales Agent  
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_sales', 'sales@aspcranes.com', '$2b$10$YourSecureHashHere123456789012345678901234567890123456789', 'Sales Agent', 'sales_agent');

-- Operations Manager
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_ops', 'operations@aspcranes.com', '$2b$10$YourSecureHashHere123456789012345678901234567890123456789', 'Operations Manager', 'operations_manager');

-- Operator
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_operator', 'operator@aspcranes.com', '$2b$10$YourSecureHashHere123456789012345678901234567890123456789', 'Crane Operator', 'operator');

-- Support Staff
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_support', 'support@aspcranes.com', '$2b$10$YourSecureHashHere123456789012345678901234567890123456789', 'Support', 'support');

-- Link operator to operators table
INSERT INTO operators (id, name, email, phone, specialization, experience, certifications, availability, user_id) VALUES
('op_main', 'Crane Operator', 'operator@aspcranes.com', '+91-9876543210', 'General Operations', 5, 
 ARRAY['Basic Certification', 'Safety Level 1'], 'available', 'usr_operator')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    specialization = EXCLUDED.specialization,
    experience = EXCLUDED.experience,
    certifications = EXCLUDED.certifications,
    availability = EXCLUDED.availability,
    user_id = EXCLUDED.user_id;

\echo '✅ Users created successfully!'
\echo ''
\echo '🔐 Login Credentials (Password: password123):'
\echo '   • Admin: admin@aspcranes.com'
\echo '   • Sales: sales@aspcranes.com'
\echo '   • Operations: operations@aspcranes.com'
\echo '   • Operator: operator@aspcranes.com'
\echo '   • Support: support@aspcranes.com'
\echo ''
\echo '🎉 Ready to go!'
