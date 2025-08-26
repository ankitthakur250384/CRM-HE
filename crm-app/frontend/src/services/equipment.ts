import { getHeaders } from './apiHeaders';
// Update equipment by ID via backend API
export async function updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<Equipment> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment/${equipmentId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(true), 'Content-Type': 'application/json' },
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
    headers: getHeaders(true),
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
    headers: { ...getHeaders(true), 'Content-Type': 'application/json' },
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
  const url = `${apiUrl}/equipment?category=${encodeURIComponent(category)}`;

  console.log('🔍 Fetching equipment by category:', category);
  console.log('🔗 API URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
    credentials: 'include',
  });

  console.log('📡 Response status:', response.status);
  console.log('📡 Response ok:', response.ok);

  if (!response.ok) {
    console.error('❌ Failed to fetch equipment:', response.status, response.statusText);
    throw new Error('Failed to fetch equipment by category');
  }

  const data = await response.json();
  console.log('📦 Equipment data received:', data);

  // Unwrap { data: equipment[] } or return equipment[] directly
  if (data && Array.isArray(data.data)) return data.data;
  return data;
}
// Get all equipment from backend API
export async function getEquipment(): Promise<Equipment[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment`, {
    method: 'GET',
    headers: getHeaders(false),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch equipment');
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data : (data.equipment || []);
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