/**
 * Deal Repository - JavaScript Implementation
 * 
 * This file provides a JavaScript implementation of the deal repository
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
 * Get all deals
 */
export const getDeals = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(`
      SELECT 
        d.id,
        d.deal_id,
        d.customer_id,
        d.lead_id,
        d.status,
        d.amount,
        d.notes,
        d.assigned_to,
        d.created_at,
        d.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation,
        u.email as assigned_to_email,
        COALESCE(u.display_name, u.email) as assigned_to_display_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN users u ON d.assigned_to = u.uid
      ORDER BY d.created_at DESC
    `);
    
    return result.rows.map(row => ({
      id: row.deal_id,
      customerId: row.customer_id,
      leadId: row.lead_id || '',
      title: row.notes ? `Deal for ${row.customer_name || 'Customer'}` : row.deal_id,
      description: row.notes || '',
      customer: {
        name: row.customer_name || 'Unknown Customer',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
        company: row.customer_company || '',
        address: row.customer_address || '',
        designation: row.customer_designation || ''
      },
      value: parseFloat(row.amount) || 0,
      probability: 50,
      stage: row.status,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_display_name || row.assigned_to_email || '',
      expectedCloseDate: new Date().toISOString(),
      notes: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error in getDeals:', error);
    throw new Error(`Failed to get deals: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Get deal by ID
 */
export const getDealById = async (id) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(`
      SELECT 
        d.id,
        d.deal_id,
        d.customer_id,
        d.lead_id,
        d.status,
        d.amount,
        d.notes,
        d.assigned_to,
        d.created_at,
        d.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation,
        u.email as assigned_to_email,
        COALESCE(u.display_name, u.email) as assigned_to_display_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN users u ON d.assigned_to = u.uid
      WHERE d.deal_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.deal_id,
      customerId: row.customer_id,
      leadId: row.lead_id || '',
      title: row.notes ? `Deal for ${row.customer_name || 'Customer'}` : row.deal_id,
      description: row.notes || '',
      customer: {
        name: row.customer_name || 'Unknown Customer',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
        company: row.customer_company || '',
        address: row.customer_address || '',
        designation: row.customer_designation || ''
      },
      value: parseFloat(row.amount) || 0,
      probability: 50,
      stage: row.status,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_display_name || row.assigned_to_email || '',
      createdBy: '',
      expectedCloseDate: new Date().toISOString(),
      notes: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error in getDealById for ID ${id}:`, error);
    throw new Error(`Failed to get deal with ID ${id}: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Create a new deal
 */
export const createDeal = async (dealData) => {
  let client;
  try {
    client = await pool.connect();
    
    // Generate a unique deal ID
    const dealId = `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const { 
      customerId, 
      leadId, 
      value, 
      stage, 
      assignedTo, 
      notes 
    } = dealData;
    
    await client.query(`
      INSERT INTO deals (
        deal_id, 
        customer_id, 
        lead_id, 
        status, 
        amount, 
        assigned_to, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      dealId,
      customerId,
      leadId || null,
      stage || 'qualification',
      value || 0,
      assignedTo,
      notes
    ]);
    
    // Return the created deal with all fields
    return {
      id: dealId,
      customerId,
      leadId: leadId || '',
      title: `New Deal ${dealId}`,
      description: '',
      value: parseFloat(value) || 0,
      probability: 50,
      stage: stage || 'qualification',
      assignedTo: assignedTo || '',
      assignedToName: '',
      createdBy: '',
      expectedCloseDate: new Date().toISOString(),
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in createDeal:', error);
    throw new Error(`Failed to create deal: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Update a deal
 */
export const updateDeal = async (id, dealData) => {
  let client;
  try {
    client = await pool.connect();
    
    // Check if the deal exists
    const checkResult = await client.query('SELECT deal_id FROM deals WHERE deal_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return null;
    }
    
    // Build the update query dynamically based on provided fields
    const updates = [];
    const values = [id];
    let paramIndex = 2;
    
    if (dealData.customerId !== undefined) {
      updates.push(`customer_id = $${paramIndex++}`);
      values.push(dealData.customerId);
    }
    
    if (dealData.leadId !== undefined) {
      updates.push(`lead_id = $${paramIndex++}`);
      values.push(dealData.leadId || null);
    }
    
    if (dealData.stage !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(dealData.stage);
    }
    
    if (dealData.value !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(dealData.value);
    }
    
    if (dealData.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(dealData.assignedTo);
    }
    
    if (dealData.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dealData.notes);
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // Execute the update
    await client.query(`
      UPDATE deals 
      SET ${updates.join(', ')} 
      WHERE deal_id = $1
    `, values);
    
    // Get the updated deal
    return await getDealById(id);
  } catch (error) {
    console.error(`Error in updateDeal for ID ${id}:`, error);
    throw new Error(`Failed to update deal with ID ${id}: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Update a deal's stage
 */
export const updateDealStage = async (id, stage) => {
  let client;
  try {
    client = await pool.connect();
    
    // Check if the deal exists
    const checkResult = await client.query('SELECT deal_id FROM deals WHERE deal_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return null;
    }
    
    // Update the stage
    await client.query('UPDATE deals SET status = $1, updated_at = NOW() WHERE deal_id = $2', [stage, id]);
    
    // Get the updated deal
    return await getDealById(id);
  } catch (error) {
    console.error(`Error in updateDealStage for ID ${id}:`, error);
    throw new Error(`Failed to update stage for deal with ID ${id}: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (id) => {
  let client;
  try {
    client = await pool.connect();
    
    // Check if the deal exists
    const checkResult = await client.query('SELECT deal_id FROM deals WHERE deal_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return false;
    }
    
    // Delete the deal
    await client.query('DELETE FROM deals WHERE deal_id = $1', [id]);
    return true;
  } catch (error) {
    console.error(`Error in deleteDeal for ID ${id}:`, error);
    throw new Error(`Failed to delete deal with ID ${id}: ${error.message}`);
  } finally {
    if (client) client.release();
  }
};
