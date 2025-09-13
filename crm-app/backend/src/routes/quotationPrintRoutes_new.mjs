import express from 'express';
import { db } from '../lib/dbClient.js';
import { authenticateToken } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// GET /api/quotations/preview/:id - Preview quotation with template
router.get('/preview/:id', authenticateToken, async (req, res) => {
  try {
    const { id: quotationId } = req.params;
    const { templateId } = req.query;

    console.log('📋 Preview request:', { quotationId, templateId });

    // Get quotation data
    const quotation = await getQuotationById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    // Get template (default if not specified)
    const template = await getTemplateForRendering(templateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Generate HTML
    const html = await generateQuotationHTML(quotation, template);

    res.json({
      success: true,
      html,
      templateUsed: template.id,
      quotationId
    });

  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate preview' });
  }
});

// POST /api/quotations/print - Print quotation with template
router.post('/print', authenticateToken, async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;

    console.log('🖨️ Print request:', { quotationId, templateId });

    if (!quotationId) {
      return res.status(400).json({ success: false, error: 'Quotation ID is required' });
    }

    // Get quotation data
    const quotation = await getQuotationById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    // Get template (default if not specified)
    const template = await getTemplateForRendering(templateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Generate HTML with print styles
    const html = await generateQuotationHTML(quotation, template, true);

    // Update template usage count
    await updateTemplateUsage(template.id);

    res.json({
      success: true,
      html,
      templateUsed: template.id,
      quotationId
    });

  } catch (error) {
    console.error('❌ Print error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate print version' });
  }
});

// Helper function to get quotation by ID
async function getQuotationById(id) {
  try {
    const result = await db.oneOrNone('SELECT * FROM quotations WHERE id = $1', [id]);
    return result;
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return null;
  }
}

// Helper function to get template for rendering
async function getTemplateForRendering(templateId) {
  try {
    let template;
    
    if (templateId) {
      // Get specific template
      template = await db.oneOrNone(
        'SELECT * FROM quotation_templates WHERE id = $1 AND is_active = true',
        [templateId]
      );
    } else {
      // Get default template
      template = await db.oneOrNone(
        'SELECT * FROM quotation_templates WHERE is_default = true AND is_active = true ORDER BY created_at DESC LIMIT 1'
      );
    }

    return template;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

// Helper function to update template usage count
async function updateTemplateUsage(templateId) {
  try {
    await db.none(
      'UPDATE quotation_templates SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [templateId]
    );
  } catch (error) {
    console.error('Error updating template usage:', error);
  }
}

// Main function to generate quotation HTML
async function generateQuotationHTML(quotation, template, forPrint = false) {
  const printStyles = forPrint ? `
    <style>
      @media print {
        body { margin: 0; padding: 20px; }
        .no-print { display: none !important; }
      }
      @page {
        size: A4;
        margin: 1cm;
      }
    </style>
  ` : '';

  const baseStyles = `
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .quotation-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #1e40af;
        padding-bottom: 20px;
      }
      .company-name {
        font-size: 28px;
        font-weight: bold;
        color: #1e40af;
        margin-bottom: 10px;
      }
      .quotation-title {
        font-size: 20px;
        color: #666;
        margin-bottom: 10px;
      }
      .quotation-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 30px 0;
      }
      .info-section {
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
      .info-section h3 {
        margin-top: 0;
        color: #1e40af;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
      }
      .info-row {
        display: flex;
        margin-bottom: 8px;
      }
      .info-label {
        font-weight: bold;
        min-width: 120px;
        color: #555;
      }
      .info-value {
        flex: 1;
      }
      .quotation-table {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .quotation-table th,
      .quotation-table td {
        border: 1px solid #ddd;
        padding: 12px 8px;
        text-align: left;
      }
      .quotation-table th {
        background-color: #1e40af;
        color: white;
        font-weight: bold;
      }
      .quotation-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .quotation-table tr:hover {
        background-color: #f0f8ff;
      }
      .total-section {
        margin-top: 30px;
        text-align: right;
        border-top: 2px solid #1e40af;
        padding-top: 20px;
      }
      .total-amount {
        font-size: 24px;
        font-weight: bold;
        color: #1e40af;
      }
      .terms-section {
        margin-top: 40px;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
        border-left: 4px solid #1e40af;
      }
      .terms-title {
        font-size: 18px;
        font-weight: bold;
        color: #1e40af;
        margin-bottom: 15px;
      }
      .terms-content {
        white-space: pre-line;
        line-height: 1.5;
      }
      .template-element {
        margin: 15px 0;
      }
      .template-text {
        margin: 10px 0;
        line-height: 1.6;
      }
      .template-heading {
        color: #1e40af;
        margin: 20px 0 10px 0;
      }
      .template-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .template-table th,
      .template-table td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
      }
      .template-table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
    </style>
  `;

  let htmlContent = '';

  // Check if template has elements (template builder format)
  if (template.elements && Array.isArray(template.elements) && template.elements.length > 0) {
    console.log('🎨 Rendering template builder format');
    htmlContent = renderTemplateBuilderElements(template.elements, quotation);
  } 
  // Check if template has content (simple HTML format)
  else if (template.content && template.content.trim()) {
    console.log('📝 Rendering simple HTML format');
    htmlContent = replaceVariablesInContent(template.content, quotation);
  }
  // Fallback to default quotation format
  else {
    console.log('🔄 Using fallback default format');
    htmlContent = generateDefaultQuotationHTML(quotation);
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quotation ${quotation.id} - ASP Cranes</title>
      ${baseStyles}
      ${printStyles}
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
}

// Render template builder elements
function renderTemplateBuilderElements(elements, quotation) {
  if (!elements || !Array.isArray(elements)) {
    return '<p>No template elements found</p>';
  }

  return elements.map(element => {
    const style = element.style || {};
    const styleStr = Object.entries(style)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');

    switch (element.type) {
      case 'header':
        return `<div class="template-element" style="${styleStr}">
          <h1 class="template-heading">${replaceVariables(element.content, quotation)}</h1>
        </div>`;

      case 'text':
        const textContent = replaceVariables(element.content, quotation)
          .replace(/\n/g, '<br>');
        return `<div class="template-element template-text" style="${styleStr}">
          ${textContent}
        </div>`;

      case 'table':
        return renderTableElement(element, quotation, styleStr);

      case 'terms':
        const termsContent = replaceVariables(element.content, quotation);
        return `<div class="template-element terms-section" style="${styleStr}">
          <div class="terms-title">Terms & Conditions</div>
          <div class="terms-content">${termsContent}</div>
        </div>`;

      default:
        return `<div class="template-element" style="${styleStr}">
          ${replaceVariables(element.content || '', quotation)}
        </div>`;
    }
  }).join('\n');
}

// Render table element with proper structure
function renderTableElement(element, quotation, styleStr) {
  if (!element.config || !element.config.rows || !Array.isArray(element.config.rows)) {
    return `<div class="template-element" style="${styleStr}">Table configuration missing</div>`;
  }

  const { rows, columns, showHeader, columnWidths } = element.config;
  let tableHtml = `<div class="template-element" style="${styleStr}">
    <table class="template-table quotation-table">`;

  // Add header if configured
  if (showHeader && columns && Array.isArray(columns)) {
    tableHtml += '<thead><tr>';
    columns.forEach((col, index) => {
      const width = columnWidths && columnWidths[index] ? `width: ${columnWidths[index]};` : '';
      tableHtml += `<th style="${width}">${col}</th>`;
    });
    tableHtml += '</tr></thead>';
  }

  // Add rows
  tableHtml += '<tbody>';
  rows.forEach((row, rowIndex) => {
    if (Array.isArray(row)) {
      tableHtml += '<tr>';
      row.forEach((cell, cellIndex) => {
        const width = columnWidths && columnWidths[cellIndex] ? `width: ${columnWidths[cellIndex]};` : '';
        const cellContent = replaceVariables(String(cell), quotation);
        tableHtml += `<td style="${width}">${cellContent}</td>`;
      });
      tableHtml += '</tr>';
    }
  });
  tableHtml += '</tbody></table></div>';

  return tableHtml;
}

// Replace variables in content
function replaceVariables(content, quotation) {
  if (!content || typeof content !== 'string') return '';

  const variables = {
    '{{customer_name}}': quotation.customer_name || 'N/A',
    '{{customer_email}}': quotation.customer_email || 'N/A',
    '{{customer_phone}}': quotation.customer_phone || 'N/A',
    '{{customer_address}}': quotation.customer_address || 'N/A',
    '{{quotation_id}}': quotation.id || 'N/A',
    '{{quotation_number}}': quotation.id || 'N/A',
    '{{machine_type}}': quotation.machine_type || 'N/A',
    '{{order_type}}': quotation.order_type || 'N/A',
    '{{number_of_days}}': quotation.number_of_days || 'N/A',
    '{{working_hours}}': quotation.working_hours || 'N/A',
    '{{total_cost}}': quotation.total_cost ? `₹${Number(quotation.total_cost).toLocaleString('en-IN')}` : 'N/A',
    '{{total_amount}}': quotation.total_cost ? `₹${Number(quotation.total_cost).toLocaleString('en-IN')}` : 'N/A',
    '{{created_date}}': quotation.created_at ? new Date(quotation.created_at).toLocaleDateString('en-IN') : 'N/A',
    '{{quotation_date}}': quotation.created_at ? new Date(quotation.created_at).toLocaleDateString('en-IN') : 'N/A',
    '{{site_distance}}': quotation.site_distance || 'N/A',
    '{{usage}}': quotation.usage || 'N/A',
    '{{shift}}': quotation.shift || 'N/A',
    '{{food_resources}}': quotation.food_resources || 'N/A',
    // Table-specific variables
    '{{item_name}}': quotation.machine_type || 'Mobile Crane',
    '{{item_capacity}}': quotation.machine_type || 'N/A',
    '{{item_duration}}': quotation.number_of_days ? `${quotation.number_of_days} days` : 'N/A',
    '{{item_rate}}': quotation.total_cost ? `₹${Number(quotation.total_cost).toLocaleString('en-IN')}` : 'N/A',
    '{{item_amount}}': quotation.total_cost ? `₹${Number(quotation.total_cost).toLocaleString('en-IN')}` : 'N/A',
    // Company info
    '{{company_name}}': 'ASP Cranes',
    '{{company_address}}': 'Professional Crane Services & Equipment Rental',
    '{{company_phone}}': '+91-XXXXXXXXXX',
    '{{company_email}}': 'info@aspcranes.com'
  };

  let result = content;
  for (const [variable, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

// Replace variables in simple content
function replaceVariablesInContent(content, quotation) {
  return replaceVariables(content, quotation);
}

// Generate default quotation HTML when no template is available
function generateDefaultQuotationHTML(quotation) {
  return `
    <div class="quotation-header">
      <div class="company-name">ASP CRANES</div>
      <div class="quotation-title">QUOTATION</div>
      <div>Quotation ID: ${quotation.id}</div>
      <div>Date: ${new Date(quotation.created_at).toLocaleDateString('en-IN')}</div>
    </div>

    <div class="quotation-info">
      <div class="info-section">
        <h3>Customer Details</h3>
        <div class="info-row">
          <span class="info-label">Company:</span>
          <span class="info-value">${quotation.customer_name || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${quotation.customer_email || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value">${quotation.customer_phone || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Address:</span>
          <span class="info-value">${quotation.customer_address || 'N/A'}</span>
        </div>
      </div>

      <div class="info-section">
        <h3>Project Details</h3>
        <div class="info-row">
          <span class="info-label">Equipment:</span>
          <span class="info-value">${quotation.machine_type || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration:</span>
          <span class="info-value">${quotation.number_of_days || 'N/A'} days</span>
        </div>
        <div class="info-row">
          <span class="info-label">Working Hours:</span>
          <span class="info-value">${quotation.working_hours || 'N/A'}/day</span>
        </div>
        <div class="info-row">
          <span class="info-label">Order Type:</span>
          <span class="info-value">${quotation.order_type || 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="total-section">
      <div class="total-amount">
        Total Amount: ${quotation.total_cost ? `₹${Number(quotation.total_cost).toLocaleString('en-IN')}` : 'N/A'}
      </div>
    </div>
  `;
}

export default router;
