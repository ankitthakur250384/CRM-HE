// Get equipment by category
export const getEquipmentByCategory = async (category) => {
  try {
    console.log(`📋 Fetching equipment by category: ${category}`);
    const equipment = await db.any('SELECT * FROM equipment WHERE category = $1 ORDER BY name', [category]);
    console.log(`✅ Found ${equipment.length} equipment items for category ${category}`);
    return equipment;
  } catch (error) {
    console.error('❌ Error fetching equipment by category:', error);
    return [];
  }
};
// Enhanced equipmentRepository using centralized db client
import { db } from '../../lib/dbClient.js';

export const getAllEquipment = async () => {
  try {
    console.log('📋 Fetching all equipment...');
    const equipment = await db.any('SELECT * FROM equipment ORDER BY name');
    console.log(`✅ Found ${equipment.length} equipment items`);
    return equipment;
  } catch (error) {
    console.error('❌ Error fetching equipment:', error);
    return [];
  }
};

export const getEquipmentById = async (id) => {
  try {
    console.log(`🔍 Fetching equipment by ID: ${id}`);
    const equipment = await db.oneOrNone('SELECT * FROM equipment WHERE id = $1', [id]);
    console.log(`📝 Equipment found: ${equipment ? 'Yes' : 'No'}`);
    return equipment;
  } catch (error) {
    console.error('❌ Error fetching equipment by ID:', error);
    return null;
  }
};

export const createEquipment = async (equipmentData) => {
  try {
    console.log('🆕 Creating new equipment...');
    const result = await db.one(
      `INSERT INTO equipment (name, type, description, daily_rate, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [
        equipmentData.name,
        equipmentData.type,
        equipmentData.description,
        equipmentData.dailyRate,
        equipmentData.status || 'available'
      ]
    );
    console.log(`✅ Equipment created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating equipment:', error);
    throw error;
  }
};

export const updateEquipment = async (id, equipmentData) => {
  try {
    console.log(`📝 Updating equipment: ${id}`);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (equipmentData.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(equipmentData.name);
    }
    if (equipmentData.type) {
      updates.push(`type = $${paramIndex++}`);
      values.push(equipmentData.type);
    }
    if (equipmentData.description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(equipmentData.description);
    }
    if (equipmentData.dailyRate !== undefined) {
      updates.push(`daily_rate = $${paramIndex++}`);
      values.push(equipmentData.dailyRate);
    }
    if (equipmentData.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(equipmentData.status);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE equipment SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.one(query, values);
    console.log(`✅ Equipment updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating equipment:', error);
    throw error;
  }
};

export const deleteEquipment = async (id) => {
  try {
    console.log(`🗑️ Deleting equipment: ${id}`);
    await db.none('DELETE FROM equipment WHERE id = $1', [id]);
    console.log(`✅ Equipment deleted successfully: ${id}`);
  } catch (error) {
    console.error('❌ Error deleting equipment:', error);
    throw error;
  }
};
