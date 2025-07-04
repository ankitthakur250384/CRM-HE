/**
 * PostgreSQL Deal Repository - Direct Database Implementation
 * Maps directly to schema.sql structure
 */
import { Deal, DealStage } from '../../types/deal';
import { query, getClient } from '../../lib/dbConnection';

/**
 * Get all deals from the database
 * Using direct PostgreSQL connection
 */
export const getDeals = async (): Promise<Deal[]> => {  
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
    
    // Map database fields to frontend model
    const deals = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      value: typeof row.value === 'number' ? row.value : parseFloat(row.value),
      probability: typeof row.probability === 'number' ? row.probability : (row.probability ? parseFloat(row.probability) : 0),
      stage: row.stage as DealStage,
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
      createdByName: row.created_by_name || '',
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_name || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      notes: row.notes || ''
    }));
    
    console.log(`Successfully retrieved ${deals.length} deals from database`);
    
    return deals;
  } catch (error) {
    console.error('Error fetching deals from database:', error);
    throw error;
  }
};

/**
 * Get a deal by ID from the database
 */
export const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    if (!id) {
      throw new Error('Deal ID is required');
    }
    
    console.log(`Getting deal ${id} from database`);
    
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
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`Deal ${id} not found in database`);
      return null;
    }
    
    const row = result.rows[0];
    
    // Map database fields to frontend model
    const deal: Deal = {
      id: row.id,
      title: row.title,
      description: row.description || '',
      value: typeof row.value === 'number' ? row.value : parseFloat(row.value),
      probability: typeof row.probability === 'number' ? row.probability : (row.probability ? parseFloat(row.probability) : 0),
      stage: row.stage as DealStage,
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
      createdByName: row.created_by_name || '',
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
 * Create a new deal in the database
 * Maps to the 'deals' table in schema.sql
 */
export const createDeal = async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
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
      deal.leadId,
      deal.customerId,
      deal.title,
      deal.description,
      deal.value,
      deal.stage,
      deal.createdBy,
      deal.assignedTo,
      deal.probability,
      deal.expectedCloseDate,
      deal.notes
    ]);
    
    const newDeal = result.rows[0];
    
    // Get customer information
    let customer = {
      name: 'Unknown Customer',
      email: '',
      phone: '',
      company: '',
      address: '',
      designation: ''
    };
    
    if (newDeal.customer_id) {
      const customerResult = await client.query('SELECT * FROM customers WHERE id = $1', [newDeal.customer_id]);
      if (customerResult.rows.length > 0) {
        const customerRow = customerResult.rows[0];
        customer = {
          name: customerRow.name,
          email: customerRow.email,
          phone: customerRow.phone,
          company: customerRow.company_name,
          address: customerRow.address,
          designation: customerRow.designation || ''
        };
      }
    }
    
    // Get assigned user's name if needed
    let assignedToName = '';
    if (newDeal.assigned_to) {
      const userResult = await client.query('SELECT display_name FROM users WHERE uid = $1', [newDeal.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    // Get created by user's name if needed
    let createdByName = '';
    if (newDeal.created_by) {
      const userResult = await client.query('SELECT display_name FROM users WHERE uid = $1', [newDeal.created_by]);
      if (userResult.rows.length > 0) {
        createdByName = userResult.rows[0].display_name;
      }
    }
    
    await client.query('COMMIT');
    
    // Map database fields to frontend model for the response
    const createdDeal: Deal = {
      id: newDeal.id,
      title: newDeal.title,
      description: newDeal.description || '',
      value: typeof newDeal.value === 'number' ? newDeal.value : parseFloat(newDeal.value),
      probability: typeof newDeal.probability === 'number' ? newDeal.probability : (newDeal.probability ? parseFloat(newDeal.probability) : 0),
      stage: newDeal.stage as DealStage,
      leadId: newDeal.lead_id,
      customerId: newDeal.customer_id,
      customer,
      expectedCloseDate: newDeal.expected_close_date,
      createdBy: newDeal.created_by,
      createdByName,
      assignedTo: newDeal.assigned_to || '',
      assignedToName,
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
 * Update a deal in the database
 */
export const updateDeal = async (id: string, dealData: Partial<Deal>): Promise<Deal | null> => {
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
    
    // Build the SQL update statement dynamically based on the provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    // Map frontend model fields to database schema
    if (dealData.leadId !== undefined) {
      updates.push(`lead_id = $${paramCounter++}`);
      values.push(dealData.leadId);
    }
    
    if (dealData.customerId !== undefined) {
      updates.push(`customer_id = $${paramCounter++}`);
      values.push(dealData.customerId);
    }
    
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
    
    if (dealData.stage !== undefined) {
      updates.push(`stage = $${paramCounter++}`);
      values.push(dealData.stage);
    }
    
    if (dealData.createdBy !== undefined) {
      updates.push(`created_by = $${paramCounter++}`);
      values.push(dealData.createdBy);
    }
    
    if (dealData.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCounter++}`);
      values.push(dealData.assignedTo);
    }
    
    if (dealData.probability !== undefined) {
      updates.push(`probability = $${paramCounter++}`);
      values.push(dealData.probability);
    }
    
    if (dealData.expectedCloseDate !== undefined) {
      updates.push(`expected_close_date = $${paramCounter++}`);
      values.push(dealData.expectedCloseDate);
    }
    
    if (dealData.notes !== undefined) {
      updates.push(`notes = $${paramCounter++}`);
      values.push(dealData.notes);
    }
    
    // Add the id as the last parameter
    values.push(id);
    
    // If there are no fields to update, return the existing deal
    if (updates.length === 0) {
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
    
    // Get customer information
    let customer = {
      name: 'Unknown Customer',
      email: '',
      phone: '',
      company: '',
      address: '',
      designation: ''
    };
    
    if (updatedDeal.customer_id) {
      const customerResult = await client.query('SELECT * FROM customers WHERE id = $1', [updatedDeal.customer_id]);
      if (customerResult.rows.length > 0) {
        const customerRow = customerResult.rows[0];
        customer = {
          name: customerRow.name,
          email: customerRow.email,
          phone: customerRow.phone,
          company: customerRow.company_name,
          address: customerRow.address,
          designation: customerRow.designation || ''
        };
      }
    }
    
    // Get assigned user's name if needed
    let assignedToName = '';
    if (updatedDeal.assigned_to) {
      const userResult = await client.query('SELECT display_name FROM users WHERE uid = $1', [updatedDeal.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    // Get created by user's name if needed
    let createdByName = '';
    if (updatedDeal.created_by) {
      const userResult = await client.query('SELECT display_name FROM users WHERE uid = $1', [updatedDeal.created_by]);
      if (userResult.rows.length > 0) {
        createdByName = userResult.rows[0].display_name;
      }
    }
    
    await client.query('COMMIT');
    
    // Map database fields to frontend model
    const mappedDeal: Deal = {
      id: updatedDeal.id,
      title: updatedDeal.title,
      description: updatedDeal.description || '',
      value: typeof updatedDeal.value === 'number' ? updatedDeal.value : parseFloat(updatedDeal.value),
      probability: typeof updatedDeal.probability === 'number' ? updatedDeal.probability : (updatedDeal.probability ? parseFloat(updatedDeal.probability) : 0),
      stage: updatedDeal.stage as DealStage,
      leadId: updatedDeal.lead_id,
      customerId: updatedDeal.customer_id,
      customer,
      expectedCloseDate: updatedDeal.expected_close_date,
      createdBy: updatedDeal.created_by,
      createdByName,
      assignedTo: updatedDeal.assigned_to || '',
      assignedToName,
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
 * Update a deal's stage in the database
 * Updates the 'stage' field in the 'deals' table
 */
export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  try {
    if (!id) {
      throw new Error('Invalid deal ID provided');
    }
    
    console.log(`Updating deal ${id} stage to ${stage} in database`);
    
    const result = await query(
      'UPDATE deals SET stage = $1 WHERE id = $2 RETURNING *',
      [stage, id]
    );
    
    if (result.rows.length === 0) {
      console.warn(`Deal ${id} not found when updating stage to ${stage}`);
      return null;
    }
    
    // Get the full deal data with the updated stage
    return getDealById(id);
  } catch (error) {
    console.error(`Error updating deal ${id} stage to ${stage}:`, error);
    throw error;
  }
};

/**
 * Delete a deal from the database
 */
export const deleteDeal = async (id: string): Promise<boolean> => {
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
