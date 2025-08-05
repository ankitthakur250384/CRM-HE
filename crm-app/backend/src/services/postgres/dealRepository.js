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
      'INSERT INTO deals (customer_id, equipment_id, status, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [dealData.customerId, dealData.equipmentId, dealData.status || 'draft']
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

    if (dealData.customerId) {
      updates.push(`customer_id = $${paramIndex++}`);
      values.push(dealData.customerId);
    }
    if (dealData.equipmentId) {
      updates.push(`equipment_id = $${paramIndex++}`);
      values.push(dealData.equipmentId);
    }
    if (dealData.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(dealData.status);
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
