// Stub equipmentRepository to prevent import errors
import { db } from '../../lib/dbClient.js';

export const getEquipment = async () => {
  try {
    const equipment = await db.any('SELECT * FROM equipment ORDER BY name');
    return equipment;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }
};

export const getEquipmentById = async (id) => {
  try {
    return await db.oneOrNone('SELECT * FROM equipment WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error fetching equipment by ID:', error);
    return null;
  }
};
