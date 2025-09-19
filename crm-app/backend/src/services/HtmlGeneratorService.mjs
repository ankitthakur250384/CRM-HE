/**
 * HTML Generator Service for Enhanced Template System
 * Works with frontend-compatible template structure
 */

class HTMLGeneratorService {
  constructor() {
    this.defaultStyles = {
      body: 'font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #2c2c2c;',
      header: 'text-align: center; border-bottom: 3px solid #0052CC; padding-bottom: 15px; margin-bottom: 25px; color: #1a1a1a;',
      section: 'margin-bottom: 25px; color: #2c2c2c;',
      table: 'width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;',
      th: 'background-color: #f8f9fa; border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600; color: #1a1a1a;',
      td: 'border: 1px solid #ddd; padding: 10px; color: #2c2c2c;',
      totals: 'background-color: #f8f9fa; font-weight: bold; color: #1a1a1a;'
    };
  }

  /**
   * Generate HTML from Enhanced Template and data
   * This is a simplified version that returns the template structure
   * The actual rendering is handled by the frontend template renderer
   */
  async generateHTML(template, quotationData) {
    try {
      console.log('🎨 Generating HTML from Enhanced Template:', template.name);
      
      if (!template || !template.elements) {
        throw new Error('Invalid template: missing elements');
      }

      // Return a simple success response
      // The frontend will handle the actual HTML generation using professionalTemplateRenderer.ts
      const htmlResponse = {
        success: true,
        template: template,
        quotationData: quotationData,
        message: 'Template structure ready for frontend rendering'
      };
      
      console.log('✅ Template structure prepared for frontend rendering');
      return JSON.stringify(htmlResponse);
      
    } catch (error) {
      console.error('❌ Error preparing template:', error);
      throw error;
    }
  }

  /**
   * Basic fallback HTML generation for backend-only scenarios
   */
  async generateBasicHTML(template, quotationData) {
    try {
      const sections = [];
      
      // Generate basic HTML sections
      if (template.elements && Array.isArray(template.elements)) {
        for (const element of template.elements) {
          if (element.visible !== false) {
            const section = this.renderBasicElement(element, quotationData);
            if (section) {
              sections.push(section);
            }
          }
        }
      }

      // Wrap in basic HTML document
      const fullHTML = this.wrapInBasicHTML(sections, template, quotationData);
      
      console.log('✅ Basic HTML generated successfully');
      return fullHTML;
      
    } catch (error) {
      console.error('❌ Error generating basic HTML:', error);
      throw error;
    }
  }

  /**
   * Render basic element for fallback HTML
   */
  renderBasicElement(element, quotationData) {
    switch (element.type) {
      case 'header':
        return `
          <div class="header" style="${this.defaultStyles.header}">
            <h1 style="margin: 0; color: #0052CC; font-size: 32px; font-weight: bold;">ASP CRANES</h1>
            <h2 style="margin: 8px 0 0 0; font-size: 18px; font-weight: normal; color: #2c2c2c;">Professional Equipment Solutions</h2>
          </div>
        `;
        
      case 'customer':
        return `
          <div class="customer-info" style="${this.defaultStyles.section}">
            <h3 style="color: #1a1a1a; margin-bottom: 15px; font-size: 18px;">Bill To:</h3>
            <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 8px; font-size: 16px;">${quotationData.customer?.name || quotationData.client?.name || 'Valued Customer'}</div>
            ${quotationData.customer?.company || quotationData.client?.company ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Company: ${quotationData.customer?.company || quotationData.client?.company}</div>` : ''}
            ${quotationData.customer?.address || quotationData.client?.address ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Address: ${quotationData.customer?.address || quotationData.client?.address}</div>` : ''}
            ${quotationData.customer?.phone || quotationData.client?.phone ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Phone: ${quotationData.customer?.phone || quotationData.client?.phone}</div>` : ''}
            ${quotationData.customer?.email || quotationData.client?.email ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Email: ${quotationData.customer?.email || quotationData.client?.email}</div>` : ''}
          </div>
        `;
        
      case 'field':
        return `
          <div class="quotation-details" style="${this.defaultStyles.section}">
            <div style="color: #1a1a1a; font-weight: 600; margin-bottom: 8px;">Quotation #: ${quotationData.quotation_number || quotationData.id || 'Q-' + Date.now()}</div>
            <div style="color: #2c2c2c; margin-bottom: 6px;">Date: ${quotationData.created_at ? new Date(quotationData.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div style="color: #2c2c2c; margin-bottom: 6px;">Valid Until: ${quotationData.valid_until ? new Date(quotationData.valid_until).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
          </div>
        `;
        
      case 'table':
        return this.renderBasicTable(quotationData);
        
      case 'total':
        return this.renderBasicTotals(quotationData);
        
      default:
        return `<div class="unknown-element">Element: ${element.type}</div>`;
    }
  }

  /**
   * Render basic table
   */
  renderBasicTable(quotationData) {
    const items = quotationData.items || [];
    
    if (items.length === 0) {
      return `
        <div class="items-table" style="${this.defaultStyles.section}">
          <p>No items found in quotation.</p>
        </div>
      `;
    }

    return `
      <div class="items-table" style="${this.defaultStyles.section}">
        <table style="${this.defaultStyles.table}">
          <thead>
            <tr>
              <th style="${this.defaultStyles.th}">Description</th>
              <th style="${this.defaultStyles.th}">Quantity</th>
              <th style="${this.defaultStyles.th}">Unit Price</th>
              <th style="${this.defaultStyles.th}">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="${this.defaultStyles.td}">${item.description || 'Item'}</td>
                <td style="${this.defaultStyles.td}">${item.quantity || 1}</td>
                <td style="${this.defaultStyles.td}">₹${item.unit_price || 0}</td>
                <td style="${this.defaultStyles.td}">₹${item.total || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render basic totals
   */
  renderBasicTotals(quotationData) {
    const total = quotationData.total_amount || 0;
    const taxRate = quotationData.tax_rate || 18;
    const subtotal = total / (1 + taxRate / 100);
    const tax = total - subtotal;

    return `
      <div class="totals" style="${this.defaultStyles.section}">
        <div style="text-align: right;">
          <div>Subtotal: ₹${subtotal.toFixed(2)}</div>
          <div>Tax (${taxRate}%): ₹${tax.toFixed(2)}</div>
          <div style="font-weight: bold; font-size: 18px;">Total: ₹${total.toFixed(2)}</div>
        </div>
      </div>
    `;
  }

  /**
   * Wrap sections in basic HTML document
   */
  wrapInBasicHTML(sections, template, quotationData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation - ${template.name}</title>
    <style>
        body { ${this.defaultStyles.body} }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    ${sections.join('\n')}
</body>
</html>
    `.trim();
  }
}

// Create singleton instance
export const htmlGeneratorService = new HTMLGeneratorService();