-- Essential Users Only - Quick Setup Script
-- This script creates the minimum required users for immediate testing
-- Execute: psql -U postgres -d asp_crm -f essential-users.sql

\echo '🚀 Creating essential users for ASP Cranes CRM...'

-- Essential Admin User (System Administrator)
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_admin001', 'admin@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'System Administrator', 'admin')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- Essential Sales Agent
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_sales001', 'sales@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Sales Agent', 'sales_agent')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- Essential Operations Manager
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_ops001', 'operations@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Operations Manager', 'operations_manager')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- Essential Crane Operator
INSERT INTO users (uid, email, password_hash, display_name, role) VALUES
('usr_op001', 'operator@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Crane Operator', 'operator')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- Link the operator to operators table
INSERT INTO operators (id, name, email, phone, specialization, experience, certifications, availability, user_id) VALUES
('op_essential01', 'Crane Operator', 'operator@aspcranes.com', '+91-9999999999', 'General Crane Operations', 5, 
 ARRAY['Basic Crane Certification', 'Safety Level 1'], 'available', 'usr_op001')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    specialization = EXCLUDED.specialization,
    experience = EXCLUDED.experience,
    certifications = EXCLUDED.certifications,
    availability = EXCLUDED.availability,
    user_id = EXCLUDED.user_id,
    updated_at = CURRENT_TIMESTAMP;

-- Create one sample customer for testing
INSERT INTO customers (id, name, email, phone, company, address, city, state, postal_code, country, status, created_by) VALUES
('cust_sample', 'Sample Construction Co', 'contact@sample.com', '+91-9999999998', 'Sample Construction Co', 
 '123 Test Street', 'Delhi', 'Delhi', '110001', 'India', 'active', 'usr_sales001')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- Create one sample equipment for testing
INSERT INTO equipment (id, name, type, category, capacity, specifications, hourly_rate, daily_rate, weekly_rate, monthly_rate, availability, location, operator_required, created_by) VALUES
('eq_sample', 'Sample 20T Mobile Crane', 'mobile_crane', 'crane', '20 Tons', 
 '{"boom_length": "35m", "max_height": "30m"}', 2000.00, 15000.00, 90000.00, 350000.00, 
 'available', 'Delhi', true, 'usr_ops001')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    capacity = EXCLUDED.capacity,
    specifications = EXCLUDED.specifications,
    hourly_rate = EXCLUDED.hourly_rate,
    daily_rate = EXCLUDED.daily_rate,
    weekly_rate = EXCLUDED.weekly_rate,
    monthly_rate = EXCLUDED.monthly_rate,
    availability = EXCLUDED.availability,
    location = EXCLUDED.location,
    operator_required = EXCLUDED.operator_required,
    updated_at = CURRENT_TIMESTAMP;

-- Success message
\echo '✅ Essential users created successfully!'
\echo ''
\echo '🔐 Login credentials (Password: password123):'
\echo '   • Admin: admin@aspcranes.com'
\echo '   • Sales: sales@aspcranes.com' 
\echo '   • Operations: operations@aspcranes.com'
\echo '   • Operator: operator@aspcranes.com'
\echo ''
\echo '📝 Sample data created:'
\echo '   • 1 Customer: Sample Construction Co'
\echo '   • 1 Equipment: Sample 20T Mobile Crane'
\echo ''
\echo '🚀 Ready to test the CRM system!'
