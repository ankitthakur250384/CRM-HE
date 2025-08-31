/**
 * ASP Cranes CRM API Tools for Agent Integration
 * Provides standardized API access for all agents
 */
import axios from 'axios';

// Configuration
const CRM_CONFIG = {
  baseURL: process.env.ASP_CRM_BASE_URL || 'http://103.224.243.242:3001/api',
  timeout: parseInt(process.env.ASP_CRM_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Special headers for leads endpoint
const LEADS_HEADERS = {
  ...CRM_CONFIG.headers,
  [process.env.LEADS_BYPASS_HEADER || 'X-bypass-Auth']: process.env.LEADS_BYPASS_VALUE || 'true'
};

/**
 * Base CRM Tool class
 */
export class BaseCRMTool {
  constructor(endpoint, requiresBypass = false) {
    this.endpoint = endpoint;
    this.baseURL = CRM_CONFIG.baseURL;
    this.timeout = CRM_CONFIG.timeout;
    this.headers = requiresBypass ? LEADS_HEADERS : CRM_CONFIG.headers;
    
    console.log(`🔧 Initialized CRM Tool for ${endpoint} (bypass: ${requiresBypass})`);
  }

  /**
   * Make HTTP request with error handling
   */
  async makeRequest(method, path = '', data = null, customHeaders = {}) {
    const url = `${this.baseURL}${this.endpoint}${path}`;
    const headers = { ...this.headers, ...customHeaders };
    
    console.log(`📡 ${method.toUpperCase()} ${url}`);
    
    try {
      const config = {
        method,
        url,
        headers,
        timeout: this.timeout
      };
      
      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.data = data;
        console.log(`📤 Request data:`, JSON.stringify(data, null, 2));
      }
      
      const response = await axios(config);
      console.log(`✅ ${method.toUpperCase()} ${url} - Status: ${response.status}`);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
      
    } catch (error) {
      console.error(`❌ ${method.toUpperCase()} ${url} - Error:`, error.message);
      
      if (error.response) {
        console.error(`Response Status: ${error.response.status}`);
        console.error(`Response Data:`, error.response.data);
        
        return {
          success: false,
          error: error.response.data,
          status: error.response.status,
          message: error.message
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Network error - server unreachable',
          message: error.message,
          code: 'NETWORK_ERROR'
        };
      } else {
        return {
          success: false,
          error: 'Request configuration error',
          message: error.message,
          code: 'CONFIG_ERROR'
        };
      }
    }
  }

  // CRUD Operations
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = queryString ? `?${queryString}` : '';
    return await this.makeRequest('GET', path);
  }

  async getById(id) {
    return await this.makeRequest('GET', `/${id}`);
  }

  async create(data) {
    return await this.makeRequest('POST', '', data);
  }

  async update(id, data) {
    return await this.makeRequest('PUT', `/${id}`, data);
  }

  async delete(id) {
    return await this.makeRequest('DELETE', `/${id}`);
  }

  async search(searchParams) {
    return await this.makeRequest('GET', '/search', null, {}, searchParams);
  }
}

/**
 * Lead Management API Tool
 */
export class LeadManagementTool extends BaseCRMTool {
  constructor() {
    super('/leads', true); // Requires bypass authentication
    this.capabilities = ['lead_management', 'lead_crud', 'lead_analytics'];
    this.specializations = ['leads', 'prospect_management'];
  }

  /**
   * Convert camelCase to snake_case for database compatibility
   */
  convertToSnakeCase(data) {
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      switch (key) {
        case 'customerId':
          converted.customer_id = value;
          break;
        case 'customerName':
          converted.customer_name = value;
          break;
        case 'serviceNeeded':
          converted.service_needed = value;
          break;
        case 'siteLocation':
          converted.site_location = value;
          break;
        case 'startDate':
          converted.start_date = value;
          break;
        case 'rentalDays':
          converted.rental_days = value;
          break;
        case 'assignedTo':
          converted.assigned_to = value;
          break;
        default:
          converted[key] = value;
      }
    }
    return converted;
  }

  /**
   * Convert snake_case to camelCase for API response
   */
  convertToCamelCase(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.convertToCamelCase(item));
    }
    
    if (data && typeof data === 'object') {
      const converted = {};
      for (const [key, value] of Object.entries(data)) {
        switch (key) {
          case 'customer_id':
            converted.customerId = value;
            break;
          case 'customer_name':
            converted.customerName = value;
            break;
          case 'service_needed':
            converted.serviceNeeded = value;
            break;
          case 'site_location':
            converted.siteLocation = value;
            break;
          case 'start_date':
            converted.startDate = value;
            break;
          case 'rental_days':
            converted.rentalDays = value;
            break;
          case 'assigned_to':
            converted.assignedTo = value;
            break;
          default:
            converted[key] = value;
        }
      }
      return converted;
    }
    return data;
  }

  async create(leadData) {
    const convertedData = this.convertToSnakeCase(leadData);
    const result = await super.create(convertedData);
    
    if (result.success && result.data) {
      result.data = this.convertToCamelCase(result.data);
    }
    
    return result;
  }

  async update(id, leadData) {
    const convertedData = this.convertToSnakeCase(leadData);
    const result = await super.update(id, convertedData);
    
    if (result.success && result.data) {
      result.data = this.convertToCamelCase(result.data);
    }
    
    return result;
  }

  async getAll(params = {}) {
    const result = await super.getAll(params);
    
    if (result.success && result.data) {
      result.data = this.convertToCamelCase(result.data);
    }
    
    return result;
  }

  async getById(id) {
    const result = await super.getById(id);
    
    if (result.success && result.data) {
      result.data = this.convertToCamelCase(result.data);
    }
    
    return result;
  }

  async getByStatus(status) {
    return await this.getAll({ status });
  }

  async assignLead(leadId, userId) {
    return await this.update(leadId, { assignedTo: userId });
  }

  async updateStatus(leadId, status) {
    const validStatuses = ['new', 'in_process', 'qualified', 'unqualified', 'lost', 'converted'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    return await this.update(leadId, { status });
  }
}

/**
 * Deal Management API Tool
 */
export class DealManagementTool extends BaseCRMTool {
  constructor() {
    super('/deals', false); // No special authentication required
    this.capabilities = ['deal_management', 'deal_crud', 'revenue_forecasting'];
    this.specializations = ['deals', 'pipeline_management'];
  }

  async getDealsByStage(stage) {
    return await this.getAll({ stage });
  }

  async updateDealStage(dealId, stage) {
    return await this.update(dealId, { stage });
  }

  async getDealsByUser(userId) {
    return await this.getAll({ assigned_to: userId });
  }

  async getRevenueForecast(params = {}) {
    return await this.makeRequest('GET', '/forecast', null, {}, params);
  }
}

/**
 * Quotation Management API Tool
 */
export class QuotationManagementTool extends BaseCRMTool {
  constructor() {
    super('/quotations', false); // No special authentication required
    this.capabilities = ['quotation_management', 'quotation_crud', 'pricing_calculations'];
    this.specializations = ['quotations', 'proposals', 'pricing'];
  }

  async getQuotationsByStatus(status) {
    return await this.getAll({ status });
  }

  async updateQuotationStatus(quotationId, status) {
    return await this.update(quotationId, { status });
  }

  async calculatePricing(quotationData) {
    return await this.makeRequest('POST', '/calculate', quotationData);
  }

  async generateDocument(quotationId, format = 'pdf') {
    return await this.makeRequest('POST', `/${quotationId}/generate`, { format });
  }
}

/**
 * Customer Management API Tool
 */
export class CustomerManagementTool extends BaseCRMTool {
  constructor() {
    super('/customers', false); // No special authentication required
    this.capabilities = ['customer_management', 'customer_crud', 'customer_analytics'];
    this.specializations = ['customers', 'client_management'];
  }

  async searchCustomers(query) {
    return await this.getAll({ search: query });
  }

  async getCustomerHistory(customerId) {
    return await this.makeRequest('GET', `/${customerId}/history`);
  }
}

/**
 * CRM Integration Test Tool
 */
export class CRMTestTool {
  constructor() {
    this.tools = {
      leads: new LeadManagementTool(),
      deals: new DealManagementTool(),
      quotations: new QuotationManagementTool(),
      customers: new CustomerManagementTool()
    };
  }

  async testConnectivity() {
    console.log('🧪 Testing CRM API connectivity...');
    const results = {};
    
    for (const [toolName, tool] of Object.entries(this.tools)) {
      console.log(`Testing ${toolName} endpoint...`);
      try {
        const result = await tool.getAll();
        results[toolName] = {
          success: result.success,
          status: result.status,
          endpoint: tool.endpoint,
          message: result.success ? 'Connected successfully' : result.error
        };
      } catch (error) {
        results[toolName] = {
          success: false,
          endpoint: tool.endpoint,
          error: error.message
        };
      }
    }
    
    return results;
  }

  async testLeadsAuthentication() {
    console.log('🔐 Testing leads endpoint authentication...');
    const leadTool = this.tools.leads;
    
    // Test with bypass header
    const result = await leadTool.getAll();
    
    return {
      endpoint: '/api/leads',
      bypass_header: process.env.LEADS_BYPASS_HEADER || 'X-bypass-Auth',
      bypass_value: process.env.LEADS_BYPASS_VALUE || 'true',
      test_result: result
    };
  }
}

// Export tool instances
export const leadTool = new LeadManagementTool();
export const dealTool = new DealManagementTool();
export const quotationTool = new QuotationManagementTool();
export const customerTool = new CustomerManagementTool();
export const crmTestTool = new CRMTestTool();
