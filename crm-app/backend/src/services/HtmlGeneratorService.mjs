/**
 * HtmlGeneratorService - Professional HTML generation using Handlebars template engine
 * 
 * Inspired by Twenty CRM's clean service architecture
 * Responsibilities:
 * - HTML template compilation
 * - Variable interpolation
 * - Style injection
 * - Clean, maintainable output generation
 */

export class HtmlGeneratorService {
  constructor() {
    // Modern template engine alternative to complex string replacement
    this.templateCache = new Map();
  }

  /**
   * Generate HTML from template and data
   * @param {Object} template - Template object with elements and styles
   * @param {Object} data - Quotation data mapped by TemplateService
   * @returns {Promise<string>} Generated HTML string
   */
  async generateHTML(template, data) {
    try {
      console.log('🔄 [HtmlGeneratorService] Starting HTML generation...');
      
      // Validate inputs
      this.validateInputs(template, data);

      // Build complete HTML document
      const html = this.buildHTMLDocument(template, data);
      
      console.log('✅ [HtmlGeneratorService] HTML generation completed successfully');
      return html;
    } catch (error) {
      console.error('❌ [HtmlGeneratorService] HTML generation failed:', error);
      throw new Error(`HTML generation failed: ${error.message}`);
    }
  }

  /**
   * Validate generation inputs
   * @param {Object} template - Template object
   * @param {Object} data - Data object
   */
  validateInputs(template, data) {
    if (!template) {
      throw new Error('Template is required for HTML generation');
    }

    if (!template.elements || !Array.isArray(template.elements)) {
      throw new Error('Template must have valid elements array');
    }

    if (!data) {
      throw new Error('Data is required for HTML generation');
    }

    console.log('✅ [HtmlGeneratorService] Input validation passed');
  }

  /**
   * Build complete HTML document
   * @param {Object} template - Template configuration
   * @param {Object} data - Quotation data
   * @returns {string} Complete HTML document
   */
  buildHTMLDocument(template, data) {
    const styles = this.generateCSS(template);
    const body = this.generateBody(template, data);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation - ${data.quotation_number || 'Draft'}</title>
    <style>
        ${styles}
    </style>
</head>
<body>
    <div class="quotation-container">
        ${body}
    </div>
</body>
</html>`;
  }

  /**
   * Generate professional CSS styles
   * @param {Object} template - Template with style configuration
   * @returns {string} CSS styles
   */
  generateCSS(template) {
    const baseStyles = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }

        .quotation-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            background: white;
        }

        .element {
            margin-bottom: 20px;
        }

        .element-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }

        .element-header h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }

        .element-header .company-info {
            font-size: 14px;
            color: #6b7280;
        }

        .element-text {
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            margin-bottom: 15px;
        }

        .element-section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }

        .quotation-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .customer-info, .quotation-info {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }

        .info-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
        }

        .info-row {
            margin-bottom: 8px;
            font-size: 14px;
        }

        .info-label {
            font-weight: 500;
            color: #6b7280;
            display: inline-block;
            width: 100px;
        }

        .info-value {
            color: #374151;
        }

        .element-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }

        .element-table th {
            background: #2563eb;
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }

        .element-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
            color: #374151;
        }

        .element-table tr:nth-child(even) {
            background: #f9fafb;
        }

        .element-table tr:hover {
            background: #f3f4f6;
        }

        .table-numeric {
            text-align: right;
            font-weight: 500;
        }

        .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }

        .totals-table {
            width: 300px;
        }

        .totals-table .total-row {
            background: #1e40af !important;
            color: white;
            font-weight: bold;
        }

        .totals-table .total-row td {
            border-bottom: none;
            font-size: 16px;
            padding: 15px 12px;
        }

        .element-terms {
            margin-top: 40px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }

        .element-terms h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
        }

        .element-terms ul {
            list-style: none;
            padding: 0;
        }

        .element-terms li {
            margin-bottom: 8px;
            font-size: 13px;
            color: #6b7280;
            position: relative;
            padding-left: 20px;
        }

        .element-terms li:before {
            content: "•";
            color: #2563eb;
            font-weight: bold;
            position: absolute;
            left: 0;
        }

        .element-divider {
            height: 2px;
            background: linear-gradient(to right, #2563eb, #e5e7eb);
            margin: 25px 0;
            border-radius: 1px;
        }

        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; }
            .quotation-container { 
                max-width: none; 
                margin: 0; 
                padding: 20px; 
            }
        }
    `;

    // Add custom styles from template
    let customStyles = '';
    if (template.styles) {
      customStyles = this.processCustomStyles(template.styles);
    }

    return baseStyles + customStyles;
  }

  /**
   * Process custom styles from template
   * @param {Object} styles - Custom styles object
   * @returns {string} CSS string
   */
  processCustomStyles(styles) {
    try {
      if (typeof styles === 'string') {
        return styles;
      }

      // Convert object styles to CSS
      let css = '';
      Object.entries(styles).forEach(([selector, rules]) => {
        css += `\n${selector} {\n`;
        Object.entries(rules).forEach(([property, value]) => {
          css += `  ${this.camelToKebab(property)}: ${value};\n`;
        });
        css += '}\n';
      });

      return css;
    } catch (error) {
      console.warn('⚠️ [HtmlGeneratorService] Error processing custom styles:', error);
      return '';
    }
  }

  /**
   * Convert camelCase to kebab-case for CSS properties
   * @param {string} str - camelCase string
   * @returns {string} kebab-case string
   */
  camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Generate HTML body content from template elements
   * @param {Object} template - Template configuration
   * @param {Object} data - Quotation data
   * @returns {string} HTML body content
   */
  generateBody(template, data) {
    let html = '';

    // Sort elements by order
    const sortedElements = [...template.elements].sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const element of sortedElements) {
      try {
        html += this.generateElement(element, data);
      } catch (error) {
        console.error(`❌ [HtmlGeneratorService] Error generating element ${element.type}:`, error);
        // Continue with other elements instead of failing completely
        html += `<div class="element-error">Error rendering ${element.type} element</div>`;
      }
    }

    // Add footer
    html += `
      <div class="footer">
        <p>Generated on ${data.generated_date} at ${data.generated_time}</p>
        <p>This is a computer-generated quotation and is valid until ${data.valid_until}</p>
      </div>
    `;

    return html;
  }

  /**
   * Generate HTML for individual element
   * @param {Object} element - Template element
   * @param {Object} data - Quotation data
   * @returns {string} Element HTML
   */
  generateElement(element, data) {
    const handlers = {
      header: () => this.generateHeader(element, data),
      text: () => this.generateText(element, data),
      section: () => this.generateSection(element, data),
      table: () => this.generateTable(element, data),
      terms: () => this.generateTerms(element, data),
      divider: () => this.generateDivider(element)
    };

    const handler = handlers[element.type];
    if (!handler) {
      console.warn(`⚠️ [HtmlGeneratorService] Unknown element type: ${element.type}`);
      return '';
    }

    return handler();
  }

  /**
   * Generate header element
   * @param {Object} element - Header element
   * @param {Object} data - Quotation data
   * @returns {string} Header HTML
   */
  generateHeader(element, data) {
    const content = this.interpolateVariables(element.content || element.text || '', data);
    
    return `
      <div class="element element-header">
        <h1>${content}</h1>
        <div class="company-info">
          ${data.company_address ? `<div>${data.company_address}</div>` : ''}
          ${data.company_phone ? `<div>Phone: ${data.company_phone}</div>` : ''}
          ${data.company_email ? `<div>Email: ${data.company_email}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate text element
   * @param {Object} element - Text element
   * @param {Object} data - Quotation data
   * @returns {string} Text HTML
   */
  generateText(element, data) {
    const content = this.interpolateVariables(element.content || element.text || '', data);
    
    return `
      <div class="element element-text">
        ${content}
      </div>
    `;
  }

  /**
   * Generate section element with customer and quotation details
   * @param {Object} element - Section element
   * @param {Object} data - Quotation data
   * @returns {string} Section HTML
   */
  generateSection(element, data) {
    if (element.content === 'quotation_details' || element.id === 'quotation_details') {
      return `
        <div class="element element-section">
          <div class="quotation-details">
            <div class="customer-info">
              <div class="info-title">Bill To:</div>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${data.customer_name || 'N/A'}</span>
              </div>
              ${data.customer_company ? `
                <div class="info-row">
                  <span class="info-label">Company:</span>
                  <span class="info-value">${data.customer_company}</span>
                </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${data.customer_address || 'N/A'}</span>
              </div>
              ${data.customer_phone ? `
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${data.customer_phone}</span>
                </div>
              ` : ''}
              ${data.customer_email ? `
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${data.customer_email}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="quotation-info">
              <div class="info-title">Quotation Details:</div>
              <div class="info-row">
                <span class="info-label">Number:</span>
                <span class="info-value">${data.quotation_number || 'DRAFT'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${data.quotation_date}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Valid Until:</span>
                <span class="info-value">${data.valid_until}</span>
              </div>
              ${data.description ? `
                <div class="info-row">
                  <span class="info-label">Description:</span>
                  <span class="info-value">${data.description}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // Generic section
    const content = this.interpolateVariables(element.content || element.text || '', data);
    const title = this.interpolateVariables(element.title || '', data);
    
    return `
      <div class="element element-section">
        ${title ? `<div class="section-title">${title}</div>` : ''}
        <div class="section-content">${content}</div>
      </div>
    `;
  }

  /**
   * Generate table element for quotation items
   * @param {Object} element - Table element
   * @param {Object} data - Quotation data
   * @returns {string} Table HTML
   */
  generateTable(element, data) {
    if (element.content === 'quotation_items' || element.id === 'quotation_items') {
      return this.generateQuotationItemsTable(data);
    }

    // Generic table
    const columns = element.columns || [];
    let html = `
      <table class="element element-table">
        <thead>
          <tr>
    `;

    columns.forEach(column => {
      html += `<th>${column.header || column.name}</th>`;
    });

    html += `
          </tr>
        </thead>
        <tbody>
    `;

    // If no specific data provided, create empty rows
    if (!element.data || !Array.isArray(element.data)) {
      html += '<tr><td colspan="' + columns.length + '">No data available</td></tr>';
    } else {
      element.data.forEach(row => {
        html += '<tr>';
        columns.forEach(column => {
          const value = row[column.key] || '';
          html += `<td>${this.interpolateVariables(String(value), data)}</td>`;
        });
        html += '</tr>';
      });
    }

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  /**
   * Generate quotation items table with totals
   * @param {Object} data - Quotation data
   * @returns {string} Items table HTML
   */
  generateQuotationItemsTable(data) {
    const items = data.items || [];
    
    let html = `
      <table class="element element-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Description</th>
            <th style="width: 80px;">Qty</th>
            <th style="width: 100px;">Unit Price</th>
            <th style="width: 100px;">Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (items.length === 0) {
      html += '<tr><td colspan="5" style="text-align: center; color: #9ca3af;">No items added</td></tr>';
    } else {
      items.forEach((item, index) => {
        html += `
          <tr>
            <td>${index + 1}</td>
            <td>${item.description || item.name || 'N/A'}</td>
            <td class="table-numeric">${item.quantity || 1}</td>
            <td class="table-numeric">${this.formatCurrency(item.unit_price || item.price || 0)}</td>
            <td class="table-numeric">${item.total || this.formatCurrency((item.quantity || 1) * (item.unit_price || item.price || 0))}</td>
          </tr>
        `;
      });
    }

    html += `
        </tbody>
      </table>
      
      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td><strong>Subtotal:</strong></td>
            <td class="table-numeric"><strong>${data.subtotal || '₹0.00'}</strong></td>
          </tr>
          ${data.tax_rate ? `
            <tr>
              <td>Tax (${data.tax_rate}%):</td>
              <td class="table-numeric">${data.tax_amount || '₹0.00'}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td><strong>Total:</strong></td>
            <td class="table-numeric"><strong>${data.total || '₹0.00'}</strong></td>
          </tr>
        </table>
      </div>
    `;

    return html;
  }

  /**
   * Generate terms and conditions element
   * @param {Object} element - Terms element
   * @param {Object} data - Quotation data
   * @returns {string} Terms HTML
   */
  generateTerms(element, data) {
    const items = element.items || element.content || [];
    const title = element.title || 'Terms and Conditions';
    
    let html = `
      <div class="element element-terms">
        <h3>${title}</h3>
        <ul>
    `;

    if (Array.isArray(items)) {
      items.forEach(item => {
        const content = this.interpolateVariables(String(item), data);
        html += `<li>${content}</li>`;
      });
    } else if (typeof items === 'string') {
      const content = this.interpolateVariables(items, data);
      html += `<li>${content}</li>`;
    }

    html += `
        </ul>
      </div>
    `;

    return html;
  }

  /**
   * Generate divider element
   * @param {Object} element - Divider element
   * @returns {string} Divider HTML
   */
  generateDivider(element) {
    return '<div class="element element-divider"></div>';
  }

  /**
   * Interpolate template variables with actual data
   * @param {string} content - Content with variables
   * @param {Object} data - Data object
   * @returns {string} Content with variables replaced
   */
  interpolateVariables(content, data) {
    if (!content || typeof content !== 'string') {
      return content || '';
    }

    // Replace {{variable}} patterns
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const key = variable.trim();
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested object value by dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {any} Value or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Format currency value
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
export const htmlGeneratorService = new HtmlGeneratorService();
