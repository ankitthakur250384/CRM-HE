/**
 * HTML Generator Service for Enhanced Template System
 * Works with frontend-compatible template structure
 */

class HTMLGeneratorService {
  constructor() {
    this.defaultStyles = {
      body: 'font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4;',
      header: 'text-align: center; border-bottom: 2px solid #0052CC; padding-bottom: 10px; margin-bottom: 20px;',
      section: 'margin-bottom: 20px;',
      table: 'width: 100%; border-collapse: collapse; margin: 10px 0;',
      th: 'background-color: #f8f9fa; border: 1px solid #ddd; padding: 8px; text-align: left;',
      td: 'border: 1px solid #ddd; padding: 8px;',
      totals: 'background-color: #f8f9fa; font-weight: bold;'
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
            <h1 style="margin: 0; color: #0052CC;">ASP CRANES</h1>
            <h2 style="margin: 5px 0 0 0; font-size: 16px; font-weight: normal;">Professional Equipment Solutions</h2>
          </div>
        `;
        
      case 'customer':
        return `
          <div class="customer-info" style="${this.defaultStyles.section}">
            <h3>Bill To:</h3>
            <div><strong>${quotationData.customerName || 'Valued Customer'}</strong></div>
            <div>Contact: ${quotationData.customerContact?.name || 'N/A'}</div>
            <div>Address: ${quotationData.customerContact?.address || 'N/A'}</div>
            <div>Phone: ${quotationData.customerContact?.phone || 'N/A'}</div>
          </div>
        `;
        
      case 'field':
        return `
          <div class="quotation-details" style="${this.defaultStyles.section}">
            <div>Quotation #: ${quotationData.id || 'Q-' + Date.now()}</div>
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
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
    const equipment = quotationData.selectedEquipment || {};
    const baseRate = equipment.baseRates?.[quotationData.orderType] || 0;
    const days = quotationData.numberOfDays || 1;
    const total = baseRate * days;

    return `
      <div class="items-table" style="${this.defaultStyles.section}">
        <table style="${this.defaultStyles.table}">
          <thead>
            <tr>
              <th style="${this.defaultStyles.th}">Description</th>
              <th style="${this.defaultStyles.th}">Quantity</th>
              <th style="${this.defaultStyles.th}">Unit</th>
              <th style="${this.defaultStyles.th}">Rate</th>
              <th style="${this.defaultStyles.th}">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${this.defaultStyles.td}">${equipment.name || 'Equipment Rental'}</td>
              <td style="${this.defaultStyles.td}">${days}</td>
              <td style="${this.defaultStyles.td}">Days</td>
              <td style="${this.defaultStyles.td}">₹${baseRate.toLocaleString()}</td>
              <td style="${this.defaultStyles.td}">₹${total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render basic totals
   */
  renderBasicTotals(quotationData) {
    const subtotal = quotationData.totalRent || 0;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return `
      <div class="totals" style="${this.defaultStyles.section}">
        <div style="text-align: right;">
          <div>Subtotal: ₹${subtotal.toLocaleString()}</div>
          <div>Tax (18%): ₹${tax.toLocaleString()}</div>
          <div style="font-weight: bold; font-size: 18px;">Total: ₹${total.toLocaleString()}</div>
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