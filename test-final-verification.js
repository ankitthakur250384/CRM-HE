/**
 * Final verification test to check if the frontend fix is working
 * This will test the actual quotation creation process end-to-end
 */

import axios from 'axios';
import pkg from 'pg';
const { Pool } = pkg;

// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'asp_cranes_crm',
    user: 'postgres',
    password: 'admin123'
};

const API_BASE_URL = 'http://localhost:3001/api';

async function testFinalVerification() {
    const pool = new Pool(dbConfig);
    let client;

    try {
        console.log('🧪 Starting final verification test...\n');

        client = await pool.connect();

        // 1. Check current quotations count and state
        console.log('📊 Current quotation database state:');
        const quotationsResult = await client.query(`
            SELECT 
                id, 
                customer_name, 
                customer_contact, 
                deal_id,
                lead_id,
                created_at
            FROM quotations 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        console.log(`Total quotations in last 10: ${quotationsResult.rows.length}`);
        console.log('Recent quotations:');
        quotationsResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ID: ${row.id}`);
            console.log(`     Customer: ${row.customer_name || 'NULL'}`);
            console.log(`     Contact: ${row.customer_contact || 'NULL'}`);
            console.log(`     Deal ID: ${row.deal_id || 'NULL'}`);
            console.log(`     Lead ID: ${row.lead_id || 'NULL'}`);
            console.log(`     Created: ${row.created_at}`);
            console.log('');
        });

        // 2. Get a deal to test with
        console.log('🔍 Finding a deal to test with...');
        const dealsResult = await client.query(`
            SELECT d.id, d.title, d.lead_id, l.customer_name, l.contact_number
            FROM deals d
            JOIN leads l ON d.lead_id = l.id
            LIMIT 1
        `);

        if (dealsResult.rows.length === 0) {
            console.log('❌ No deals found in database. Creating test data...');
            
            // Create a test lead first
            await client.query(`
                INSERT INTO leads (customer_name, contact_number, email, crane_type, project_description, lead_source, status)
                VALUES ('Test Customer Final', '9876543210', 'test.final@example.com', 'Mobile Crane', 'Final verification test', 'Direct', 'new')
            `);

            const newLeadResult = await client.query(`
                SELECT id FROM leads WHERE customer_name = 'Test Customer Final'
            `);

            const leadId = newLeadResult.rows[0].id;

            // Create a test deal
            await client.query(`
                INSERT INTO deals (title, lead_id, amount, status, expected_close_date)
                VALUES ('Final Test Deal', $1, 50000, 'active', CURRENT_DATE + INTERVAL '30 days')
            `, [leadId]);

            const newDealResult = await client.query(`
                SELECT d.id, d.title, d.lead_id, l.customer_name, l.contact_number
                FROM deals d
                JOIN leads l ON d.lead_id = l.id
                WHERE d.title = 'Final Test Deal'
            `);

            console.log('✅ Test data created');
            var testDeal = newDealResult.rows[0];
        } else {
            var testDeal = dealsResult.rows[0];
        }

        console.log(`Using deal: ${testDeal.title} (ID: ${testDeal.id})`);
        console.log(`Associated customer: ${testDeal.customer_name}`);
        console.log(`Contact: ${testDeal.contact_number}\n`);

        // 3. Test quotation creation via API (simulating frontend)
        console.log('🚀 Testing quotation creation via API...');
        
        const quotationData = {
            dealId: testDeal.id,  // This should now be properly included
            leadId: testDeal.lead_id,
            customerName: testDeal.customer_name,
            customerContact: testDeal.contact_number,
            projectDescription: 'Final verification test quotation',
            craneType: 'Mobile Crane',
            duration: '5 days',
            location: 'Test Location',
            requirements: 'Test requirements for final verification',
            estimatedCost: 25000,
            status: 'draft'
        };

        console.log('Sending quotation data:', JSON.stringify(quotationData, null, 2));

        const response = await axios.post(`${API_BASE_URL}/quotations`, quotationData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Quotation created successfully! ID: ${response.data.id}\n`);

        // 4. Verify the created quotation in database
        console.log('🔍 Verifying quotation in database...');
        const verificationResult = await client.query(`
            SELECT 
                id, 
                customer_name, 
                customer_contact, 
                deal_id,
                lead_id,
                project_description,
                estimated_cost,
                created_at
            FROM quotations 
            WHERE id = $1
        `, [response.data.id]);

        if (verificationResult.rows.length === 0) {
            console.log('❌ Quotation not found in database');
            return;
        }

        const createdQuotation = verificationResult.rows[0];
        console.log('Database verification results:');
        console.log(`  ID: ${createdQuotation.id}`);
        console.log(`  Customer Name: ${createdQuotation.customer_name || 'NULL'} ${createdQuotation.customer_name ? '✅' : '❌'}`);
        console.log(`  Customer Contact: ${createdQuotation.customer_contact || 'NULL'} ${createdQuotation.customer_contact ? '✅' : '❌'}`);
        console.log(`  Deal ID: ${createdQuotation.deal_id || 'NULL'} ${createdQuotation.deal_id ? '✅' : '❌'}`);
        console.log(`  Lead ID: ${createdQuotation.lead_id || 'NULL'} ${createdQuotation.lead_id ? '✅' : '❌'}`);
        console.log(`  Project Description: ${createdQuotation.project_description}`);
        console.log(`  Estimated Cost: ${createdQuotation.estimated_cost}`);
        console.log(`  Created: ${createdQuotation.created_at}\n`);

        // 5. Final assessment
        const hasAllRequiredFields = 
            createdQuotation.customer_name && 
            createdQuotation.customer_contact && 
            createdQuotation.deal_id && 
            createdQuotation.lead_id;

        if (hasAllRequiredFields) {
            console.log('🎉 SUCCESS! All required fields are present in the quotation:');
            console.log('   ✅ Customer Name');
            console.log('   ✅ Customer Contact');
            console.log('   ✅ Deal ID');
            console.log('   ✅ Lead ID');
            console.log('\n✅ The frontend fix is working correctly!');
        } else {
            console.log('❌ FAILURE! Some required fields are missing:');
            if (!createdQuotation.customer_name) console.log('   ❌ Customer Name');
            if (!createdQuotation.customer_contact) console.log('   ❌ Customer Contact');
            if (!createdQuotation.deal_id) console.log('   ❌ Deal ID');
            if (!createdQuotation.lead_id) console.log('   ❌ Lead ID');
            console.log('\n❌ The frontend fix needs more work.');
        }

        // 6. Count quotations with missing dealId
        const missingDealIdResult = await client.query(`
            SELECT COUNT(*) as count FROM quotations WHERE deal_id IS NULL
        `);
        
        console.log(`\n📊 Quotations missing dealId: ${missingDealIdResult.rows[0].count}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

// Run the test
testFinalVerification().catch(console.error);
