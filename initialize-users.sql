-- ASP Cranes CRM - Production User Initialization Script
-- This script creates essential and sample users for the CRM system
-- Execute this after running the main schema.sql
-- 
-- Usage:
--   psql -U postgres -d asp_crm -f initialize-users.sql
--
-- Security Note: 
--   In production, replace these password hashes with proper bcrypt hashes
--   Default password for all demo accounts: "password123"

\echo '🚀 Initializing ASP Cranes CRM users...'

-- ========== ESSENTIAL ADMIN USERS ==========
-- These are required for system administration

INSERT INTO users (uid, email, password_hash, display_name, role, avatar) VALUES
('usr_admin001', 'admin@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'System Administrator', 'admin', NULL),
('usr_admin002', 'vedant@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Vedant Singh Thakur', 'admin', NULL)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

\echo '✅ Admin users created'

-- ========== SALES TEAM ==========
-- Sales agents for lead management and customer acquisition

INSERT INTO users (uid, email, password_hash, display_name, role, avatar) VALUES
('usr_sales001', 'rajesh.kumar@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Rajesh Kumar', 'sales_agent', NULL),
('usr_sales002', 'priya.sharma@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Priya Sharma', 'sales_agent', NULL),
('usr_sales003', 'amit.patel@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Amit Patel', 'sales_agent', NULL),
('usr_sales004', 'sunita.rao@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Sunita Rao', 'sales_agent', NULL),
('usr_sales005', 'john@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhLkK3M4N5P6Q', 'John Sales', 'sales_agent', NULL)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

\echo '✅ Sales team created'

-- ========== OPERATIONS MANAGEMENT ==========
-- Operations managers for job coordination and equipment management

INSERT INTO users (uid, email, password_hash, display_name, role, avatar) VALUES
('usr_ops001', 'ravi.operations@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Ravi Operations Manager', 'operations_manager', NULL),
('usr_ops002', 'kavita.ops@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Kavita Operations', 'operations_manager', NULL),
('usr_ops003', 'sara@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Sara Operations', 'operations_manager', NULL)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

\echo '✅ Operations managers created'

-- ========== CRANE OPERATORS ==========
-- Field operators with different specializations

INSERT INTO users (uid, email, password_hash, display_name, role, avatar) VALUES
('usr_op001', 'manoj.operator@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Manoj Crane Operator', 'operator', NULL),
('usr_op002', 'deepak.crane@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Deepak Crane Expert', 'operator', NULL),
('usr_op003', 'vikas.mobile@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Vikas Mobile Crane', 'operator', NULL),
('usr_op004', 'suresh.tower@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Suresh Tower Crane', 'operator', NULL),
('usr_op005', 'mike@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Mike Operator', 'operator', NULL)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

\echo '✅ Crane operators created'

-- ========== SUPPORT STAFF ==========
-- Customer support and helpdesk users

INSERT INTO users (uid, email, password_hash, display_name, role, avatar) VALUES
('usr_support01', 'support@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Support Team', 'support', NULL),
('usr_support02', 'helpdesk@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Help Desk', 'support', NULL)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

\echo '✅ Support staff created'

-- ========== OPERATORS TABLE LINKING ==========
-- Link operator users to the operators table for specialization tracking

INSERT INTO operators (id, name, email, phone, specialization, experience, certifications, availability, user_id) VALUES
('op_manoj01', 'Manoj Crane Operator', 'manoj.operator@aspcranes.com', '+91-9876543210', 'Mobile Crane Operations', 8, 
 ARRAY['Mobile Crane Certification', 'Safety Level 1', 'Heavy Machinery License'], 'available', 'usr_op001'),

('op_deepak01', 'Deepak Crane Expert', 'deepak.crane@aspcranes.com', '+91-9876543211', 'Multi-Crane Specialist', 12, 
 ARRAY['Mobile Crane Certification', 'Tower Crane Certification', 'Safety Level 2', 'Advanced Rigging'], 'available', 'usr_op002'),

('op_vikas01', 'Vikas Mobile Crane', 'vikas.mobile@aspcranes.com', '+91-9876543212', 'Mobile Crane & Pick & Carry', 6, 
 ARRAY['Mobile Crane Certification', 'Pick & Carry Certification', 'Safety Level 1'], 'available', 'usr_op003'),

('op_suresh01', 'Suresh Tower Crane', 'suresh.tower@aspcranes.com', '+91-9876543213', 'Tower Crane Specialist', 15, 
 ARRAY['Tower Crane Certification', 'Safety Level 3', 'High-Rise Construction', 'Advanced Rigging'], 'available', 'usr_op004'),

('op_mike01', 'Mike General Operator', 'mike@aspcranes.com', '+91-9876543214', 'General Crane Operations', 5, 
 ARRAY['Basic Crane Certification', 'Safety Level 1'], 'available', 'usr_op005')
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

\echo '✅ Operator profiles linked'

-- ========== SAMPLE CUSTOMERS ==========
-- Create sample customer data for testing

INSERT INTO customers (id, name, email, phone, company, address, city, state, postal_code, country, status, created_by) VALUES
('cust_001', 'Raj Construction Ltd', 'contact@rajconstruction.com', '+91-9876543220', 'Raj Construction Ltd', 
 '123 Industrial Area, Sector 18', 'Gurgaon', 'Haryana', '122015', 'India', 'active', 'usr_sales001'),

('cust_002', 'Metro Infrastructure Pvt Ltd', 'projects@metroinfra.com', '+91-9876543221', 'Metro Infrastructure Pvt Ltd', 
 '456 Commercial Complex, MG Road', 'Bangalore', 'Karnataka', '560001', 'India', 'active', 'usr_sales002'),

('cust_003', 'Skyline Developers', 'info@skylinedev.com', '+91-9876543222', 'Skyline Developers', 
 '789 Business Park, Bandra', 'Mumbai', 'Maharashtra', '400050', 'India', 'active', 'usr_sales003'),

('cust_004', 'Prestige Engineering Works', 'engineering@prestige.co.in', '+91-9876543223', 'Prestige Engineering Works', 
 '321 Engineering Hub, IT Corridor', 'Hyderabad', 'Telangana', '500081', 'India', 'active', 'usr_sales004'),

('cust_005', 'Golden Gate Construction', 'projects@goldengate.com', '+91-9876543224', 'Golden Gate Construction', 
 '654 Construction Plaza, Sector 62', 'Noida', 'Uttar Pradesh', '201301', 'India', 'active', 'usr_sales001')
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

\echo '✅ Sample customers created'

-- ========== SAMPLE EQUIPMENT ==========
-- Create sample equipment for quotations and jobs

INSERT INTO equipment (id, name, type, category, capacity, specifications, hourly_rate, daily_rate, weekly_rate, monthly_rate, availability, location, operator_required, created_by) VALUES
('eq_mobile_001', 'Tata 25T Mobile Crane', 'mobile_crane', 'crane', '25 Tons', 
 '{"boom_length": "40m", "max_height": "35m", "engine": "BS4 Compliant"}', 2500.00, 18000.00, 110000.00, 400000.00, 
 'available', 'Delhi NCR', true, 'usr_ops001'),

('eq_tower_001', 'Potain MC 205 Tower Crane', 'tower_crane', 'crane', '8 Tons', 
 '{"jib_length": "60m", "max_height": "200m", "tip_load": "1.3T"}', 3500.00, 25000.00, 150000.00, 550000.00, 
 'available', 'Mumbai', true, 'usr_ops001'),

('eq_mobile_002', 'ACE 35T Mobile Crane', 'mobile_crane', 'crane', '35 Tons', 
 '{"boom_length": "45m", "max_height": "40m", "all_terrain": true}', 3000.00, 22000.00, 130000.00, 480000.00, 
 'available', 'Bangalore', true, 'usr_ops002'),

('eq_crawler_001', 'SANY 50T Crawler Crane', 'crawler_crane', 'crane', '50 Tons', 
 '{"boom_length": "50m", "max_height": "45m", "track_width": "4.2m"}', 4000.00, 30000.00, 180000.00, 650000.00, 
 'available', 'Chennai', true, 'usr_ops002'),

('eq_pick_carry_001', 'Escorts 14T Pick & Carry', 'pick_and_carry', 'crane', '14 Tons', 
 '{"boom_length": "25m", "max_height": "22m", "mobility": "high"}', 1800.00, 12000.00, 70000.00, 250000.00, 
 'available', 'Pune', true, 'usr_ops001')
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

\echo '✅ Sample equipment created'

-- ========== USER STATISTICS ==========
DO $$
DECLARE
    user_count INTEGER;
    operator_count INTEGER;
    customer_count INTEGER;
    equipment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO operator_count FROM operators;
    SELECT COUNT(*) INTO customer_count FROM customers;
    SELECT COUNT(*) INTO equipment_count FROM equipment;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ASP Cranes CRM Initialization Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   • Users: % (Admin: 2, Sales: 5, Operations: 3, Operators: 5, Support: 2)', user_count;
    RAISE NOTICE '   • Operator Profiles: %', operator_count;
    RAISE NOTICE '   • Sample Customers: %', customer_count;
    RAISE NOTICE '   • Sample Equipment: %', equipment_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Login Credentials (Default Password: password123):';
    RAISE NOTICE '   • Admin: admin@aspcranes.com';
    RAISE NOTICE '   • Sales: rajesh.kumar@aspcranes.com';
    RAISE NOTICE '   • Operations: ravi.operations@aspcranes.com';
    RAISE NOTICE '   • Operator: manoj.operator@aspcranes.com';
    RAISE NOTICE '   • Support: support@aspcranes.com';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  SECURITY: Change passwords before production deployment!';
    RAISE NOTICE '';
END $$;
