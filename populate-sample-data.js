/**
 * Populate Sample Data for Dashboard
 * Creates sample data for leads, deals, jobs, equipment, and customers
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vedant21',
  ssl: process.env.DB_SSL === 'true' ? true : false
});

async function populateSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('🌟 Starting sample data population...');
    
    // Insert sample customers
    console.log('📊 Creating sample customers...');
    await client.query(`
      INSERT INTO customers (id, name, company_name, contact_name, email, phone, address, type, designation, notes)
      VALUES 
        ('cust_001', 'Rajesh Kumar', 'Kumar Construction Ltd', 'Rajesh Kumar', 'rajesh@kumarconst.com', '+91-9876543210', '123 MG Road, Mumbai, Maharashtra 400001', 'construction', 'Managing Director', 'Major construction company in Mumbai'),
        ('cust_002', 'Priya Sharma', 'Sharma Developers', 'Priya Sharma', 'priya@sharmadev.com', '+91-9876543211', '456 Ring Road, Delhi 110001', 'property_developer', 'CEO', 'High-end residential projects'),
        ('cust_003', 'Suresh Patel', 'Patel Industries', 'Suresh Patel', 'suresh@patelinds.com', '+91-9876543212', '789 Industrial Area, Pune, Maharashtra 411001', 'manufacturing', 'General Manager', 'Manufacturing facility expansion'),
        ('cust_004', 'Anita Singh', 'Municipal Corporation', 'Anita Singh', 'anita@municipal.gov.in', '+91-9876543213', 'City Hall, Bangalore, Karnataka 560001', 'government', 'Project Director', 'Infrastructure development projects'),
        ('cust_005', 'Vikram Mehta', 'Mehta Constructions', 'Vikram Mehta', 'vikram@mehtacons.com', '+91-9876543214', '321 Business District, Chennai, Tamil Nadu 600001', 'construction', 'Partner', 'Commercial building specialist')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert sample leads
    console.log('📋 Creating sample leads...');
    await client.query(`
      INSERT INTO leads (id, customer_name, company_name, email, phone, service_needed, site_location, start_date, rental_days, shift_timing, status, source, assigned_to, designation, notes)
      VALUES 
        ('lead_001', 'Amit Gupta', 'Tech Tower Builders', 'amit@techtower.com', '+91-9876543220', 'Tower Crane for high-rise construction', 'Tech Park, Gurgaon, Haryana', '2024-08-01', 90, 'day_shift', 'new', 'website', 'u_sal_386065nosk', 'Project Manager', 'High-rise construction project'),
        ('lead_002', 'Neha Joshi', 'Metro Bridge Works', 'neha@metrobridge.com', '+91-9876543221', 'Mobile Crane for bridge construction', 'Metro Station, Hyderabad, Telangana', '2024-08-15', 180, 'day_shift', 'qualified', 'referral', 'usr_test001', 'Civil Engineer', 'Metro bridge construction'),
        ('lead_003', 'Ravi Reddy', 'Sunrise Apartments', 'ravi@sunrise.com', '+91-9876543222', 'Tower Crane for residential complex', 'Whitefield, Bangalore, Karnataka', '2024-09-01', 120, 'day_shift', 'new', 'direct', NULL, 'Site Manager', 'Residential complex'),
        ('lead_004', 'Deepak Agarwal', 'Industrial Complex Ltd', 'deepak@indcomplex.com', '+91-9876543223', 'Crawler Crane for heavy lifting', 'MIDC Area, Pune, Maharashtra', '2024-09-15', 240, 'full_day', 'in_process', 'email', 'u_sal_386065nosk', 'Operations Head', 'Large industrial facility'),
        ('lead_005', 'Sonia Kapoor', 'Green Valley Homes', 'sonia@greenvalley.com', '+91-9876543224', 'Tower Crane for eco-housing', 'Sector 62, Noida, Uttar Pradesh', '2024-08-20', 150, 'day_shift', 'qualified', 'social', NULL, 'Project Director', 'Eco-friendly housing project')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert sample equipment
    console.log('🏗️ Creating sample equipment...');
    await client.query(`
      INSERT INTO equipment (id, equipment_id, name, category, manufacturing_date, registration_date, max_lifting_capacity, unladen_weight, base_rate_micro, base_rate_small, base_rate_monthly, base_rate_yearly, running_cost_per_km, running_cost, description, status)
      VALUES 
        ('eq_001', 'TC-7030-001', 'Tower Crane TC-7030', 'tower_crane', '2020-01-15', '2020-02-01', 70.00, 45000.00, 5000.00, 4500.00, 120000.00, 1200000.00, 25.00, 2000.00, 'High-capacity tower crane for high-rise construction', 'available'),
        ('eq_002', 'MC-50-001', 'Mobile Crane MC-50', 'mobile_crane', '2019-03-20', '2019-04-01', 50.00, 38000.00, 3500.00, 3200.00, 95000.00, 950000.00, 30.00, 1800.00, 'Versatile mobile crane for various applications', 'in_use'),
        ('eq_003', 'CC-100-001', 'Crawler Crane CC-100', 'crawler_crane', '2021-06-10', '2021-06-25', 100.00, 85000.00, 6000.00, 5500.00, 150000.00, 1500000.00, 40.00, 2500.00, 'Heavy-duty crawler crane for industrial projects', 'available'),
        ('eq_004', 'TC-5025-001', 'Tower Crane TC-5025', 'tower_crane', '2018-09-15', '2018-10-01', 50.00, 35000.00, 4000.00, 3700.00, 100000.00, 1000000.00, 22.00, 1600.00, 'Mid-range tower crane for medium construction', 'maintenance'),
        ('eq_005', 'MC-25-001', 'Mobile Crane MC-25', 'mobile_crane', '2020-12-05', '2020-12-20', 25.00, 22000.00, 2500.00, 2200.00, 65000.00, 650000.00, 20.00, 1200.00, 'Compact mobile crane for smaller projects', 'available'),
        ('eq_006', 'TC-6035-001', 'Tower Crane TC-6035', 'tower_crane', '2019-11-30', '2019-12-15', 60.00, 42000.00, 4500.00, 4200.00, 115000.00, 1150000.00, 24.00, 1800.00, 'Reliable tower crane for commercial projects', 'in_use')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert sample deals
    console.log('💼 Creating sample deals...');
    await client.query(`
      INSERT INTO deals (id, customer_id, title, description, value, stage, probability, expected_close_date, notes)
      VALUES 
        ('deal_001', 'cust_001', 'Mumbai High-Rise Project', 'Tower crane rental for 40-story building construction project', 15000000, 'won', 100, '2024-03-15', 'Successfully closed deal - major project completed'),
        ('deal_002', 'cust_002', 'Delhi Residential Complex', 'Multiple crane rental for large residential development', 12000000, 'proposal', 75, '2024-07-30', 'Proposal submitted, awaiting client decision'),
        ('deal_003', 'cust_003', 'Pune Factory Expansion', 'Crawler crane rental for heavy industrial equipment installation', 8000000, 'negotiation', 80, '2024-08-15', 'In final negotiations, terms being discussed'),
        ('deal_004', 'cust_004', 'Bangalore Metro Project', 'Government contract for metro construction support', 25000000, 'won', 100, '2024-02-20', 'Government contract successfully secured'),
        ('deal_005', 'cust_005', 'Chennai Commercial Complex', 'Tower crane rental for office building construction', 18000000, 'qualification', 60, '2024-09-10', 'Under evaluation, technical requirements being assessed'),
        ('deal_006', 'cust_001', 'Mumbai Bridge Construction', 'Mobile crane rental for bridge construction project', 6000000, 'lost', 0, '2024-04-10', 'Lost to competitor due to pricing')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert sample jobs
    console.log('👷 Creating sample jobs...');
    await client.query(`
      INSERT INTO jobs (id, title, customer_id, customer_name, status, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, location, notes)
      VALUES 
        ('job_001', 'Mumbai High-Rise Construction', 'cust_001', 'Kumar Construction Ltd', 'in_progress', '2024-07-01T09:00:00Z', '2024-09-30T18:00:00Z', '2024-07-01T09:00:00Z', NULL, 'MG Road Construction Site, Mumbai, Maharashtra', 'Major high-rise construction project with tower crane'),
        ('job_002', 'Bangalore Metro Station', 'cust_004', 'Municipal Corporation', 'in_progress', '2024-06-15T08:00:00Z', '2024-08-15T17:00:00Z', '2024-06-15T08:00:00Z', NULL, 'Metro Station Site, Bangalore, Karnataka', 'Government metro infrastructure project'),
        ('job_003', 'Delhi Residential Complex', 'cust_002', 'Sharma Developers', 'scheduled', '2024-07-15T09:00:00Z', '2024-10-15T18:00:00Z', NULL, NULL, 'Ring Road Development, Delhi', 'Large residential development project'),
        ('job_004', 'Pune Factory Expansion', 'cust_003', 'Patel Industries', 'scheduled', '2024-08-01T08:00:00Z', '2024-11-01T17:00:00Z', NULL, NULL, 'Industrial Area, Pune, Maharashtra', 'Manufacturing facility expansion with heavy equipment'),
        ('job_005', 'Chennai Commercial Building', 'cust_005', 'Mehta Constructions', 'completed', '2024-05-01T09:00:00Z', '2024-06-30T18:00:00Z', '2024-05-01T09:00:00Z', '2024-06-25T17:30:00Z', 'Business District, Chennai, Tamil Nadu', 'Successfully completed commercial building project')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert sample operators
    console.log('👨‍🔧 Creating sample operators...');
    await client.query(`
      INSERT INTO users (uid, email, password_hash, display_name, role, avatar)
      VALUES 
        ('op_001', 'operator1@aspcranes.com', '$2b$10$example1hash', 'Rajesh Kumar', 'operator', '/avatars/operator1.jpg'),
        ('op_002', 'operator2@aspcranes.com', '$2b$10$example2hash', 'Suresh Patel', 'operator', '/avatars/operator2.jpg'),
        ('op_003', 'operator3@aspcranes.com', '$2b$10$example3hash', 'Vikram Singh', 'operator', '/avatars/operator3.jpg')
      ON CONFLICT (uid) DO NOTHING;
    `);

    console.log('✅ Sample data population completed successfully!');
    console.log('');
    console.log('📊 Summary of created data:');
    
    // Count records
    const customerCount = await client.query('SELECT COUNT(*) FROM customers');
    const leadCount = await client.query('SELECT COUNT(*) FROM leads');
    const dealCount = await client.query('SELECT COUNT(*) FROM deals');
    const equipmentCount = await client.query('SELECT COUNT(*) FROM equipment');
    const jobCount = await client.query('SELECT COUNT(*) FROM jobs');
    const operatorCount = await client.query('SELECT COUNT(*) FROM users WHERE role = \'operator\'');
    
    console.log(`- Customers: ${customerCount.rows[0].count}`);
    console.log(`- Leads: ${leadCount.rows[0].count}`);
    console.log(`- Deals: ${dealCount.rows[0].count}`);
    console.log(`- Equipment: ${equipmentCount.rows[0].count}`);
    console.log(`- Jobs: ${jobCount.rows[0].count}`);
    console.log(`- Operators: ${operatorCount.rows[0].count}`);
    
    console.log('');
    console.log('🎉 Your dashboard should now display data!');
    console.log('🔄 Refresh your browser to see the updated dashboard.');
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the population script
populateSampleData().catch(console.error);
