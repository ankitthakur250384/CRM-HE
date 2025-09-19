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
      customerName: quotationData.customer?.name,
      hasCustomerData: !!(quotationData.customer?.name),
      totalAmount: quotationData.total_amount,
      itemsCount: quotationData.items?.length || 0
    });
    
    // Extract customer information from correct data structure
    const customerName = quotationData.customer?.name || 'ABC Construction';
    const companyName = quotationData.customer?.company || quotationData.customer?.name || 'ABC Construction';
    const customerEmail = quotationData.customer?.email || 'info@abcconstruction.com';
    const customerPhone = quotationData.customer?.phone || '+91 98765 43210';
    const customerAddress = quotationData.customer?.address || 'Mumbai, Maharashtra';
    
    // Process quotation items
    const items = quotationData.items || [];
    const processedItems = items.map(item => ({
      description: item.description || 'Equipment Rental',
      quantity: item.quantity || 1,
      unit: 'Each',
      rate: item.unit_price || 0,
      amount: item.total || 0
    }));
    
    // If no items, create a default item
    if (processedItems.length === 0) {
      processedItems.push({
        description: 'Equipment Rental',
        quantity: 1,
        unit: 'Days',
        rate: 5000,
        amount: 5000
      });
    }
    
    const totalAmount = quotationData.total_amount || 0;
    const taxRate = quotationData.tax_rate || 18;
    const subtotal = totalAmount / (1 + taxRate / 100);
    const tax = totalAmount - subtotal;
    
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
        date: quotationData.created_at ? new Date(quotationData.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
        validUntil: quotationData.valid_until ? new Date(quotationData.valid_until).toLocaleDateString('en-IN') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
        items: processedItems,
        subtotal: subtotal,
        tax: tax,
        total: totalAmount
      },
      // Legacy support
      items: processedItems,
      total_amount: totalAmount,
      quotation_number: quotationData.quotation_number
    };
  }
}

// Create singleton instance
export const templateService = new TemplateService();