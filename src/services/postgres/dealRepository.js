/**
 * PostgreSQL Deal Repository (JavaScript version)
 * Handles database operations for deals using direct PostgreSQL connection
 */

import { query, getClient } from '../../lib/dbConnection.js';

/**
 * Get all deals from the database
 */
export const getDeals = async () => {  
  try {
    console.log('Getting all deals directly from PostgreSQL database');
    
    // Query matches schema.sql deals table structure
    const result = await query(`
      SELECT d.*, 
             c.name as customer_name, 
             c.email as customer_email,
             c.phone as customer_phone,
             c.company_name as customer_company,
             c.address as customer_address,
             c.designation as customer_designation,
             u1.display_name as assigned_to_name,
             u2.display_name as created_by_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u1 ON d.assigned_to = u1.uid
      LEFT JOIN users u2 ON d.created_by = u2.uid
      ORDER BY d.created_at DESC
    `);
    
    console.log(`Successfully fetched ${result.rows.length} deals from database`);
    
    // Map database fields to frontend model
    const deals = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      value: typeof row.value === 'number' ? row.value : parseFloat(row.value),
      probability: typeof row.probability === 'number' ? row.probability : (row.probability ? parseFloat(row.probability) : 0),
      stage: row.stage,
      leadId: row.lead_id,
      customerId: row.customer_id,
      customer: {
        name: row.customer_name || 'Unknown Customer',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
        company: row.customer_company || '',
        address: row.customer_address || '',
        designation: row.customer_designation || ''
      },
      expectedCloseDate: row.expected_close_date,
      createdBy: row.created_by,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_name || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      notes: row.notes || ''
    }));
    
    return deals;
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
};

/**
 * Create a new deal in the database
 */
export const createDeal = async (dealData) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating deal in PostgreSQL database');
    
    // Map frontend data to database schema
    const result = await client.query(`
      INSERT INTO deals (
        lead_id, customer_id, title, description, value,
        stage, created_by, assigned_to, probability,
        expected_close_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      dealData.leadId,
      dealData.customerId,
      dealData.title,
      dealData.description,
      dealData.value,
      dealData.stage,
      dealData.createdBy,
      dealData.assignedTo,
      dealData.probability,
      dealData.expectedCloseDate,
      dealData.notes
    ]);
    
    const newDeal = result.rows[0];
    
    // Get additional data for the response
    const customerQuery = await client.query('SELECT * FROM customers WHERE id = $1', [newDeal.customer_id]);
    const assignedToQuery = newDeal.assigned_to ? 
      await client.query('SELECT display_name FROM users WHERE uid = $1', [newDeal.assigned_to]) : 
      { rows: [] };
    
    await client.query('COMMIT');
    
    // Map database fields to frontend model
    const customer = customerQuery.rows[0] || {};
    const assignedToName = assignedToQuery.rows[0]?.display_name || '';
    
    const createdDeal = {
      id: newDeal.id,
      title: newDeal.title,
      description: newDeal.description || '',
      value: typeof newDeal.value === 'number' ? newDeal.value : parseFloat(newDeal.value),
      probability: typeof newDeal.probability === 'number' ? newDeal.probability : parseFloat(newDeal.probability || 0),
      stage: newDeal.stage,
      leadId: newDeal.lead_id,
      customerId: newDeal.customer_id,
      customer: {
        name: customer.name || 'Unknown Customer',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company_name || '',
        address: customer.address || '',
        designation: customer.designation || ''
      },
      expectedCloseDate: newDeal.expected_close_date,
      createdBy: newDeal.created_by,
      assignedTo: newDeal.assigned_to || '',
      assignedToName: assignedToName,
      createdAt: newDeal.created_at,
      updatedAt: newDeal.updated_at,
      notes: newDeal.notes || ''
    };
    
    console.log('Deal created successfully:', createdDeal.id);
    
    return createdDeal;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating deal:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update a deal's stage in the database
 */
export const updateDealStage = async (id, stage) => {
  try {
    if (!id) {
      throw new Error('Invalid deal ID provided');
    }
    
    console.log(`Updating deal ${id} stage to ${stage} in database`);
    
    const result = await query(
      'UPDATE deals SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stage, id]
    );
    
    if (result.rows.length === 0) {
      console.warn(`Deal ${id} not found when updating stage to ${stage}`);
      return null;
    }
    
    const updatedDeal = result.rows[0];
    
    // Get customer and assigned user info
    const customerQuery = await query('SELECT * FROM customers WHERE id = $1', [updatedDeal.customer_id]);
    const assignedToQuery = updatedDeal.assigned_to ? 
      await query('SELECT display_name FROM users WHERE uid = $1', [updatedDeal.assigned_to]) : 
      { rows: [] };
    
    const customer = customerQuery.rows[0] || {};
    const assignedToName = assignedToQuery.rows[0]?.display_name || '';
    
    // Map database fields to frontend model
    const mappedDeal = {
      id: updatedDeal.id,
      title: updatedDeal.title,
      description: updatedDeal.description || '',
      value: typeof updatedDeal.value === 'number' ? updatedDeal.value : parseFloat(updatedDeal.value),
      probability: typeof updatedDeal.probability === 'number' ? updatedDeal.probability : parseFloat(updatedDeal.probability || 0),
      stage: updatedDeal.stage,
      leadId: updatedDeal.lead_id,
      customerId: updatedDeal.customer_id,
      customer: {
        name: customer.name || 'Unknown Customer',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company_name || '',
        address: customer.address || '',
        designation: customer.designation || ''
      },
      expectedCloseDate: updatedDeal.expected_close_date,
      createdBy: updatedDeal.created_by,
      assignedTo: updatedDeal.assigned_to || '',
      assignedToName: assignedToName,
      createdAt: updatedDeal.created_at,
      updatedAt: updatedDeal.updated_at,
      notes: updatedDeal.notes || ''
    };
    
    console.log(`Deal ${id} stage updated successfully to ${stage}`);
    
    return mappedDeal;
  } catch (error) {
    console.error(`Error updating deal ${id} stage to ${stage}:`, error);
    throw error;
  }
};

/**
 * Get a deal by ID from the database
 */
export const getDealById = async (id) => {
  try {
    if (!id) {
      throw new Error('Invalid deal ID provided');
    }
    
    console.log(`Getting deal ${id} from database`);
    
    const result = await query(`
      SELECT d.*, 
             c.name as customer_name, 
             c.email as customer_email,
             c.phone as customer_phone,
             c.company_name as customer_company,
             c.address as customer_address,
             c.designation as customer_designation,
             u1.display_name as assigned_to_name,
             u2.display_name as created_by_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u1 ON d.assigned_to = u1.uid
      LEFT JOIN users u2 ON d.created_by = u2.uid
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`Deal ${id} not found in database`);
      return null;
    }
    
    const row = result.rows[0];
    
    // Map database fields to frontend model
    const deal = {
      id: row.id,
      title: row.title,
      description: row.description || '',
      value: typeof row.value === 'number' ? row.value : parseFloat(row.value),
      probability: typeof row.probability === 'number' ? row.probability : parseFloat(row.probability || 0),
      stage: row.stage,
      leadId: row.lead_id,
      customerId: row.customer_id,
      customer: {
        name: row.customer_name || 'Unknown Customer',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
        company: row.customer_company || '',
        address: row.customer_address || '',
        designation: row.customer_designation || ''
      },
      expectedCloseDate: row.expected_close_date,
      createdBy: row.created_by,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_name || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      notes: row.notes || ''
    };
    
    console.log(`Deal ${id} retrieved successfully`);
    
    return deal;
  } catch (error) {
    console.error(`Error fetching deal ${id}:`, error);
    throw error;
  }
};

/**
 * Update a deal in the database
 */
export const updateDeal = async (id, dealData) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log(`Updating deal ${id} in database`);
    
    // First check if the deal exists
    const checkResult = await client.query('SELECT * FROM deals WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      console.log(`Deal ${id} not found for update`);
      return null;
    }
    
    // Build the SQL update statement dynamically
    const updates = [];
    const values = [];
    let paramCounter = 1;
    
    if (dealData.title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      values.push(dealData.title);
    }
    
    if (dealData.description !== undefined) {
      updates.push(`description = $${paramCounter++}`);
      values.push(dealData.description);
    }
    
    if (dealData.value !== undefined) {
      updates.push(`value = $${paramCounter++}`);
      values.push(dealData.value);
    }
    
    if (dealData.probability !== undefined) {
      updates.push(`probability = $${paramCounter++}`);
      values.push(dealData.probability);
    }
    
    if (dealData.stage !== undefined) {
      updates.push(`stage = $${paramCounter++}`);
      values.push(dealData.stage);
    }
    
    if (dealData.expectedCloseDate !== undefined) {
      updates.push(`expected_close_date = $${paramCounter++}`);
      values.push(dealData.expectedCloseDate);
    }
    
    if (dealData.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCounter++}`);
      values.push(dealData.assignedTo);
    }
    
    if (dealData.notes !== undefined) {
      updates.push(`notes = $${paramCounter++}`);
      values.push(dealData.notes);
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // Add the id as the last parameter
    values.push(id);
    
    // If there are no fields to update, return the existing deal
    if (updates.length === 1) { // Only updated_at
      console.log(`No fields to update for deal ${id}`);
      return getDealById(id);
    }
    
    // Perform the update
    const result = await client.query(`
      UPDATE deals
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `, values);
    
    const updatedDeal = result.rows[0];
    
    // Get customer and assigned user info
    const customerQuery = await client.query('SELECT * FROM customers WHERE id = $1', [updatedDeal.customer_id]);
    const assignedToQuery = updatedDeal.assigned_to ? 
      await client.query('SELECT display_name FROM users WHERE uid = $1', [updatedDeal.assigned_to]) : 
      { rows: [] };
    
    await client.query('COMMIT');
    
    const customer = customerQuery.rows[0] || {};
    const assignedToName = assignedToQuery.rows[0]?.display_name || '';
    
    // Map database fields to frontend model
    const mappedDeal = {
      id: updatedDeal.id,
      title: updatedDeal.title,
      description: updatedDeal.description || '',
      value: typeof updatedDeal.value === 'number' ? updatedDeal.value : parseFloat(updatedDeal.value),
      probability: typeof updatedDeal.probability === 'number' ? updatedDeal.probability : parseFloat(updatedDeal.probability || 0),
      stage: updatedDeal.stage,
      leadId: updatedDeal.lead_id,
      customerId: updatedDeal.customer_id,
      customer: {
        name: customer.name || 'Unknown Customer',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company_name || '',
        address: customer.address || '',
        designation: customer.designation || ''
      },
      expectedCloseDate: updatedDeal.expected_close_date,
      createdBy: updatedDeal.created_by,
      assignedTo: updatedDeal.assigned_to || '',
      assignedToName: assignedToName,
      createdAt: updatedDeal.created_at,
      updatedAt: updatedDeal.updated_at,
      notes: updatedDeal.notes || ''
    };
    
    console.log(`Deal ${id} updated successfully`);
    
    return mappedDeal;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating deal ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a deal from the database
 */
export const deleteDeal = async (id) => {
  try {
    if (!id) {
      throw new Error('Invalid deal ID provided');
    }
    
    console.log(`Deleting deal ${id} from database`);
    
    const result = await query('DELETE FROM deals WHERE id = $1 RETURNING id', [id]);
    
    const deleted = result.rows.length > 0;
    
    if (deleted) {
      console.log(`Deal ${id} deleted successfully`);
    } else {
      console.warn(`Deal ${id} not found for deletion`);
    }
    
    return deleted;
  } catch (error) {
    console.error(`Error deleting deal ${id}:`, error);
    throw error;
  }
};
