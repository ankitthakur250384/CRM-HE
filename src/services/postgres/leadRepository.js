/**
 * Lead Repository - JavaScript Implementation
 * 
 * This file provides a JavaScript implementation of the lead repository
 * that can be directly imported from MJS files.
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Database configuration
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

/**
 * Get all leads
 */
export const getLeads = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(`
      SELECT 
        l.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.customer_id
      ORDER BY l.created_at DESC
    `);
    
    return result.rows.map(row => ({
      id: row.lead_id,
      customerId: row.customer_id,
      title: row.title || `Lead for ${row.customer_name || 'Customer'}`,
      description: row.description || '',
      customer: {
        name: row.customer_name || 'Unknown Customer',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
        company: row.customer_company || '',
        address: row.customer_address || '',
        designation: row.customer_designation || ''
      },
      status: row.status || 'new',
      source: row.source || 'direct',
      assignedTo: row.assigned_to || '',
      notes: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error in getLeads:', error);
    throw new Error(`Failed to get leads: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Get lead by ID
 */
export const getLeadById = async (id) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(`
      SELECT 
        l.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.customer_id
      WHERE l.lead_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.lead_id,
      customerId: row.customer_id,
      title: row.title || `Lead for ${row.customer_name || 'Customer'}`,
      description: row.description || '',
      customer: {
        name: row.customer_name || 'Unknown Customer',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
        company: row.customer_company || '',
        address: row.customer_address || '',
        designation: row.customer_designation || ''
      },
      status: row.status || 'new',
      source: row.source || 'direct',
      assignedTo: row.assigned_to || '',
      notes: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error in getLeadById for ID ${id}:`, error);
    throw new Error(`Failed to get lead with ID ${id}: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Create a new lead
 */
export const createLead = async (leadData) => {
  let client;
  try {
    client = await pool.connect();
    
    // Generate a unique lead ID
    const leadId = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const { 
      customerId, 
      title, 
      description, 
      status, 
      source, 
      assignedTo, 
      notes 
    } = leadData;
    
    await client.query(`
      INSERT INTO leads (
        lead_id, 
        customer_id, 
        title, 
        description, 
        status, 
        source, 
        assigned_to, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      leadId,
      customerId,
      title,
      description,
      status || 'new',
      source || 'direct',
      assignedTo,
      notes
    ]);
    
    // Return the created lead with all fields
    return {
      id: leadId,
      customerId,
      title,
      description,
      status: status || 'new',
      source: source || 'direct',
      assignedTo: assignedTo || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in createLead:', error);
    throw new Error(`Failed to create lead: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Update a lead
 */
export const updateLead = async (id, leadData) => {
  let client;
  try {
    client = await pool.connect();
    
    // Check if the lead exists
    const checkResult = await client.query('SELECT lead_id FROM leads WHERE lead_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return null;
    }
    
    // Build the update query dynamically based on provided fields
    const updates = [];
    const values = [id];
    let paramIndex = 2;
    
    if (leadData.customerId !== undefined) {
      updates.push(`customer_id = $${paramIndex++}`);
      values.push(leadData.customerId);
    }
    
    if (leadData.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(leadData.title);
    }
    
    if (leadData.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(leadData.description);
    }
    
    if (leadData.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(leadData.status);
    }
    
    if (leadData.source !== undefined) {
      updates.push(`source = $${paramIndex++}`);
      values.push(leadData.source);
    }
    
    if (leadData.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(leadData.assignedTo);
    }
    
    if (leadData.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(leadData.notes);
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // Execute the update
    await client.query(`
      UPDATE leads 
      SET ${updates.join(', ')} 
      WHERE lead_id = $1
    `, values);
    
    // Get the updated lead
    return await getLeadById(id);
  } catch (error) {
    console.error(`Error in updateLead for ID ${id}:`, error);
    throw new Error(`Failed to update lead with ID ${id}: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Delete a lead
 */
export const deleteLead = async (id) => {
  let client;
  try {
    client = await pool.connect();
    
    // Check if the lead exists
    const checkResult = await client.query('SELECT lead_id FROM leads WHERE lead_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return false;
    }
    
    // Delete the lead
    await client.query('DELETE FROM leads WHERE lead_id = $1', [id]);
    return true;
  } catch (error) {
    console.error(`Error in deleteLead for ID ${id}:`, error);
    throw new Error(`Failed to delete lead with ID ${id}: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};
