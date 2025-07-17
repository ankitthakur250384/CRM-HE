import { getHeaders } from './apiHeaders';
// Update an existing quotation via backend API
export async function updateQuotation(quotationId: string, updates: Partial<Quotation>): Promise<Quotation> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/quotations/${quotationId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update quotation');
  }
  return response.json();
}
// Fetch a single quotation by ID from backend API
export async function getQuotationById(quotationId: string): Promise<Quotation> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/quotations/${quotationId}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch quotation by ID');
  }
  return response.json();
}
// Create a new quotation via backend API
export async function createQuotation(quotation: Partial<Quotation>): Promise<Quotation> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/quotations`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(quotation),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to create quotation');
  }
  return response.json();
}
// Fetch all quotations from backend API
export async function getQuotations(): Promise<Quotation[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/quotations`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch quotations');
  }
  const data = await response.json();
  // Support both array and {data: array} responses
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}
// Fetch quotations for a lead from backend API
export async function getQuotationsForLead(leadId: string): Promise<any[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/quotations?leadId=${encodeURIComponent(leadId)}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch quotations');
  return await res.json();
}
import { OrderType, BaseRates } from './equipment';

export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  designation?: string;
}

export type SundayWorking = 'yes' | 'no';

export interface QuotationInputs {
  machineType: string;
  selectedEquipment: {
    id: string;
    equipmentId: string;
    name: string;
    baseRates: BaseRates;
  };
  selectedMachines?: SelectedMachine[];
  orderType: OrderType;
  numberOfDays: number;
  workingHours: number;
  foodResources: number;
  accomResources: number;
  siteDistance: number;
  usage: 'normal' | 'heavy';
  riskFactor: 'low' | 'medium' | 'high';
  extraCharge: number;
  incidentalCharges: string[];  otherFactorsCharge: number;
  billing: 'gst' | 'non_gst';
  includeGst: boolean;
  shift: 'single' | 'double';
  dayNight: 'day' | 'night';
  mobDemob: number;
  mobRelaxation: number;
  runningCostPerKm: number;
  dealType: string;
  sundayWorking: SundayWorking;
  otherFactors: string[];
}

export interface SelectedMachine {
  id: string;
  machineType: string;
  equipmentId: string;
  name: string;
  baseRates: BaseRates;
  baseRate: number;
  runningCostPerKm: number;
  quantity: number;
}

export interface Quotation extends QuotationInputs {
  id: string;
  dealId?: string;  // Add dealId to support quotations from deals
  leadId?: string;  // Make leadId optional since we might have quotations from deals instead
  customerId: string;
  customerName: string;
  customerContact: CustomerContact;
  selectedMachines?: SelectedMachine[];
  totalRent: number;
  workingCost?: number;
  mobDemobCost?: number;
  foodAccomCost?: number;
  usageLoadFactor?: number;
  extraCharges?: number;
  riskAdjustment?: number;
  gstAmount?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}