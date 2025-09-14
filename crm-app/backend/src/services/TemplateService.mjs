/**
 * TemplateService - Professional template management following Twenty CRM patterns
 * 
 * Responsibilities:
 * - Template retrieval and validation
 * - Template schema processing
 * - Data mapping and transformation
 * - Business logic separation
 */
import { dbPool } from '../lib/dbConnection.js';

export class TemplateService {
  constructor() {
    this.dbPool = dbPool;
  }

  /**
   * Get default template with comprehensive validation
   * @returns {Promise<Object>} Template object with processed elements
   */
  async getDefaultTemplate() {
    try {
      const query = `
        SELECT 
          id,
          name,
          description,
          elements,
          styles,
          layout,
          is_default,
          created_at,
          updated_at
        FROM quotation_templates 
        WHERE is_default = true 
        AND deleted_at IS NULL
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const result = await this.dbPool.query(query);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('No default template found. Please configure a default template first.');
      }

      const template = result.rows[0];
      
      // Validate template structure
      this.validateTemplate(template);
      
      // Process and normalize template elements
      template.elements = this.processTemplateElements(template.elements);
      
      return template;
    } catch (error) {
      console.error('❌ [TemplateService] Error fetching default template:', error);
      throw new Error(`Template retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get template by ID with validation
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Template object
   */
  async getTemplateById(templateId) {
    try {
      const query = `
        SELECT 
          id,
          name,
          description,
          elements,
          styles,
          layout,
          is_default,
          created_at,
          updated_at
        FROM quotation_templates 
        WHERE id = $1 
        AND deleted_at IS NULL
      `;
      
      const result = await this.dbPool.query(query, [templateId]);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      const template = result.rows[0];
      this.validateTemplate(template);
      template.elements = this.processTemplateElements(template.elements);
      
      return template;
    } catch (error) {
      console.error('❌ [TemplateService] Error fetching template by ID:', error);
      throw new Error(`Template retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get all available templates
   * @returns {Promise<Array>} Array of template objects
   */
  async getAllTemplates() {
    try {
      const query = `
        SELECT 
          id,
          name,
          description,
          is_default,
          created_at,
          updated_at
        FROM quotation_templates 
        WHERE deleted_at IS NULL
        ORDER BY is_default DESC, updated_at DESC
      `;
      
      const result = await this.dbPool.query(query);
      return result.rows || [];
    } catch (error) {
      console.error('❌ [TemplateService] Error fetching all templates:', error);
      throw new Error(`Templates retrieval failed: ${error.message}`);
    }
  }

  /**
   * Validate template structure and required fields
   * @param {Object} template - Template object to validate
   * @throws {Error} If template is invalid
   */
  validateTemplate(template) {
    if (!template) {
      throw new Error('Template is null or undefined');
    }

    // Check required fields
    const requiredFields = ['id', 'name', 'elements'];
    for (const field of requiredFields) {
      if (!template[field]) {
        throw new Error(`Template missing required field: ${field}`);
      }
    }

    // Validate elements structure
    if (!Array.isArray(template.elements)) {
      throw new Error('Template elements must be an array');
    }

    if (template.elements.length === 0) {
      throw new Error('Template must have at least one element');
    }

    // Validate each element
    template.elements.forEach((element, index) => {
      this.validateTemplateElement(element, index);
    });

    console.log(`✅ [TemplateService] Template validation passed: ${template.name}`);
  }

  /**
   * Validate individual template element
   * @param {Object} element - Template element to validate
   * @param {number} index - Element index for error reporting
   */
  validateTemplateElement(element, index) {
    if (!element || typeof element !== 'object') {
      throw new Error(`Element at index ${index} is not a valid object`);
    }

    if (!element.type) {
      throw new Error(`Element at index ${index} missing required 'type' field`);
    }

    const validTypes = ['header', 'text', 'table', 'terms', 'section', 'divider'];
    if (!validTypes.includes(element.type)) {
      throw new Error(`Element at index ${index} has invalid type: ${element.type}`);
    }

    // Type-specific validation
    switch (element.type) {
      case 'header':
      case 'text':
        if (!element.content && !element.text) {
          throw new Error(`${element.type} element at index ${index} must have content or text`);
        }
        break;
      
      case 'table':
        if (!element.columns || !Array.isArray(element.columns)) {
          throw new Error(`Table element at index ${index} must have columns array`);
        }
        break;
      
      case 'terms':
        if (!element.items || !Array.isArray(element.items)) {
          throw new Error(`Terms element at index ${index} must have items array`);
        }
        break;
    }
  }

  /**
   * Process and normalize template elements
   * @param {Array} elements - Raw template elements
   * @returns {Array} Processed template elements
   */
  processTemplateElements(elements) {
    if (!Array.isArray(elements)) {
      console.warn('⚠️ [TemplateService] Elements is not an array, attempting to parse...');
      try {
        elements = typeof elements === 'string' ? JSON.parse(elements) : elements;
      } catch (error) {
        throw new Error('Invalid elements format - cannot parse JSON');
      }
    }

    return elements.map((element, index) => {
      try {
        // Ensure element has required properties
        const processedElement = {
          type: element.type,
          id: element.id || `element_${index}`,
          order: element.order || index,
          ...element
        };

        // Normalize content field
        if (element.text && !element.content) {
          processedElement.content = element.text;
        }

        // Add default styles if missing
        if (!processedElement.styles) {
          processedElement.styles = this.getDefaultElementStyles(element.type);
        }

        return processedElement;
      } catch (error) {
        console.error(`❌ [TemplateService] Error processing element at index ${index}:`, error);
        throw new Error(`Element processing failed at index ${index}: ${error.message}`);
      }
    });
  }

  /**
   * Get default styles for element type
   * @param {string} type - Element type
   * @returns {Object} Default styles
   */
  getDefaultElementStyles(type) {
    const defaultStyles = {
      header: {
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '20px',
        color: '#2563eb'
      },
      text: {
        fontSize: '14px',
        lineHeight: '1.5',
        marginBottom: '10px',
        color: '#374151'
      },
      table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
        fontSize: '12px'
      },
      terms: {
        fontSize: '12px',
        lineHeight: '1.4',
        marginTop: '20px',
        color: '#6b7280'
      },
      section: {
        marginBottom: '15px',
        padding: '10px 0'
      },
      divider: {
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '15px 0'
      }
    };

    return defaultStyles[type] || {};
  }

  /**
   * Map quotation data to template variables
   * @param {Object} quotationData - Quotation data from database
   * @returns {Object} Mapped template variables
   */
  mapQuotationData(quotationData) {
    try {
      // Extract nested data safely
      const customer = quotationData.customer || {};
      const company = quotationData.company || {};
      const items = quotationData.items || [];

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = subtotal * (quotationData.tax_rate || 0) / 100;
      const total = subtotal + taxAmount;

      return {
        // Company information
        company_name: company.name || 'ASP Cranes',
        company_address: company.address || '',
        company_phone: company.phone || '',
        company_email: company.email || '',
        company_logo: company.logo || '',

        // Customer information
        customer_name: customer.name || '',
        customer_company: customer.company || '',
        customer_address: customer.address || '',
        customer_phone: customer.phone || '',
        customer_email: customer.email || '',

        // Quotation details
        quotation_number: quotationData.quotation_number || '',
        quotation_date: this.formatDate(quotationData.created_at),
        valid_until: this.formatDate(quotationData.valid_until),
        description: quotationData.description || '',

        // Financial data
        subtotal: this.formatCurrency(subtotal),
        tax_rate: quotationData.tax_rate || 0,
        tax_amount: this.formatCurrency(taxAmount),
        total: this.formatCurrency(total),

        // Items
        items: items.map((item, index) => ({
          ...item,
          serial: index + 1,
          total: this.formatCurrency(item.total || 0)
        })),

        // Metadata
        generated_date: this.formatDate(new Date()),
        generated_time: new Date().toLocaleTimeString()
      };
    } catch (error) {
      console.error('❌ [TemplateService] Error mapping quotation data:', error);
      throw new Error(`Data mapping failed: ${error.message}`);
    }
  }

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (!date) return '';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('⚠️ [TemplateService] Invalid date format:', date);
      return '';
    }
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₹0.00';
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}

// Export singleton instance
export const templateService = new TemplateService();
