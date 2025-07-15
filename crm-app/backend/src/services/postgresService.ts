import { 
  QuotationsRepository, 
  DealsRepository, 
  LeadsRepository,
  EquipmentRepository,
  JobsRepository,
  ConfigRepository
} from './postgres/repositories';

// Initialize repositories
const quotationsRepo = new QuotationsRepository();
const dealsRepo = new DealsRepository();
const leadsRepo = new LeadsRepository();
const equipmentRepo = new EquipmentRepository();
const jobsRepo = new JobsRepository();
const configRepo = new ConfigRepository();

// Re-export repository methods as service functions
// This keeps the API compatible with the existing Firestore service

// Quotation Service
export const getQuotations = async () => {
  return quotationsRepo.getAll();
};

export const getQuotationById = async (id: string) => {
  return quotationsRepo.getById(id);
};

export const createQuotation = async (quotationData: any) => {
  // Generate a unique ID if not provided
  const quotationId = quotationData.quotationId || crypto.randomUUID();
  
  // Shape the data with the proper ID field
  const quotationToSave = {
    ...quotationData,
    quotation_id: quotationId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Save the quotation
  return quotationsRepo.create(quotationToSave);
};

export const updateQuotation = async (id: string, updates: any) => {
  // Update timestamp
  const dataToUpdate = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  return quotationsRepo.update(id, dataToUpdate);
};

export const deleteQuotation = async (id: string) => {
  return quotationsRepo.delete(id);
};

export const getQuotationsByDeal = async (dealId: string) => {
  return quotationsRepo.getQuotationsByDeal(dealId);
};

// Deal Service
export const getDeals = async () => {
  return dealsRepo.getAll();
};

export const getDealById = async (id: string) => {
  return dealsRepo.getById(id);
};

export const createDeal = async (dealData: any) => {
  // Generate a unique ID if not provided
  const dealId = dealData.dealId || crypto.randomUUID();
  
  // Shape the data with the proper ID field
  const dealToSave = {
    ...dealData,
    deal_id: dealId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Save the deal
  return dealsRepo.create(dealToSave);
};

export const updateDeal = async (id: string, updates: any) => {
  // Update timestamp
  const dataToUpdate = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  return dealsRepo.update(id, dataToUpdate);
};

export const deleteDeal = async (id: string) => {
  return dealsRepo.delete(id);
};

export const getDealsByCustomer = async (customerId: string) => {
  return dealsRepo.getDealsByCustomer(customerId);
};

// Lead Service
export const getLeads = async () => {
  return leadsRepo.getAll();
};

export const getLeadById = async (id: string) => {
  return leadsRepo.getById(id);
};

export const createLead = async (leadData: any) => {
  // Generate a unique ID if not provided
  const leadId = leadData.leadId || crypto.randomUUID();
  
  // Shape the data with the proper ID field
  const leadToSave = {
    ...leadData,
    lead_id: leadId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Save the lead
  return leadsRepo.create(leadToSave);
};

export const updateLead = async (id: string, updates: any) => {
  // Update timestamp
  const dataToUpdate = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  return leadsRepo.update(id, dataToUpdate);
};

export const deleteLead = async (id: string) => {
  return leadsRepo.delete(id);
};

export const getLeadsByAssignee = async (assigneeId: string) => {
  return leadsRepo.getLeadsByAssignee(assigneeId);
};

// Equipment Service
export const getEquipment = async () => {
  return equipmentRepo.getAll();
};

export const getEquipmentById = async (id: string) => {
  return equipmentRepo.getById(id);
};

export const getAvailableEquipment = async () => {
  return equipmentRepo.getAvailableEquipment();
};

// Job Service
export const getJobs = async () => {
  return jobsRepo.getAll();
};

export const getJobById = async (id: string) => {
  return jobsRepo.getById(id);
};

export const getJobsByDateRange = async (startDate: Date, endDate: Date) => {
  return jobsRepo.getJobsByDateRange(startDate, endDate);
};

// Config Service
export const getQuotationConfig = async () => {
  return configRepo.getQuotationConfig();
};

export const updateQuotationConfig = async (configData: any) => {
  return configRepo.updateQuotationConfig(configData);
};
