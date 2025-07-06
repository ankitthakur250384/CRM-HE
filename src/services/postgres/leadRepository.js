/**
 * PostgreSQL Lead Repository (JavaScript version)
 * Handles database operations for leads using direct PostgreSQL connection
 */

import { query, getClient } from '../../lib/dbConnection.js';

/**
 * Get all leads from the database
 */
export const getLeads = async () => {
  try {
    console.log('Getting all leads directly from PostgreSQL database');
    
    // Query matches schema.sql leads table structure
    // Use COALESCE to handle both linked customers and standalone customer names
    const result = await query(`
      SELECT l.*, 
             COALESCE(c.name, l.customer_name, 'Unknown Customer') as customer_name,
             COALESCE(c.company_name, l.company_name, '') as company_name,
             COALESCE(c.email, l.email) as email,
             COALESCE(c.phone, l.phone) as phone,
             COALESCE(c.address, '') as customer_address,
             COALESCE(c.designation, l.designation, '') as designation,
             u.display_name as assigned_to_name
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.uid
      ORDER BY l.created_at DESC
    `);
    
    // Map database fields to frontend model
    const leads = result.rows.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      customerAddress: row.customer_address,
      serviceNeeded: row.service_needed,
      siteLocation: row.site_location,
      startDate: row.start_date,
      rentalDays: row.rental_days,
      shiftTiming: row.shift_timing,
      status: row.status,
      source: row.source,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_name || '',
      designation: row.designation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      files: row.files ? JSON.parse(row.files) : null,
      notes: row.notes
    }));
    
    console.log(`Successfully retrieved ${leads.length} leads from database`);
    console.log('🧪 Debug: First few leads customer names:', 
      leads.slice(0, 3).map(lead => ({ 
        id: lead.id, 
        customerName: lead.customerName,
        companyName: lead.companyName 
      }))
    );
    
    return leads;
  } catch (error) {
    console.error('Error fetching leads from database:', error);
    throw error;
  }
};

/**
 * Create a new lead in the database
 */
export const createLead = async (lead) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating lead in PostgreSQL database:', {
      customerName: lead.customerName,
      email: lead.email,
      companyName: lead.companyName
    });
    
    // Find or create customer to ensure proper data consistency
    const customerData = await findOrCreateCustomerForLead(lead, client);
    
    // Validate assigned_to field - ensure it's either null or a valid user ID
    let validAssignedTo = null;
    if (lead.assignedTo && lead.assignedTo.trim() !== '') {
      const userCheck = await client.query('SELECT uid FROM users WHERE uid = $1', [lead.assignedTo]);
      if (userCheck.rows.length > 0) {
        validAssignedTo = lead.assignedTo;
        console.log(`✅ Valid assignedTo user found: ${lead.assignedTo}`);
      } else {
        console.warn(`⚠️ Invalid assignedTo user ID: ${lead.assignedTo}, setting to null`);
        validAssignedTo = null;
      }
    }

    // Map frontend data to database schema
    const result = await client.query(`
      INSERT INTO leads (
        customer_id, customer_name, company_name, email, phone,
        service_needed, site_location, start_date, rental_days,
        shift_timing, status, source, assigned_to, designation,
        notes, files
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      customerData.customerId,
      customerData.customerName,
      customerData.companyName,
      lead.email,
      lead.phone,
      lead.serviceNeeded,
      lead.siteLocation,
      lead.startDate,
      lead.rentalDays,
      lead.shiftTiming,
      lead.status,
      lead.source,
      validAssignedTo, // Use validated assignedTo value
      lead.designation,
      lead.notes,
      lead.files ? JSON.stringify(lead.files) : null
    ]);
    
    const newLead = result.rows[0];
    
    // If there's an assignedTo value, we need to get the assigned user's name
    let assignedToName = '';
    if (newLead.assigned_to) {
      const userResult = await client.query('SELECT display_name FROM users WHERE uid = $1', [newLead.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    await client.query('COMMIT');
    
    // Map database fields to frontend model for the response
    const createdLead = {
      id: newLead.id,
      customerId: newLead.customer_id,
      customerName: newLead.customer_name,
      companyName: newLead.company_name,
      email: newLead.email,
      phone: newLead.phone,
      serviceNeeded: newLead.service_needed,
      siteLocation: newLead.site_location,
      startDate: newLead.start_date,
      rentalDays: newLead.rental_days,
      shiftTiming: newLead.shift_timing,
      status: newLead.status,
      source: newLead.source,
      assignedTo: newLead.assigned_to || '',
      assignedToName: assignedToName,
      designation: newLead.designation,
      createdAt: newLead.created_at,
      updatedAt: newLead.updated_at,
      files: newLead.files ? JSON.parse(newLead.files) : null,
      notes: newLead.notes
    };
    
    console.log('Lead created successfully:', createdLead.id);
    
    return createdLead;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating lead:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update a lead's status in the database
 */
export const updateLeadStatus = async (id, status) => {
  try {
    if (!id) {
      throw new Error('Invalid lead ID provided');
    }
    
    console.log(`Updating lead ${id} status to ${status} in database`);
    
    const result = await query(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      console.warn(`Lead ${id} not found when updating status to ${status}`);
      return null;
    }
    
    const updatedLead = result.rows[0];
    
    // Get the assigned user's name if needed
    let assignedToName = '';
    if (updatedLead.assigned_to) {
      const userResult = await query('SELECT display_name FROM users WHERE uid = $1', [updatedLead.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    // Map database fields to frontend model
    const mappedLead = {
      id: updatedLead.id,
      customerId: updatedLead.customer_id,
      customerName: updatedLead.customer_name,
      companyName: updatedLead.company_name,
      email: updatedLead.email,
      phone: updatedLead.phone,
      serviceNeeded: updatedLead.service_needed,
      siteLocation: updatedLead.site_location,
      startDate: updatedLead.start_date,
      rentalDays: updatedLead.rental_days,
      shiftTiming: updatedLead.shift_timing,
      status: updatedLead.status,
      source: updatedLead.source,
      assignedTo: updatedLead.assigned_to || '',
      assignedToName: assignedToName,
      designation: updatedLead.designation,
      createdAt: updatedLead.created_at,
      updatedAt: updatedLead.updated_at,
      files: updatedLead.files ? JSON.parse(updatedLead.files) : null,
      notes: updatedLead.notes
    };
    
    console.log(`Lead ${id} status updated successfully to ${status}`);
    
    return mappedLead;
  } catch (error) {
    console.error(`Error updating lead ${id} status to ${status}:`, error);
    throw error;
  }
};

/**
 * Get a lead by ID from the database
 */
export const getLeadById = async (id) => {
  try {
    if (!id) {
      throw new Error('Invalid lead ID provided');
    }
    
    console.log(`Getting lead ${id} from database`);
    
    const result = await query(`
      SELECT l.*, c.name as customer_name, c.company_name, u.display_name as assigned_to_name  
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.uid
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`Lead ${id} not found in database`);
      return null;
    }
    
    const row = result.rows[0];
    
    // Map database fields to frontend model
    const lead = {
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      serviceNeeded: row.service_needed,
      siteLocation: row.site_location,
      startDate: row.start_date,
      rentalDays: row.rental_days,
      shiftTiming: row.shift_timing,
      status: row.status,
      source: row.source,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_name || '',
      designation: row.designation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      files: row.files ? JSON.parse(row.files) : null,
      notes: row.notes
    };
    
    console.log(`Lead ${id} retrieved successfully`);
    
    return lead;
  } catch (error) {
    console.error(`Error fetching lead ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a lead from the database
 */
export const deleteLead = async (id) => {
  try {
    if (!id) {
      throw new Error('Invalid lead ID provided');
    }
    
    console.log(`Deleting lead ${id} from database`);
    
    const result = await query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);
    
    const deleted = result.rows.length > 0;
    
    if (deleted) {
      console.log(`Lead ${id} deleted successfully`);
    } else {
      console.warn(`Lead ${id} not found for deletion`);
    }
    
    return deleted;
  } catch (error) {
    console.error(`Error deleting lead ${id}:`, error);
    throw error;
  }
};

/**
 * Helper function to find or create a customer for a lead
 * Enhanced version with better error handling and data consistency
 */
export const findOrCreateCustomerForLead = async (leadData, client) => {
  try {
    console.log('🔍 Finding or creating customer for lead:', {
      email: leadData.email,
      customerName: leadData.customerName,
      companyName: leadData.companyName
    });
    
    // First, try to find an existing customer by email (most reliable identifier)
    const existingCustomerResult = await client.query(
      'SELECT id, name, company_name, contact_name FROM customers WHERE email = $1',
      [leadData.email]
    );
    
    if (existingCustomerResult.rows.length > 0) {
      const customer = existingCustomerResult.rows[0];
      console.log(`✅ Found existing customer ${customer.id} (${customer.name}) for email ${leadData.email}`);
      return {
        customerId: customer.id,
        customerName: customer.name,
        companyName: customer.company_name
      };
    }
    
    // If no existing customer found by email, try by name + company combination
    if (leadData.customerName && leadData.companyName) {
      const nameCompanyResult = await client.query(
        'SELECT id, name, company_name FROM customers WHERE name ILIKE $1 AND company_name ILIKE $2',
        [`%${leadData.customerName}%`, `%${leadData.companyName}%`]
      );
      
      if (nameCompanyResult.rows.length > 0) {
        const customer = nameCompanyResult.rows[0];
        console.log(`✅ Found existing customer ${customer.id} by name+company match`);
        
        // Update the customer's email if it was missing
        await client.query(
          'UPDATE customers SET email = $1, updated_at = NOW() WHERE id = $2 AND (email IS NULL OR email = \'\')',
          [leadData.email, customer.id]
        );
        
        return {
          customerId: customer.id,
          customerName: customer.name,
          companyName: customer.company_name
        };
      }
    }
    
    // No existing customer found, create a new one
    console.log(`🆕 Creating new customer for email ${leadData.email}`);
    const customerName = leadData.customerName || 'Unknown Customer';
    const companyName = leadData.companyName || customerName;
    
    const newCustomerResult = await client.query(`
      INSERT INTO customers (
        name, company_name, contact_name, email, phone, address, 
        type, designation, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, company_name
    `, [
      customerName,
      companyName,
      customerName, // contact_name defaults to name
      leadData.email,
      leadData.phone || '',
      leadData.siteLocation || '', // Use site location as address fallback
      'other', // Default type
      leadData.designation || '',
      `Auto-created from lead on ${new Date().toISOString()}`
    ]);
    
    const newCustomer = newCustomerResult.rows[0];
    console.log(`🎉 Created new customer ${newCustomer.id} (${newCustomer.name}) for lead`);
    
    return {
      customerId: newCustomer.id,
      customerName: newCustomer.name,
      companyName: newCustomer.company_name
    };
    
  } catch (error) {
    console.error('❌ Error finding/creating customer for lead:', error);
    // Fall back to using lead data directly without customer linking
    console.log('🔄 Falling back to lead data without customer linking');
    return {
      customerId: null,
      customerName: leadData.customerName || 'Unknown Customer',
      companyName: leadData.companyName || ''
    };
  }
};

/**
 * Update a lead's assignment in the database
 * Updates the 'assigned_to' field in the 'leads' table
 */
export const updateLeadAssignment = async (leadId, salesAgentId, salesAgentName) => {
  try {
    if (!leadId) {
      throw new Error('Invalid lead ID provided');
    }
    
    // Validate assigned_to field - ensure it's either null or a valid user ID
    let validAssignedTo = null;
    if (salesAgentId && salesAgentId.trim() !== '') {
      const userCheck = await query('SELECT uid FROM users WHERE uid = $1', [salesAgentId]);
      if (userCheck.rows.length > 0) {
        validAssignedTo = salesAgentId;
        console.log(`✅ Valid assignedTo user found: ${salesAgentId}`);
      } else {
        console.warn(`⚠️ Invalid assignedTo user ID: ${salesAgentId}, setting to null`);
        validAssignedTo = null;
      }
    }
    
    // Log whether we're assigning or unassigning
    const actionType = validAssignedTo === null ? 'Unassigning' : 'Assigning';
    console.log(`${actionType} lead ${leadId} ${validAssignedTo === null ? '' : `to ${salesAgentName}`}`);
    
    const result = await query(
      'UPDATE leads SET assigned_to = $1 WHERE id = $2 RETURNING *',
      [validAssignedTo, leadId]
    );
    
    if (result.rows.length === 0) {
      console.warn(`Lead ${leadId} not found when updating assignment`);
      return null;
    }
    
    const updatedLead = result.rows[0];
    
    // Get the assigned user's name if needed
    let assignedToName = '';
    if (updatedLead.assigned_to) {
      const userResult = await query('SELECT display_name FROM users WHERE uid = $1', [updatedLead.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    // Map database fields to frontend model
    const mappedLead = {
      id: updatedLead.id,
      customerId: updatedLead.customer_id,
      customerName: updatedLead.customer_name,
      companyName: updatedLead.company_name,
      email: updatedLead.email,
      phone: updatedLead.phone,
      serviceNeeded: updatedLead.service_needed,
      siteLocation: updatedLead.site_location,
      startDate: updatedLead.start_date,
      rentalDays: updatedLead.rental_days,
      shiftTiming: updatedLead.shift_timing,
      status: updatedLead.status,
      source: updatedLead.source,
      assignedTo: updatedLead.assigned_to || '',
      assignedToName: assignedToName || salesAgentName, // Use the provided name for display
      designation: updatedLead.designation,
      createdAt: updatedLead.created_at,
      updatedAt: updatedLead.updated_at,
      files: updatedLead.files ? JSON.parse(updatedLead.files) : null,
      notes: updatedLead.notes
    };
    
    console.log(`Lead ${leadId} assignment updated successfully`);
    return mappedLead;
  } catch (error) {
    console.error(`Error updating lead ${leadId} assignment:`, error);
    throw error;
  }
};
