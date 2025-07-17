import { getHeaders } from './apiHeaders';

// Get all deals from the backend API
export async function getDeals(): Promise<Deal[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/deals`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch deals');
  const data = await res.json();
  // Support both array and {data: array} responses
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// Get a deal by its ID from the backend API
export async function getDealById(dealId: string): Promise<Deal> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/deals/${dealId}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch deal by ID');
  }
  return response.json();
}

// Create a deal via backend API
export async function createDeal(deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/deals`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(deal),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create deal');
  return await res.json();
}

// Update the stage of a deal by ID via backend API
export async function updateDealStage(dealId: string, stage: DealStage): Promise<Deal> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/deals/${dealId}/stage`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update deal stage');
  }
  const result = await response.json();
  return result.data || result;
}

// API client object for deal-related functions
export const dealApiClient = {
  getDeals,
  getDealById,
  createDeal,
  updateDealStage,
};
export type DealStage = 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  leadId: string;
  customerId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    designation?: string;
  };
  title: string;
  description: string;
  value: number;
  stage: DealStage;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  assignedTo: string;
  assignedToName?: string;
  probability: number;
  expectedCloseDate: string;
  notes?: string;
}