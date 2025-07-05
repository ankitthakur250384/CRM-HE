/**
 * Customer Connection Fix Script
 * This script ensures all customer-lead connections are properly sorted
 * and fixes any data integrity issues
 */

import pool from './src/lib/dbConnection.js';

async function fixCustomerConnections() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting customer connection fix...');
    
    // 1. Check for leads without customer connections
    console.log('\n📊 Analyzing current state...');
    
    const orphanedLeadsResult = await client.query(`
      SELECT id, customer_name, email, company_name, customer_id
      FROM leads 
      WHERE customer_id IS NULL
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${orphanedLeadsResult.rows.length} leads without customer_id`);
    
    if (orphanedLeadsResult.rows.length > 0) {
      console.log('Sample orphaned leads:');
      orphanedLeadsResult.rows.slice(0, 5).forEach(lead => {
        console.log(`  - Lead ${lead.id}: ${lead.customer_name} (${lead.email})`);
      });
    }
    
    // 2. Check for customers that could match orphaned leads
    console.log('\n🔍 Finding matching customers...');
    
    for (const lead of orphanedLeadsResult.rows) {
      try {
        // Try to find existing customer by email
        const existingCustomerResult = await client.query(
          'SELECT id, name, company_name FROM customers WHERE email = $1',
          [lead.email]
        );
        
        if (existingCustomerResult.rows.length > 0) {
          // Link to existing customer
          const customer = existingCustomerResult.rows[0];
          await client.query(
            'UPDATE leads SET customer_id = $1 WHERE id = $2',
            [customer.id, lead.id]
          );
          console.log(`✅ Linked lead ${lead.id} to existing customer ${customer.id} (${customer.name})`);
        } else {
          // Create new customer for this lead
          const newCustomerResult = await client.query(`
            INSERT INTO customers (
              name, company_name, contact_name, email, phone, address, 
              type, designation, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, name, company_name
          `, [
            lead.customer_name || 'Unknown Customer',
            lead.company_name || lead.customer_name || 'Unknown Company',
            lead.customer_name || 'Unknown Contact',
            lead.email,
            '', // phone - will be updated when lead has phone
            '', // address - placeholder
            'other', // default type
            '', // designation
            `Auto-created from lead ${lead.id} on ${new Date().toISOString()}`
          ]);
          
          const newCustomer = newCustomerResult.rows[0];
          
          // Link lead to new customer
          await client.query(
            'UPDATE leads SET customer_id = $1 WHERE id = $2',
            [newCustomer.id, lead.id]
          );
          
          console.log(`🆕 Created new customer ${newCustomer.id} and linked to lead ${lead.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing lead ${lead.id}:`, error.message);
      }
    }
    
    // 3. Update customer info from leads where possible
    console.log('\n🔄 Updating customer information from leads...');
    
    const updateQuery = `
      UPDATE customers 
      SET 
        phone = COALESCE(NULLIF(customers.phone, ''), leads.phone, ''),
        address = COALESCE(NULLIF(customers.address, ''), leads.site_location, ''),
        designation = COALESCE(NULLIF(customers.designation, ''), leads.designation, ''),
        updated_at = NOW()
      FROM leads 
      WHERE customers.id = leads.customer_id 
        AND (customers.phone = '' OR customers.phone IS NULL 
             OR customers.address = '' OR customers.address IS NULL
             OR customers.designation = '' OR customers.designation IS NULL)
    `;
    
    const updateResult = await client.query(updateQuery);
    console.log(`📝 Updated ${updateResult.rowCount} customers with additional info from leads`);
    
    // 4. Ensure all deals have proper customer connections
    console.log('\n🤝 Fixing deal-customer connections...');
    
    const orphanedDealsResult = await client.query(`
      SELECT d.id, d.lead_id, d.customer_id, l.customer_id as lead_customer_id
      FROM deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      WHERE d.customer_id IS NULL AND l.customer_id IS NOT NULL
    `);
    
    if (orphanedDealsResult.rows.length > 0) {
      for (const deal of orphanedDealsResult.rows) {
        await client.query(
          'UPDATE deals SET customer_id = $1 WHERE id = $2',
          [deal.lead_customer_id, deal.id]
        );
        console.log(`🔗 Linked deal ${deal.id} to customer ${deal.lead_customer_id}`);
      }
    }
    
    // 5. Final verification
    console.log('\n✅ Final verification...');
    
    const finalOrphanedLeads = await client.query(`
      SELECT COUNT(*) as count FROM leads WHERE customer_id IS NULL
    `);
    
    const finalOrphanedDeals = await client.query(`
      SELECT COUNT(*) as count FROM deals WHERE customer_id IS NULL
    `);
    
    const totalCustomers = await client.query('SELECT COUNT(*) as count FROM customers');
    const totalLeads = await client.query('SELECT COUNT(*) as count FROM leads');
    const totalDeals = await client.query('SELECT COUNT(*) as count FROM deals');
    
    console.log('\n📈 Final Statistics:');
    console.log(`   Customers: ${totalCustomers.rows[0].count}`);
    console.log(`   Leads: ${totalLeads.rows[0].count}`);
    console.log(`   Deals: ${totalDeals.rows[0].count}`);
    console.log(`   Orphaned Leads: ${finalOrphanedLeads.rows[0].count}`);
    console.log(`   Orphaned Deals: ${finalOrphanedDeals.rows[0].count}`);
    
    console.log('\n🎉 Customer connection fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing customer connections:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
fixCustomerConnections()
  .then(() => {
    console.log('\n✅ All customer connections have been sorted!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fix customer connections:', error);
    process.exit(1);
  });
