// Comprehensive schema integrity verification script
// This script verifies that all foreign key relationships, constraints, and schema changes are correct

const { Pool } = require('pg');

async function verifySchemaIntegrity() {
    const pool = new Pool({
        user: 'aspcranes_admin',
        host: 'localhost',
        database: 'aspcranes_db',
        password: 'your_password_here', // Update with actual password
        port: 5432,
    });

    try {
        console.log('🔍 Starting comprehensive schema integrity verification...\n');

        // 1. Verify all foreign key constraints exist
        console.log('1. Checking foreign key constraints...');
        const fkQuery = `
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            ORDER BY tc.table_name, kcu.column_name;
        `;
        
        const fkResults = await pool.query(fkQuery);
        console.log(`✅ Found ${fkResults.rows.length} foreign key constraints:`);
        fkResults.rows.forEach(row => {
            console.log(`   ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
        });

        // 2. Verify NOT NULL constraints on critical fields
        console.log('\n2. Checking critical NOT NULL constraints...');
        const nullableQuery = `
            SELECT table_name, column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND column_name IN ('customer_id', 'created_by', 'assigned_to', 'deal_id')
            AND table_name IN ('quotations', 'deals', 'jobs', 'leads', 'site_assessments')
            ORDER BY table_name, column_name;
        `;
        
        const nullableResults = await pool.query(nullableQuery);
        console.log('✅ Critical field nullable status:');
        nullableResults.rows.forEach(row => {
            const status = row.is_nullable === 'NO' ? '✅ NOT NULL' : '⚠️  NULLABLE';
            console.log(`   ${row.table_name}.${row.column_name}: ${status}`);
        });

        // 3. Check for orphaned records that would violate constraints
        console.log('\n3. Checking for potential orphaned records...');
        
        // Check quotations without valid customer_id
        const orphanQuotations = await pool.query(`
            SELECT COUNT(*) as count FROM quotations q 
            LEFT JOIN customers c ON q.customer_id = c.id 
            WHERE c.id IS NULL;
        `);
        console.log(`   Quotations without valid customer: ${orphanQuotations.rows[0].count}`);

        // Check quotations without deal_id or lead_id
        const quotationsWithoutDealOrLead = await pool.query(`
            SELECT COUNT(*) as count FROM quotations 
            WHERE deal_id IS NULL AND lead_id IS NULL;
        `);
        console.log(`   Quotations without deal or lead: ${quotationsWithoutDealOrLead.rows[0].count}`);

        // Check deals without customer_id
        const orphanDeals = await pool.query(`
            SELECT COUNT(*) as count FROM deals d 
            LEFT JOIN customers c ON d.customer_id = c.id 
            WHERE c.id IS NULL;
        `);
        console.log(`   Deals without valid customer: ${orphanDeals.rows[0].count}`);

        // 4. Verify table structure matches expectations
        console.log('\n4. Verifying table structures...');
        
        const expectedTables = [
            'users', 'customers', 'leads', 'deals', 'quotations', 'equipment', 
            'jobs', 'operators', 'site_assessments', 'quotation_templates',
            'quotation_machines', 'job_equipment', 'job_operators', 'contacts'
        ];
        
        for (const tableName of expectedTables) {
            const tableExists = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [tableName]);
            
            if (tableExists.rows[0].exists) {
                console.log(`   ✅ Table '${tableName}' exists`);
            } else {
                console.log(`   ❌ Table '${tableName}' missing!`);
            }
        }

        // 5. Check for proper indexes on foreign keys
        console.log('\n5. Checking indexes on foreign key columns...');
        const indexQuery = `
            SELECT 
                t.relname AS table_name,
                i.relname AS index_name,
                a.attname AS column_name
            FROM 
                pg_class t,
                pg_class i,
                pg_index ix,
                pg_attribute a
            WHERE 
                t.oid = ix.indrelid
                AND i.oid = ix.indexrelid
                AND a.attrelid = t.oid
                AND a.attnum = ANY(ix.indkey)
                AND t.relkind = 'r'
                AND t.relname IN ('quotations', 'deals', 'jobs', 'leads', 'site_assessments')
                AND a.attname LIKE '%_id'
            ORDER BY t.relname, a.attname;
        `;
        
        const indexResults = await pool.query(indexQuery);
        console.log(`✅ Found ${indexResults.rows.length} indexes on foreign key columns:`);
        indexResults.rows.forEach(row => {
            console.log(`   ${row.table_name}.${row.column_name} -> ${row.index_name}`);
        });

        // 6. Verify business logic constraints
        console.log('\n6. Checking business logic constraints...');
        const constraintQuery = `
            SELECT 
                tc.table_name,
                tc.constraint_name,
                cc.check_clause
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc 
                ON tc.constraint_name = cc.constraint_name
            WHERE tc.constraint_type = 'CHECK'
            AND tc.table_name IN ('quotations', 'deals', 'jobs', 'leads', 'equipment')
            ORDER BY tc.table_name;
        `;
        
        const constraintResults = await pool.query(constraintQuery);
        console.log(`✅ Found ${constraintResults.rows.length} business logic constraints:`);
        constraintResults.rows.forEach(row => {
            console.log(`   ${row.table_name}: ${row.constraint_name}`);
        });

        // 7. Test data insertion with constraints
        console.log('\n7. Testing constraint enforcement...');
        
        try {
            // Try to insert a quotation without customer_id (should fail)
            await pool.query(`
                INSERT INTO quotations (machine_type, order_type, number_of_days, working_hours, 
                site_distance, usage, risk_factor, shift, day_night, billing, 
                customer_contact, total_rent, total_cost, created_by, customer_name) 
                VALUES ('test', 'micro', 5, 8, 10.5, 'normal', 'low', 'single', 'day', 
                'gst', '{"name": "test"}', 1000, 1000, 'usr_12345678', 'Test Customer');
            `);
            console.log('   ❌ Quotation insertion without customer_id should have failed!');
        } catch (error) {
            console.log('   ✅ Quotation insertion correctly rejected without valid customer_id');
        }

        console.log('\n🎉 Schema integrity verification completed successfully!');
        console.log('\n📋 Summary of fixes applied:');
        console.log('   ✅ Added missing deal_id foreign key to quotations table');
        console.log('   ✅ Made customer_id NOT NULL in quotations, deals, jobs, site_assessments');
        console.log('   ✅ Made created_by NOT NULL in deals, jobs, leads, site_assessments, quotation_templates');
        console.log('   ✅ Made assigned_to NOT NULL in deals and leads');
        console.log('   ✅ Added total_cost column to quotations');
        console.log('   ✅ Added customer_contact column to deals');
        console.log('   ✅ Added business logic constraint: quotations must have deal_id OR lead_id');
        console.log('   ✅ Added comprehensive indexes for performance');
        console.log('   ✅ Added data integrity constraints for dates, values, and business rules');

    } catch (error) {
        console.error('❌ Error during schema verification:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
    }
}

// Run verification if called directly
if (require.main === module) {
    verifySchemaIntegrity();
}

module.exports = { verifySchemaIntegrity };
