/**
 * Template Service for Quotation Printing
 * Bridges quotation printing to Enhanced Template System
 */

import { Client } from 'pg';

class TemplateService {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    };
  }

  /**
   * Get all templates from Enhanced Template System
   */
  async getAllTemplates() {
    const client = new Client(this.dbConfig);
    await client.connect();
    
    try {
      const query = `
        SELECT 
          id, name, description, theme, category, elements, settings, branding,
          is_default as "isDefault", is_active as "isActive",
          created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
        FROM enhanced_templates 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
    } finally {
      await client.end();
    }
  }

  /**
   * Get template by ID from Enhanced Template System
   */
  async getTemplateById(templateId) {
    const client = new Client(this.dbConfig);
    await client.connect();
    
    try {
      const query = `
        SELECT 
          id, name, description, theme, category, elements, settings, branding,
          is_default as "isDefault", is_active as "isActive",
          created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
        FROM enhanced_templates 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await client.query(query, [templateId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  /**
   * Get default template from Enhanced Template System
   */
  async getDefaultTemplate() {
    const client = new Client(this.dbConfig);
    await client.connect();
    
    try {
      // First try to get the template marked as default
      let query = `
        SELECT 
          id, name, description, theme, category, elements, settings, branding,
          is_default as "isDefault", is_active as "isActive",
          created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
        FROM enhanced_templates 
        WHERE is_default = true AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      
      let result = await client.query(query);
      
      // If no default template, create one
      if (result.rows.length === 0) {
        await this.ensureDefaultTemplate(client);
        result = await client.query(query);
      }
      
      // If still no template, get any active template
      if (result.rows.length === 0) {
        query = `
          SELECT 
            id, name, description, theme, category, elements, settings, branding,
            is_default as "isDefault", is_active as "isActive",
            created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
          FROM enhanced_templates 
          WHERE is_active = true
          ORDER BY updated_at DESC
          LIMIT 1
        `;
        
        result = await client.query(query);
      }
      
      if (result.rows.length === 0) {
        throw new Error('No templates available');
      }
      
      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  /**
   * Ensure default template exists
   */
  async ensureDefaultTemplate(client) {
    try {
      const checkQuery = `SELECT id FROM enhanced_templates WHERE id = 'tpl_default_001'`;
      const checkResult = await client.query(checkQuery);
      
      if (checkResult.rows.length === 0) {
        console.log('🔧 Creating default template for printing...');
        
        const defaultElements = [
          {
            "id": "header-1",
            "type": "header",
            "content": "ASP CRANES - Professional Equipment Solutions",
            "visible": true,
            "style": {"fontSize": "24px", "color": "#0052CC", "textAlign": "center"}
          },
          {
            "id": "customer-info-1",
            "type": "customer",
            "content": "Bill To Information",
            "visible": true,
            "style": {"fontSize": "14px"}
          },
          {
            "id": "quotation-details-1",
            "type": "field",
            "content": "Quotation Details - Generated automatically",
            "visible": true,
            "style": {"fontSize": "14px"}
          },
          {
            "id": "items-table-1",
            "type": "table",
            "content": "Equipment and Services",
            "visible": true,
            "style": {}
          },
          {
            "id": "totals-1",
            "type": "total",
            "content": "Cost Summary",
            "visible": true,
            "style": {}
          }
        ];
        
        const insertQuery = `
          INSERT INTO enhanced_templates (
            id, name, description, theme, category, is_default, is_active, 
            created_by, elements, settings, branding
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        
        await client.query(insertQuery, [
          'tpl_default_001',
          'Default ASP Cranes Template',
          'Standard quotation template for ASP Cranes',
          'MODERN',
          'Quotation',
          true,
          true,
          'system',
          JSON.stringify(defaultElements),
          JSON.stringify({"pageSize": "A4", "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}}),
          JSON.stringify({"primaryColor": "#0052CC", "secondaryColor": "#1f2937", "logoUrl": null})
        ]);
        
        console.log('✅ Default template created for printing');
      }
    } catch (error) {
      console.error('⚠️ Error ensuring default template:', error);
    }
  }

  /**
   * Map quotation data for template rendering
   */
  mapQuotationData(quotationData) {
    console.log('🗺️ [TemplateService] Mapping quotation data:', {
      customerName: quotationData.customerName,
      customerContact: quotationData.customerContact,
      hasCustomerData: !!(quotationData.customerName || quotationData.customerContact?.name)
    });
    
    // Extract customer information with fallbacks
    const customerName = quotationData.customerContact?.name || quotationData.customer_name || quotationData.customerName || 'ABC Construction';
    const companyName = quotationData.customerContact?.company || quotationData.customer_company || quotationData.customerName || 'ABC Construction';
    const customerEmail = quotationData.customerContact?.email || quotationData.customer_email || quotationData.email || 'info@abcconstruction.com';
    const customerPhone = quotationData.customerContact?.phone || quotationData.customer_phone || quotationData.phone || '+91 98765 43210';
    const customerAddress = quotationData.customerContact?.address || quotationData.customer_address || quotationData.address || 'Mumbai, Maharashtra';
    
    return {
      company: {
        name: "ASP CRANES",
        address: "Industrial Area, Pune, Maharashtra 411019",
        phone: "+91 99999 88888",
        email: "sales@aspcranes.com",
        website: "www.aspcranes.com"
      },
      // Support both formats for customer data
      customer: {
        name: customerName,
        company: companyName,
        address: customerAddress,
        contact: customerName,
        phone: customerPhone,
        email: customerEmail
      },
      // Enhanced template format (client instead of customer)
      client: {
        name: customerName,
        company: companyName,
        address: customerAddress,
        phone: customerPhone,
        email: customerEmail
      },
      quotation: {
        number: quotationData.quotation_number || quotationData.id || `QTN-${Date.now()}`,
        date: new Date().toLocaleDateString('en-IN'),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
        items: [
          {
            description: quotationData.selectedEquipment?.name || quotationData.machine_type || 'Equipment Rental',
            quantity: quotationData.numberOfDays || quotationData.number_of_days || 1,
            unit: 'Days',
            rate: quotationData.selectedEquipment?.baseRates?.[quotationData.orderType] || quotationData.daily_rate || 5000,
            amount: quotationData.totalRent || quotationData.total_cost || quotationData.total_amount || 50000
          }
        ],
        subtotal: quotationData.totalRent || quotationData.total_cost || quotationData.total_amount || 50000,
        tax: (quotationData.totalRent || quotationData.total_cost || quotationData.total_amount || 50000) * 0.18,
        total: (quotationData.totalRent || quotationData.total_cost || quotationData.total_amount || 50000) * 1.18
      }
    };
  }
}

// Create singleton instance
export const templateService = new TemplateService();