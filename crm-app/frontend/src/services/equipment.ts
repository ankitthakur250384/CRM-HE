import { getHeaders } from './apiHeaders';
// Update equipment by ID via backend API
export async function updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<Equipment> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment/${equipmentId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update equipment');
  }
  return response.json();
}
// Delete equipment by ID via backend API
export async function deleteEquipment(equipmentId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment/${equipmentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete equipment');
  }
}
// Create a new equipment via backend API
export async function createEquipment(equipment: Partial<Equipment>): Promise<Equipment> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(equipment),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to create equipment');
  }
  return response.json();
}
// Get equipment by category from backend API
export async function getEquipmentByCategory(category: string): Promise<Equipment[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment?category=${encodeURIComponent(category)}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch equipment by category');
  }
  return response.json();
}
// Stub/mock for frontend: getEquipment
export async function getEquipment(): Promise<Equipment[]> {
  // TODO: Replace with real API call
  return [
    {
      id: '1',
      equipmentId: 'EQ0001',
      name: 'Demo Crane',
      category: 'mobile_crane',
      manufacturingDate: '2022-01',
      registrationDate: '2022-02',
      maxLiftingCapacity: 50,
      unladenWeight: 20,
      baseRates: { micro: 100, small: 200, monthly: 3000, yearly: 35000 },
      runningCostPerKm: 10,
      description: 'Sample equipment',
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runningCost: 0,
      _source: 'client',
      _mockFlag: true,
    },
  ];
}
export type CraneCategory = 'mobile_crane' | 'tower_crane' | 'crawler_crane' | 'pick_and_carry_crane';

export type OrderType = 'micro' | 'small' | 'monthly' | 'yearly';

export interface BaseRates {
  micro: number;
  small: number;
  monthly: number;
  yearly: number;
}

export interface Equipment {
  id: string;
  equipmentId: string; // Format: EQ0001, EQ0002, etc.
  name: string;
  category: CraneCategory;
  manufacturingDate: string; // YYYY-MM format
  registrationDate: string; // YYYY-MM format
  maxLiftingCapacity: number; // in tons
  unladenWeight: number; // in tons
  baseRates: BaseRates; // rates per hour for different order types
  runningCostPerKm: number;
  description?: string;
  status: 'available' | 'in_use' | 'maintenance';
  createdAt: string;
  updatedAt: string;
  runningCost: number;
  
  // Development fields for tracking data source
  _source?: 'api' | 'schema' | 'client';
  _mockFlag?: boolean;
}