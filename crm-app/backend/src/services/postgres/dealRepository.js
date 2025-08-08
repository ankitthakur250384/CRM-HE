// Enhanced dealRepository using centralized db client
import { db } from '../../lib/dbClient.js';

export const getDeals = async () => {
  try {
    console.log('📋 Fetching all deals...');
    const deals = await db.any('SELECT * FROM deals ORDER BY created_at DESC');
    console.log(`✅ Found ${deals.length} deals`);
    return deals;
  } catch (error) {
    console.error('❌ Error fetching deals:', error);
    return [];
  }
};

export const getDealById = async (id) => {
  try {
    console.log(`🔍 Fetching deal by ID: ${id}`);
    const deal = await db.oneOrNone('SELECT * FROM deals WHERE id = $1', [id]);
    console.log(`📝 Deal found: ${deal ? 'Yes' : 'No'}`);
    return deal;
  } catch (error) {
    console.error('❌ Error fetching deal by ID:', error);
    return null;
  }
};

export const createDeal = async (dealData) => {
  try {
    console.log('🆕 Creating new deal...');
    const result = await db.one(
      `INSERT INTO deals (lead_id, customer_id, title, description, value, stage, created_by, assigned_to, probability, expected_close_date, notes, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
      [
        dealData.leadId || null,
        dealData.customerId,
        dealData.title || 'New Deal',
        dealData.description || 'Deal created from lead',
        dealData.value || 0,
        dealData.stage || 'qualification',
        dealData.createdBy || dealData.assignedTo,
        dealData.assignedTo,
        dealData.probability || 50,
        dealData.expectedCloseDate || null,
        dealData.notes || ''
      ]
    );
    console.log(`✅ Deal created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating deal:', error);
    throw error;
  }
};

export const updateDeal = async (id, dealData) => {
  try {
    console.log(`📝 Updating deal: ${id}`);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (dealData.leadId !== undefined) {
      updates.push(`lead_id = $${paramIndex++}`);
      values.push(dealData.leadId);
    }
    if (dealData.customerId) {
      updates.push(`customer_id = $${paramIndex++}`);
      values.push(dealData.customerId);
    }
    if (dealData.title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(dealData.title);
    }
    if (dealData.description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(dealData.description);
    }
    if (dealData.value !== undefined) {
      updates.push(`value = $${paramIndex++}`);
      values.push(dealData.value);
    }
    if (dealData.stage) {
      updates.push(`stage = $${paramIndex++}`);
      values.push(dealData.stage);
    }
    if (dealData.assignedTo) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(dealData.assignedTo);
    }
    if (dealData.probability !== undefined) {
      updates.push(`probability = $${paramIndex++}`);
      values.push(dealData.probability);
    }
    if (dealData.expectedCloseDate) {
      updates.push(`expected_close_date = $${paramIndex++}`);
      values.push(dealData.expectedCloseDate);
    }
    if (dealData.notes) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dealData.notes);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE deals SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.one(query, values);
    console.log(`✅ Deal updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating deal:', error);
    throw error;
  }
};

export const deleteDeal = async (id) => {
  try {
    console.log(`🗑️ Deleting deal: ${id}`);
    await db.none('DELETE FROM deals WHERE id = $1', [id]);
    console.log(`✅ Deal deleted successfully: ${id}`);
  } catch (error) {
    console.error('❌ Error deleting deal:', error);
    throw error;
  }
};


// Update the stage of a deal by ID
export const updateDealStage = async (id, stage) => {
  try {
    console.log(`📝 Updating deal stage: ${id} to ${stage}`);
    const result = await db.one(
      'UPDATE deals SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stage, id]
    );
    console.log(`✅ Deal stage updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating deal stage:', error);
    throw error;
  }
};
