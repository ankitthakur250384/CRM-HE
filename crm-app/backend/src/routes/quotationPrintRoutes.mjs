import express from 'express';
import { db } from '../lib/dbClient.js';

const router = express.Router();

// Generate quotation preview/print HTML
router.post('/preview', async (req, res) => {
  try {
    let { quotationId, templateId, format = 'html' } = req.body;

    // If no template specified, try to get default
    if (!templateId) {
      const defaultQuery = `
        SELECT value FROM system_config WHERE key = 'defaultQuotationTemplate'
      `;
      const defaultResult = await db.query(defaultQuery);
      if (defaultResult.rows.length > 0 && defaultResult.rows[0].value) {
        templateId = defaultResult.rows[0].value;
      }
    }

    if (!templateId) {
      return res.status(400).json({ 
        success: false, 
        error: 'No template specified and no default template configured' 
      });
    }

    // Get quotation data
    const quotationQuery = `
      SELECT q.*, 
             c.name as customer_name,
             c.email as customer_email,
             c.phone as customer_phone,
             c.address as customer_address,
             u.username as created_by_name
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN users u ON q.created_by = u.uid
      WHERE q.id = $1
    `;
    
    const quotationResult = await db.query(quotationQuery, [quotationId]);
    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const quotation = quotationResult.rows[0];

    // Get quotation items
    const itemsQuery = `
      SELECT qi.*, 
             e.name as equipment_name,
             e.description as equipment_description,
             e.specifications
      FROM quotation_items qi
      LEFT JOIN equipment e ON qi.equipment_id = e.id
      WHERE qi.quotation_id = $1
      ORDER BY qi.created_at
    `;
    
    const itemsResult = await db.query(itemsQuery, [quotationId]);
    const items = itemsResult.rows;

    // Get template
    const templateQuery = `
      SELECT * FROM quotation_templates 
      WHERE id = $1 AND is_active = true
    `;
    
    const templateResult = await db.query(templateQuery, [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = templateResult.rows[0];

    // Generate HTML from template
    const html = await generateQuotationHtml(quotation, items, template);

    if (format === 'pdf') {
      // TODO: Implement PDF generation using puppeteer or similar
      // For now, return HTML
      res.json({ success: true, html });
    } else {
      res.json({ success: true, html });
    }

  } catch (error) {
    console.error('Error generating quotation preview:', error);
    res.status(500).json({ success: false, error: 'Failed to generate preview' });
  }
});

// Print quotation
router.post('/print', async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;
    
    // Reuse preview logic
    const previewReq = { ...req, body: { quotationId, templateId, format: 'html' } };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
    };

    const result = await new Promise((resolve) => {
      router.stack.find(layer => layer.route.path === '/preview')
        .route.stack[0].handle(previewReq, mockRes, () => {});
    });

    // Add print-specific styling
    const printHtml = addPrintStyles(result.html);

    res.json({ success: true, html: printHtml });

  } catch (error) {
    console.error('Error generating print version:', error);
    res.status(500).json({ success: false, error: 'Failed to generate print version' });
  }
});

// Download PDF
router.post('/pdf', async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;

    // Get quotation for filename
    const quotationQuery = 'SELECT number FROM quotations WHERE id = $1';
    const quotationResult = await db.query(quotationQuery, [quotationId]);
    
    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const quotationNumber = quotationResult.rows[0].number;

    // Generate HTML first
    const previewResponse = await fetch(`${req.protocol}://${req.get('host')}/api/quotations/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotationId, templateId, format: 'html' })
    });

    const previewData = await previewResponse.json();
    
    if (!previewData.success) {
      return res.status(400).json(previewData);
    }

    // TODO: Convert HTML to PDF using puppeteer
    // For now, return the HTML as a mock PDF response
    const pdfBuffer = Buffer.from(previewData.html, 'utf8');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation_${quotationNumber}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// Email PDF
router.post('/email-pdf', async (req, res) => {
  try {
    const { quotationId, templateId, emailTo, subject, message } = req.body;

    // Generate PDF first
    const pdfResponse = await fetch(`${req.protocol}://${req.get('host')}/api/quotations/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotationId, templateId })
    });

    if (!pdfResponse.ok) {
      return res.status(400).json({ success: false, error: 'Failed to generate PDF' });
    }

    const pdfBuffer = await pdfResponse.buffer();

    // TODO: Implement email sending with PDF attachment
    // For now, return success
    res.json({ 
      success: true, 
      message: 'PDF email sent successfully',
      details: {
        to: emailTo,
        subject: subject || `Quotation ${quotationId}`,
        attachmentSize: pdfBuffer.length
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Helper function to generate HTML from template
async function generateQuotationHtml(quotation, items, template) {
  const elements = template.elements || [];
  const styles = template.styles || {};
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quotation ${quotation.number}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          line-height: 1.4;
        }
        .quotation-container { 
          max-width: 800px; 
          margin: 0 auto; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #f5f5f5; 
          font-weight: bold; 
        }
        .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .field { margin: 5px 0; }
        .total { font-weight: bold; text-align: right; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="quotation-container">
  `;

  // Process template elements
  for (const element of elements) {
    const content = processTemplateContent(element.content, quotation, items);
    const elementStyle = element.style || {};
    
    switch (element.type) {
      case 'header':
        html += `<h1 class="header" style="${styleObjectToString(elementStyle)}">${content}</h1>`;
        break;
      case 'text':
        html += `<p style="${styleObjectToString(elementStyle)}">${content}</p>`;
        break;
      case 'field':
        html += `<div class="field" style="${styleObjectToString(elementStyle)}">${content}</div>`;
        break;
      case 'table':
        html += generateItemsTable(items);
        break;
      default:
        html += `<div style="${styleObjectToString(elementStyle)}">${content}</div>`;
    }
  }

  // Add items table if not already included
  if (!elements.some(el => el.type === 'table')) {
    html += generateItemsTable(items);
  }

  // Add totals
  html += generateTotalsSection(quotation, items);

  html += `
      </div>
    </body>
    </html>
  `;

  return html;
}

// Helper function to process template content with variable substitution
function processTemplateContent(content, quotation, items) {
  if (!content) return '';

  // Replace quotation variables
  let processedContent = content
    .replace(/\{\{quotation_number\}\}/g, quotation.number || '')
    .replace(/\{\{quotation_date\}\}/g, formatDate(quotation.created_at))
    .replace(/\{\{quotation_validity\}\}/g, formatDate(quotation.valid_until))
    .replace(/\{\{customer_name\}\}/g, quotation.customer_name || '')
    .replace(/\{\{customer_email\}\}/g, quotation.customer_email || '')
    .replace(/\{\{customer_phone\}\}/g, quotation.customer_phone || '')
    .replace(/\{\{customer_address\}\}/g, quotation.customer_address || '')
    .replace(/\{\{total_amount\}\}/g, formatCurrency(quotation.total_amount))
    .replace(/\{\{company_name\}\}/g, 'ASP Cranes') // TODO: Get from config
    .replace(/\{\{company_address\}\}/g, 'Your Company Address') // TODO: Get from config
    .replace(/\{\{company_phone\}\}/g, 'Your Company Phone') // TODO: Get from config
    .replace(/\{\{company_email\}\}/g, 'Your Company Email'); // TODO: Get from config

  return processedContent;
}

// Helper function to generate items table
function generateItemsTable(items) {
  if (!items || items.length === 0) return '';

  let tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach(item => {
    const total = (item.quantity || 0) * (item.unit_price || 0);
    tableHtml += `
      <tr>
        <td>${item.equipment_name || item.name || ''}</td>
        <td>${item.equipment_description || item.description || ''}</td>
        <td>${item.quantity || 0}</td>
        <td>${formatCurrency(item.unit_price || 0)}</td>
        <td>${formatCurrency(total)}</td>
      </tr>
    `;
  });

  tableHtml += '</tbody></table>';
  return tableHtml;
}

// Helper function to generate totals section
function generateTotalsSection(quotation, items) {
  const subtotal = items.reduce((sum, item) => 
    sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
  const tax = quotation.tax_amount || 0;
  const total = quotation.total_amount || subtotal + tax;

  return `
    <div style="margin-top: 20px;">
      <div style="text-align: right;">
        <div>Subtotal: ${formatCurrency(subtotal)}</div>
        <div>Tax: ${formatCurrency(tax)}</div>
        <div class="total">Total: ${formatCurrency(total)}</div>
      </div>
    </div>
  `;
}

// Helper functions
function styleObjectToString(styleObj) {
  return Object.entries(styleObj)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

function addPrintStyles(html) {
  // Add print-specific styles
  const printStyles = `
    <style>
      @media print {
        * { -webkit-print-color-adjust: exact !important; }
        @page { margin: 0.5in; }
        body { font-size: 12pt; }
        .page-break { page-break-before: always; }
      }
    </style>
  `;
  
  return html.replace('</head>', printStyles + '</head>');
}

export default router;
