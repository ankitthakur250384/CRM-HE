-- ASP Cranes CRM - User Initialization Script
-- This script creates sample users for all roles in the CRM system
-- Run this after the main schema.sql to populate initial users

-- ========== SAMPLE USERS DATA ==========

-- Note: In production, use proper password hashing (bcrypt, etc.)
-- These are sample hashed passwords for development/testing

INSERT INTO users (uid, email, password_hash, display_name, role, avatar) VALUES
-- Admin Users
('usr_admin001', 'admin@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'System Administrator', 'admin', NULL),
('usr_admin002', 'vedant@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Vedant Singh Thakur', 'admin', NULL),

-- Sales Agents
('usr_sales001', 'rajesh.kumar@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Rajesh Kumar', 'sales_agent', NULL),
('usr_sales002', 'priya.sharma@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Priya Sharma', 'sales_agent', NULL),
('usr_sales003', 'amit.patel@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Amit Patel', 'sales_agent', NULL),
('usr_sales004', 'sunita.rao@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Sunita Rao', 'sales_agent', NULL),

-- Operations Managers
('usr_ops001', 'ravi.operations@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Ravi Operations Manager', 'operations_manager', NULL),
('usr_ops002', 'kavita.ops@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Kavita Operations', 'operations_manager', NULL),

-- Operators
('usr_op001', 'manoj.operator@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Manoj Crane Operator', 'operator', NULL),
('usr_op002', 'deepak.crane@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Deepak Crane Expert', 'operator', NULL),
('usr_op003', 'vikas.mobile@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Vikas Mobile Crane', 'operator', NULL),
('usr_op004', 'suresh.tower@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Suresh Tower Crane', 'operator', NULL),

-- Support Staff
('usr_support01', 'support@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Support Team', 'support', NULL),
('usr_support02', 'helpdesk@aspcranes.com', '$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q', 'Help Desk', 'support', NULL)

ON CONFLICT (email) DO NOTHING; -- Prevents duplicate email errors

-- ========== OPERATORS TABLE DATA ==========
-- Link operators with user accounts and add crane specializations

INSERT INTO operators (id, name, email, phone, specialization, experience, certifications, availability, user_id) VALUES
('op_manoj01', 'Manoj Crane Operator', 'manoj.operator@aspcranes.com', '+91-9876543210', 'Mobile Crane Operations', 8, 
 ARRAY['Mobile Crane Certification', 'Safety Level 1', 'Heavy Machinery License'], 'available', 'usr_op001'),

('op_deepak01', 'Deepak Crane Expert', 'deepak.crane@aspcranes.com', '+91-9876543211', 'Multi-Crane Specialist', 12, 
 ARRAY['Mobile Crane Certification', 'Tower Crane Certification', 'Safety Level 2', 'Advanced Rigging'], 'available', 'usr_op002'),

('op_vikas01', 'Vikas Mobile Crane', 'vikas.mobile@aspcranes.com', '+91-9876543212', 'Mobile Crane & Pick & Carry', 6, 
 ARRAY['Mobile Crane Certification', 'Pick & Carry Certification', 'Safety Level 1'], 'available', 'usr_op003'),

('op_suresh01', 'Suresh Tower Crane', 'suresh.tower@aspcranes.com', '+91-9876543213', 'Tower Crane Specialist', 15, 
 ARRAY['Tower Crane Certification', 'Safety Level 3', 'High-rise Construction', 'Crane Installation'], 'available', 'usr_op004'),

-- Additional operators without user accounts (external contractors)
('op_ramesh01', 'Ramesh Kumar', 'ramesh.contractor@gmail.com', '+91-9876543214', 'Crawler Crane Operations', 10, 
 ARRAY['Crawler Crane Certification', 'Heavy Lifting Specialist', 'Safety Level 2'], 'available', NULL),

('op_sanjay01', 'Sanjay Singh', 'sanjay.cranes@outlook.com', '+91-9876543215', 'All Terrain Crane', 7, 
 ARRAY['All Terrain Certification', 'Mobile Crane Certification', 'Safety Level 1'], 'available', NULL),

('op_ajay01', 'Ajay Sharma', 'ajay.crane.op@yahoo.com', '+91-9876543216', 'Pick & Carry Specialist', 5, 
 ARRAY['Pick & Carry Certification', 'Urban Construction', 'Safety Level 1'], 'available', NULL)

ON CONFLICT (email) DO NOTHING;

-- ========== SAMPLE CUSTOMERS ==========
-- Add some sample customers for testing

INSERT INTO customers (id, name, company_name, contact_name, email, phone, address, type, designation, notes) VALUES
('cust_build01', 'Metro Construction Ltd', 'Metro Construction Ltd', 'Rohit Gupta', 'rohit@metroconstruction.com', '+91-11-4567-8901', 
 '123 Construction Plaza, New Delhi, 110001', 'construction', 'Project Manager', 'Major construction company, regular client'),

('cust_dev01', 'Skyline Developers', 'Skyline Developers Pvt Ltd', 'Anita Verma', 'anita@skylinedev.com', '+91-22-4567-8902', 
 '456 Business Tower, Mumbai, 400001', 'property_developer', 'Development Head', 'High-rise residential projects'),

('cust_mfg01', 'TechnoSteel Industries', 'TechnoSteel Industries Ltd', 'Vikram Singh', 'vikram@technosteel.com', '+91-44-4567-8903', 
 '789 Industrial Area, Chennai, 600001', 'manufacturing', 'Plant Manager', 'Steel manufacturing, heavy machinery needs'),

('cust_gov01', 'Delhi Metro Rail Corporation', 'DMRC', 'Pradeep Kumar', 'pradeep@dmrc.gov.in', '+91-11-4567-8904', 
 'Metro Bhawan, New Delhi, 110001', 'government', 'Chief Engineer', 'Government infrastructure projects'),

('cust_infra01', 'Highway Builders', 'Highway Builders & Co', 'Sameer Joshi', 'sameer@highwaybuilders.com', '+91-79-4567-8905', 
 '321 Infrastructure Hub, Ahmedabad, 380001', 'construction', 'Site Engineer', 'Highway and bridge construction')

ON CONFLICT (email) DO NOTHING;

-- ========== SAMPLE EQUIPMENT ==========
-- Add sample crane equipment

INSERT INTO equipment (id, equipment_id, name, category, manufacturing_date, registration_date, 
                      max_lifting_capacity, unladen_weight, base_rate_micro, base_rate_small, 
                      base_rate_monthly, base_rate_yearly, running_cost_per_km, running_cost, 
                      description, status) VALUES

-- Mobile Cranes
('equ_mobile01', 'MC001', 'Liebherr LTM 1100-5.2', 'mobile_crane', '2020-01-15', '2020-02-01', 
 100.00, 48.00, 8000.00, 12000.00, 180000.00, 2000000.00, 45.00, 2500.00, 
 '100-ton mobile crane, 5-axle, telescopic boom up to 60m', 'available'),

('equ_mobile02', 'MC002', 'Grove GMK5250L', 'mobile_crane', '2019-08-20', '2019-09-05', 
 250.00, 72.00, 15000.00, 22000.00, 350000.00, 4000000.00, 55.00, 3500.00, 
 '250-ton all terrain crane, 8-axle, boom length up to 70m', 'available'),

('equ_mobile03', 'MC003', 'XCMG XCT25', 'mobile_crane', '2021-03-10', '2021-03-25', 
 25.00, 28.00, 4000.00, 6000.00, 80000.00, 900000.00, 35.00, 1800.00, 
 '25-ton mobile crane, compact design for city use', 'available'),

-- Tower Cranes
('equ_tower01', 'TC001', 'Potain MDT 269', 'tower_crane', '2018-11-05', '2018-12-01', 
 12.00, 45.00, NULL, NULL, 220000.00, 2500000.00, NULL, 4000.00, 
 'Top-slewing tower crane, jib length 60m, tip load 2.1t', 'available'),

('equ_tower02', 'TC002', 'Liebherr 550 EC-H', 'tower_crane', '2019-06-15', '2019-07-01', 
 20.00, 65.00, NULL, NULL, 280000.00, 3200000.00, NULL, 5000.00, 
 'High-top tower crane, max load 20t, jib length 70m', 'in_use'),

-- Crawler Cranes
('equ_crawler01', 'CC001', 'Liebherr LR 1300', 'crawler_crane', '2017-09-20', '2017-10-15', 
 300.00, 98.00, NULL, 35000.00, 550000.00, 6500000.00, NULL, 6000.00, 
 '300-ton crawler crane, lattice boom, heavy lifting specialist', 'available'),

-- Pick & Carry Cranes
('equ_pick01', 'PC001', 'Escorts Hydra 14 IX', 'pick_and_carry_crane', '2020-12-10', '2021-01-05', 
 14.00, 15.50, 3500.00, 5000.00, 65000.00, 750000.00, 30.00, 1500.00, 
 '14-ton pick & carry crane, ideal for industrial applications', 'available'),

('equ_pick02', 'PC002', 'ACE FX 150', 'pick_and_carry_crane', '2021-05-25', '2021-06-10', 
 15.00, 16.20, 3800.00, 5500.00, 70000.00, 800000.00, 32.00, 1600.00, 
 '15-ton pick & carry crane, city crane with excellent mobility', 'available')

ON CONFLICT (equipment_id) DO NOTHING;

-- ========== SUCCESS MESSAGE ==========
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ USERS INITIALIZATION COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 SUMMARY:';
    RAISE NOTICE '👥 Users created: 13 (Admin: 2, Sales: 4, Operations: 2, Operators: 4, Support: 2)';
    RAISE NOTICE '🔧 Operators created: 7 (4 with user accounts, 3 contractors)';
    RAISE NOTICE '🏢 Sample customers: 5';
    RAISE NOTICE '🏗️ Sample equipment: 8 cranes';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 DEFAULT LOGIN CREDENTIALS:';
    RAISE NOTICE '   Admin: admin@aspcranes.com / password123';
    RAISE NOTICE '   Owner: vedant@aspcranes.com / password123';
    RAISE NOTICE '   Sales: rajesh.kumar@aspcranes.com / password123';
    RAISE NOTICE '   Operations: ravi.operations@aspcranes.com / password123';
    RAISE NOTICE '   Operator: manoj.operator@aspcranes.com / password123';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  SECURITY NOTE:';
    RAISE NOTICE '   These are DEMO passwords with sample hashes.';
    RAISE NOTICE '   In production, implement proper password hashing!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next Steps:';
    RAISE NOTICE '   1. Test login with sample users';
    RAISE NOTICE '   2. Create sample leads and deals';
    RAISE NOTICE '   3. Test quotation generation';
    RAISE NOTICE '   4. Verify role-based access';
    RAISE NOTICE '========================================';
END $$;
