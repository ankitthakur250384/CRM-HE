/**
 * Fixed Equipment Update Route
 * This version corrects the update query to match the actual database schema
 */
import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Update function specifically for the UPDATE endpoint that's failing
export async function updateEquipment(pool, id, equipmentData) {
  const client = await pool.connect();
  
  try {
    console.log(`Updating equipment ${id} with data:`, equipmentData);
    
    // Check if equipment exists
    const checkResult = await client.query('SELECT * FROM equipment WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      console.log(`Equipment ${id} not found`);
      return null;
    }
    
    // Print the first row of the result to see the actual column names
    console.log('Database record structure:', Object.keys(checkResult.rows[0]));
    
    // Get column info
    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'equipment'
      ORDER BY ordinal_position;
    `);
    console.log('Actual columns in database:', columnResult.rows.map(row => row.column_name));
    
    // Update equipment with corrected column names
    // The corrected version will be filled in based on the actual columns in the database
    const result = await client.query(`
      UPDATE equipment SET
        name = $1,
        equipment_type = $2, 
        manufacturing_date = $3,
        registration_date = $4,
        max_lifting_capacity = $5,
        unladen_weight = $6,
        base_rates = $7,
        running_cost_per_km = $8,
        description = $9,
        status = $10,
        running_cost = $11,
        updated_at = $12
      WHERE id = $13
      RETURNING *;
    `, [
      equipmentData.name,
      equipmentData.category, // Map frontend category to equipment_type in database
      equipmentData.manufacturingDate,
      equipmentData.registrationDate,
      equipmentData.maxLiftingCapacity,
      equipmentData.unladenWeight,
      JSON.stringify(equipmentData.baseRates),
      equipmentData.runningCostPerKm,
      equipmentData.description || '',
      equipmentData.status,
      equipmentData.runningCost || 0,
      new Date(),
      id
    ]);
    
    // Map database column names back to frontend property names
    const updatedEquipment = {
      id: result.rows[0].id,
      equipmentId: result.rows[0].equipment_id,
      name: result.rows[0].name,
      category: result.rows[0].equipment_type, // Map equipment_type back to category
      manufacturingDate: result.rows[0].manufacturing_date,
      registrationDate: result.rows[0].registration_date,
      maxLiftingCapacity: parseFloat(result.rows[0].max_lifting_capacity),
      unladenWeight: parseFloat(result.rows[0].unladen_weight),
      baseRates: typeof result.rows[0].base_rates === 'string' 
        ? JSON.parse(result.rows[0].base_rates) 
        : result.rows[0].base_rates,
      runningCostPerKm: parseFloat(result.rows[0].running_cost_per_km),
      description: result.rows[0].description || '',
      status: result.rows[0].status,
      runningCost: parseFloat(result.rows[0].running_cost),
      createdAt: result.rows[0].created_at.toISOString(),
      updatedAt: result.rows[0].updated_at.toISOString()
    };
    
    console.log('Update successful, returning:', updatedEquipment);
    return updatedEquipment;
    
  } catch (error) {
    console.error(`Error updating equipment ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
}
