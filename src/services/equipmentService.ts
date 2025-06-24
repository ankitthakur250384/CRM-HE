/**
 * Equipment Service
 * 
 * This file serves as a wrapper around the PostgreSQL equipment repository.
 * It replaces the Firestore implementation and provides the same interface.
 */

import * as equipmentRepository from './postgres/equipmentRepository';
import { Equipment, CraneCategory } from '../types/equipment';

/**
 * Get all equipment
 */
export const getEquipment = async (): Promise<Equipment[]> => {
  return equipmentRepository.getEquipment();
};

/**
 * Get equipment by category
 */
export const getEquipmentByCategory = async (category: CraneCategory): Promise<Equipment[]> => {
  return equipmentRepository.getEquipmentByCategory(category);
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  return equipmentRepository.getEquipmentById(id);
};

/**
 * Create new equipment
 */
export const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Equipment> => {
  return equipmentRepository.createEquipment(equipmentData);
};

/**
 * Update equipment
 */
export const updateEquipment = async (id: string, equipmentData: Partial<Equipment>): Promise<Equipment | null> => {
  return equipmentRepository.updateEquipment(id, equipmentData);
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id: string): Promise<boolean> => {
  return equipmentRepository.deleteEquipment(id);
};
