// Stub dealRepository to prevent import errors
import { db } from '../../lib/dbClient.js';

export const getDeals = async () => {
  try {
    const deals = await db.any('SELECT * FROM deals ORDER BY created_at DESC');
    return deals;
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
};

export const getDealById = async (id) => {
  try {
    return await db.oneOrNone('SELECT * FROM deals WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error fetching deal by ID:', error);
    return null;
  }
};

export const createDeal = async (dealData) => {
  try {
    const result = await db.one(
      'INSERT INTO deals (customer_id, equipment_id, status) VALUES ($1, $2, $3) RETURNING *',
      [dealData.customerId, dealData.equipmentId, dealData.status || 'draft']
    );
    return result;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};
