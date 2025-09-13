import express from 'express';
import { db } from '../lib/dbClient.js';
import { authenticateToken } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Generate quotation preview/print HTML
router.post('/preview', authenticateToken, async (req, res) => {
  try {
    let { quotationId, templateId, format = 'html' } = req.body;

    console.log('🔍 Preview request:', { quotationId, templateId, format });

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

    // If still no template, get the first available template
    if (!templateId) {
      const firstTemplateQuery = `
        SELECT id FROM quotation_templates 
        ORDER BY is_default DESC NULLS LAST, created_at DESC 
        LIMIT 1
      `;
      const firstTemplateResult = await db.query(firstTemplateQuery);
      if (firstTemplateResult.rows.length > 0) {
        templateId = firstTemplateResult.rows[0].id;
        console.log('📋 Using first available template:', templateId);
      }
    }

    if (!templateId) {
      return res.status(400).json({ 
        success: false, 
        error: 'No template specified and no templates available' 
      });
    }

    // Get comprehensive quotation data
    const quotationQuery = `
      SELECT q.*, 
             c.name as customer_name,
             c.email as customer_email,
             c.phone as customer_phone,
             c.address as customer_address,
             c.billing_address,
             u.username as created_by_name,
             u.email as created_by_email
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
    console.log('📄 Quotation data:', quotation.id, quotation.customer_name);

    // Get quotation machines/equipment
    const machinesQuery = `
      SELECT qm.*, 
             e.name as equipment_name,
             e.description as equipment_description,
             e.specifications,
             e.category as equipment_category
      FROM quotation_machines qm
      LEFT JOIN equipment e ON qm.equipment_id = e.id
      WHERE qm.quotation_id = $1
      ORDER BY qm.created_at
    `;
    
    const machinesResult = await db.query(machinesQuery, [quotationId]);
    const machines = machinesResult.rows;
    console.log('🏗️ Equipment count:', machines.length);

    // Get template
    const templateQuery = `
      SELECT * FROM quotation_templates 
      WHERE id = $1
    `;
    
    const templateResult = await db.query(templateQuery, [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = templateResult.rows[0];
    console.log('🎨 Template:', template.name);
    console.log('📄 Template content length:', template.content ? template.content.length : 0);
    console.log('🔍 Template content preview:', template.content ? template.content.substring(0, 200) + '...' : 'No content');

    // Generate HTML from template
    const html = await generateQuotationHtml(quotation, machines, template);

    if (format === 'pdf') {
      // TODO: Implement PDF generation using puppeteer or similar
      res.json({ success: true, html });
    } else {
      res.json({ success: true, html });
    }

  } catch (error) {
    console.error('❌ Error generating quotation preview:', error);
    res.status(500).json({ success: false, error: 'Failed to generate preview' });
  }
});

// Print quotation
router.post('/print', authenticateToken, async (req, res) => {
  try {
    let { quotationId, templateId } = req.body;
    
    console.log('🖨️ Print request:', { quotationId, templateId });

    if (!quotationId) {
      return res.status(400).json({ success: false, error: 'Quotation ID is required' });
    }

    // Get quotation
    const quotationQuery = 'SELECT * FROM quotations WHERE id = $1';
    const quotationResult = await db.query(quotationQuery, [quotationId]);
    
    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const quotation = quotationResult.rows[0];
    console.log('📋 Found quotation:', quotation.id);

    // If no template specified, get default template
    if (!templateId) {
      const defaultTemplateQuery = `
        SELECT * FROM quotation_templates 
        WHERE is_default = true 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const defaultTemplateResult = await db.query(defaultTemplateQuery);
      if (defaultTemplateResult.rows.length > 0) {
        templateId = defaultTemplateResult.rows[0].id;
        console.log('🎯 Using default template:', templateId);
      }
    }

    // Get machines for this quotation
    const machinesQuery = `
      SELECT qm.*,
             e.name as equipment_name,
             e.model,
             e.specifications,
             e.category as equipment_category
      FROM quotation_machines qm
      LEFT JOIN equipment e ON qm.equipment_id = e.id
      WHERE qm.quotation_id = $1
      ORDER BY qm.created_at
    `;
    
    const machinesResult = await db.query(machinesQuery, [quotationId]);
    const machines = machinesResult.rows;
    console.log('🏗️ Equipment count:', machines.length);

    // Get template
    const templateQuery = `
      SELECT * FROM quotation_templates 
      WHERE id = $1
    `;
    
    const templateResult = await db.query(templateQuery, [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = templateResult.rows[0];
    console.log('🎨 Template:', template.name);

    // Generate HTML from template
    const html = await generateQuotationHtml(quotation, machines, template);

    // Add print-specific styling
    const printHtml = addPrintStyles(html);

    res.json({ success: true, html: printHtml });

  } catch (error) {
    console.error('❌ Error generating print version:', error);
    res.status(500).json({ success: false, error: 'Failed to generate print version' });
  }
});

// Download PDF
router.post('/pdf', authenticateToken, async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;

    console.log('📄 PDF request:', { quotationId, templateId });

    // Get quotation for filename
    const quotationQuery = 'SELECT id, customer_name FROM quotations WHERE id = $1';
    const quotationResult = await db.query(quotationQuery, [quotationId]);
    
    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const quotation = quotationResult.rows[0];
    const filename = `quotation_${quotation.customer_name}_${quotation.id}`.replace(/[^a-zA-Z0-9]/g, '_');

    // Generate HTML first (calling our own preview endpoint)
    const previewBody = { quotationId, templateId, format: 'html' };
    
    // For now, return the HTML as a mock PDF response
    // TODO: Implement actual PDF generation with Puppeteer
    const mockRes = {
      data: null,
      json(data) { this.data = data; },
      status(code) { 
        return {
          json: (data) => { this.data = { ...data, statusCode: code }; }
        };
      }
    };

    await router.stack.find(layer => layer.route && layer.route.path === '/preview')
      ?.route.stack[0].handle({ body: previewBody }, mockRes, () => {});

    if (!mockRes.data || !mockRes.data.success) {
      throw new Error('Failed to generate HTML for PDF');
    }

    // For now, return HTML as text file (TODO: convert to actual PDF)
    const pdfBuffer = Buffer.from(mockRes.data.html, 'utf8');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// Email PDF
router.post('/email-pdf', authenticateToken, async (req, res) => {
  try {
    const { quotationId, templateId, emailTo, subject, message } = req.body;

    console.log('📧 Email request:', { quotationId, templateId, emailTo });

    // TODO: Implement email sending with PDF attachment
    res.json({ 
      success: true, 
      message: 'PDF email functionality not yet implemented',
      details: {
        to: emailTo,
        subject: subject || `Quotation ${quotationId}`,
        quotationId,
        templateId
      }
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Helper function to generate HTML from template
async function generateQuotationHtml(quotation, machines, template) {
  console.log('🔧 Generating HTML from template:', template.name);
  console.log('� Template content length:', template.content ? template.content.length : 0);
  console.log('🔧 Template elements count:', template.elements ? (Array.isArray(template.elements) ? template.elements.length : 'Not array') : 0);
  
  // First, try to use template content (HTML)
  if (template.content && template.content.trim().length > 0) {
    console.log('✅ Using template content (HTML)');
    let html = template.content;
    
    // Replace template variables with actual data
    const replacements = {
      // Company information
      '{{company.name}}': 'ASP Cranes',
      '{{company_name}}': 'ASP Cranes',
      '{{company.address}}': 'Professional Crane Services & Equipment Rental',
      '{{company_address}}': 'Professional Crane Services & Equipment Rental',
      '{{company.phone}}': '+91-XXXXXXXXXX',
      '{{company_phone}}': '+91-XXXXXXXXXX',
      '{{company.email}}': 'info@aspcranes.com',
      '{{company_email}}': 'info@aspcranes.com',
      '{{company.website}}': 'www.aspcranes.com',
      '{{company_website}}': 'www.aspcranes.com',
      '{{company_gst}}': 'GST123456789',
      
      // Quotation information
      '{{quotation.number}}': quotation.id || '',
      '{{quotation_number}}': quotation.id || '',
      '{{quotation.date}}': formatDate(quotation.created_at),
      '{{quotation_date}}': formatDate(quotation.created_at),
      '{{quotation.validity}}': quotation.validity || '30 days',
      '{{validity_period}}': quotation.validity || '30 days',
      '{{quotation.id}}': quotation.id || '',
      '{{valid_until}}': new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString(),
      '{{order_type}}': quotation.order_type || 'Equipment Rental',
      
      // Customer information
      '{{customer.name}}': quotation.customer_name || '',
      '{{customer_name}}': quotation.customer_name || '',
      '{{customer.company}}': quotation.customer_company || 'N/A',
      '{{customer_company}}': quotation.customer_company || 'N/A',
      '{{customer.email}}': quotation.customer_email || '',
      '{{customer_email}}': quotation.customer_email || '',
      '{{customer.phone}}': quotation.customer_phone || '',
      '{{customer_phone}}': quotation.customer_phone || '',
      '{{customer.address}}': quotation.customer_address || 'N/A',
      '{{customer_address}}': quotation.customer_address || 'N/A',
      '{{customer_designation}}': 'Manager',
      
      // Project details
      '{{project.equipment}}': quotation.machine_type || '',
      '{{equipment_name}}': quotation.machine_type || '',
      '{{project.duration}}': `${quotation.number_of_days} days`,
      '{{project_duration}}': `${quotation.number_of_days} days`,
      '{{project.workingHours}}': `${quotation.working_hours} hours/day`,
      '{{working_hours}}': `${quotation.working_hours} hours/day`,
      '{{project.totalHours}}': `${(quotation.number_of_days || 0) * (quotation.working_hours || 0)} hours`,
      '{{project.siteDistance}}': `${quotation.site_distance} km`,
      '{{project.usageType}}': quotation.usage || '',
      '{{project.riskFactor}}': quotation.risk_factor || '',
      '{{shift_type}}': quotation.shift || 'Single Shift',
      '{{base_rate}}': formatCurrency(quotation.working_cost || 0),
      
      // Cost information
      '{{cost.working}}': formatCurrency(quotation.working_cost || 0),
      '{{cost.transportation}}': formatCurrency(quotation.transportation_cost || 0),
      '{{cost.food}}': quotation.food_resources === 'Company will arrange' ? '₹NaN' : '₹0',
      '{{cost.subtotal}}': formatCurrency((quotation.working_cost || 0) + (quotation.transportation_cost || 0)),
      '{{subtotal}}': formatCurrency((quotation.working_cost || 0) + (quotation.transportation_cost || 0)),
      '{{cost.gst}}': formatCurrency(((quotation.working_cost || 0) + (quotation.transportation_cost || 0)) * 0.18),
      '{{cost.total}}': formatCurrency(quotation.total_amount || 0),
      '{{total_amount}}': formatCurrency(quotation.total_amount || 0),
      
      // Equipment table specific
      '{{equipment.quantity}}': machines && machines.length > 0 ? machines[0].quantity || 1 : '1',
      '{{equipment.rate}}': machines && machines.length > 0 ? formatCurrency(machines[0].base_rate || 0) : '₹0',
      '{{equipment.total}}': machines && machines.length > 0 ? formatCurrency((machines[0].quantity || 1) * (machines[0].base_rate || 0)) : '₹0',
      
      // Quotation total
      '{{quotation.total}}': formatCurrency(quotation.total_amount || 0)
    };
    
    // Apply replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      html = html.replace(regex, value);
    }
    
    // Generate equipment table if needed
    if (html.includes('{{equipment.table}}') && machines && machines.length > 0) {
      const equipmentTable = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #2563eb; color: white;">
              <th style="padding: 12px; border: 1px solid #ddd;">Equipment</th>
              <th style="padding: 12px; border: 1px solid #ddd;">Description</th>
              <th style="padding: 12px; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 12px; border: 1px solid #ddd;">Rate</th>
              <th style="padding: 12px; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${machines.map(machine => {
              const total = (machine.quantity || 0) * (machine.base_rate || 0);
              return `
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">${machine.equipment_name || 'Equipment'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${machine.equipment_description || machine.specifications || 'N/A'}</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${machine.quantity || 0}</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatCurrency(machine.base_rate || 0)}</td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatCurrency(total)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
      html = html.replace(/\{\{equipment\.table\}\}/g, equipmentTable);
    }
    
    console.log('✅ Template variables replaced successfully');
    console.log('📝 Final HTML length:', html.length);
    return html;
  }
  
  // Second, try to use template elements (Template Builder format)
  if (template.elements && Array.isArray(template.elements) && template.elements.length > 0) {
    console.log('✅ Using template elements (Template Builder)');
    console.log('🔧 Elements count:', template.elements.length);
    
    try {
      // Parse elements if they are stored as string
      let elements = template.elements;
      if (typeof elements === 'string') {
        elements = JSON.parse(elements);
      }
      
      // Render template elements to HTML
      const renderedContent = renderTemplateElements(elements, quotation, machines);
      
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Quotation ${quotation.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .template-container { max-width: 800px; margin: 0 auto; }
            .template-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .template-section { margin: 20px 0; }
            .template-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .template-table th, .template-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .template-table th { background-color: #f8f9fa; font-weight: bold; }
            .template-text { margin: 10px 0; }
            .template-heading { color: #2563eb; margin: 20px 0 10px 0; }
            @media print { 
              body { margin: 0; } 
              .template-container { max-width: none; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="template-container">
            ${renderedContent}
          </div>
        </body>
        </html>
      `;
      
      console.log('✅ Template builder HTML generated successfully');
      return html;
    } catch (error) {
      console.error('❌ Error rendering template elements:', error);
      // Fall through to fallback template
    }
  }
  
  // Fallback to hardcoded template if no content (backward compatibility)
  console.log('⚠️ No usable template content found, using fallback template');
  console.warn('Template structure:', {
    hasContent: !!template.content,
    contentLength: template.content ? template.content.length : 0,
    hasElements: !!template.elements,
    elementsType: typeof template.elements,
    elementsIsArray: Array.isArray(template.elements),
    elementsLength: template.elements ? template.elements.length : 0
  });
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quotation ${quotation.id}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0; 
          padding: 20px; 
          line-height: 1.6;
          color: #333;
          background: white;
        }
        .quotation-container { 
          max-width: 800px; 
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          padding: 40px;
        }
        .header { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 30px;
          color: #2563eb;
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 15px;
        }
        .company-info {
          text-align: center;
          margin-bottom: 40px;
          color: #64748b;
        }
        .quote-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .field { 
          margin: 8px 0;
          font-size: 14px;
        }
        .field strong {
          color: #374151;
          font-weight: 600;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td { 
          border: 1px solid #e5e7eb; 
          padding: 12px 16px; 
          text-align: left; 
        }
        th { 
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        tr:hover {
          background: #f3f4f6;
        }
        .total-section { 
          margin-top: 40px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .total { 
          font-weight: bold; 
          text-align: right;
          font-size: 18px;
          color: #1f2937;
          margin: 8px 0;
        }
        .grand-total {
          font-size: 24px;
          color: #2563eb;
          border-top: 2px solid #2563eb;
          padding-top: 15px;
        }
        .terms {
          margin-top: 40px;
          padding: 20px;
          background: #fef7ed;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }
        .signature-section {
          margin-top: 60px;
          text-align: right;
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
        }
        @media print {
          body { margin: 0; font-size: 12pt; }
          .quotation-container { box-shadow: none; padding: 20px; }
          .no-print { display: none; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="quotation-container">
  `;

  // Company header
  html += `
    <div class="header">
      ASP Cranes
    </div>
    <div class="company-info">
      Professional Crane Services | Your Trusted Partner<br>
      Phone: +91-XXXXXXXXXX | Email: info@aspcranes.com
    </div>
  `;

  // Quotation details
  html += `
    <div class="quote-details">
      <div>
        <div class="field"><strong>Quotation ID:</strong> ${quotation.id}</div>
        <div class="field"><strong>Date:</strong> ${formatDate(quotation.created_at)}</div>
        <div class="field"><strong>Order Type:</strong> ${quotation.order_type}</div>
        <div class="field"><strong>Machine Type:</strong> ${quotation.machine_type}</div>
      </div>
      <div>
        <div class="field"><strong>Customer:</strong> ${quotation.customer_name}</div>
        <div class="field"><strong>Email:</strong> ${quotation.customer_email || 'N/A'}</div>
        <div class="field"><strong>Phone:</strong> ${quotation.customer_phone || 'N/A'}</div>
        <div class="field"><strong>Status:</strong> ${quotation.status}</div>
      </div>
    </div>
  `;

  // Project details
  html += `
    <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Project Details</h3>
    <div class="quote-details">
      <div>
        <div class="field"><strong>Duration:</strong> ${quotation.number_of_days} days</div>
        <div class="field"><strong>Working Hours:</strong> ${quotation.working_hours} hours/day</div>
        <div class="field"><strong>Usage Type:</strong> ${quotation.usage}</div>
        <div class="field"><strong>Shift:</strong> ${quotation.shift}</div>
      </div>
      <div>
        <div class="field"><strong>Site Distance:</strong> ${quotation.site_distance} km</div>
        <div class="field"><strong>Food Resources:</strong> ${quotation.food_resources}</div>
        <div class="field"><strong>Accommodation:</strong> ${quotation.accom_resources}</div>
        <div class="field"><strong>Risk Factor:</strong> ${quotation.risk_factor}</div>
      </div>
    </div>
  `;

  // Equipment table
  if (machines && machines.length > 0) {
    html += `
      <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Equipment & Services</h3>
      <table>
        <thead>
          <tr>
            <th>Equipment</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Base Rate</th>
            <th>Running Cost/km</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    machines.forEach(machine => {
      const total = (machine.quantity || 0) * (machine.base_rate || 0);
      html += `
        <tr>
          <td><strong>${machine.equipment_name || 'Equipment'}</strong></td>
          <td>${machine.equipment_description || machine.specifications || 'N/A'}</td>
          <td style="text-align: center;">${machine.quantity || 0}</td>
          <td style="text-align: right;">${formatCurrency(machine.base_rate || 0)}</td>
          <td style="text-align: right;">${formatCurrency(machine.running_cost_per_km || 0)}</td>
          <td style="text-align: right; font-weight: bold;">${formatCurrency(total)}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
  }

  // Cost breakdown
  html += `
    <div class="total-section">
      <h3 style="color: #374151; margin-top: 0;">Cost Summary</h3>
      <div class="total">Total Rent: ${formatCurrency(quotation.total_rent || 0)}</div>
      <div class="total">Working Cost: ${formatCurrency(quotation.working_cost || 0)}</div>
      <div class="total">Mob/Demob Cost: ${formatCurrency(quotation.mob_demob_cost || 0)}</div>
      <div class="total">Food & Accommodation: ${formatCurrency(quotation.food_accom_cost || 0)}</div>
      <div class="total">GST Amount: ${formatCurrency(quotation.gst_amount || 0)}</div>
      <div class="total grand-total">Grand Total: ${formatCurrency(quotation.total_cost || quotation.total_rent || 0)}</div>
    </div>
  `;

  // Terms and conditions
  html += `
    <div class="terms">
      <h3 style="color: #f59e0b; margin-top: 0;">Terms & Conditions</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Payment Terms: 50% advance, balance on completion</li>
        <li>Equipment delivery within 2-3 working days from advance payment</li>
        <li>Fuel charges extra as per actual consumption</li>
        <li>All rates are subject to site conditions and accessibility</li>
        <li>This quotation is valid for 15 days from date of issue</li>
        <li>Mobilization and demobilization charges as mentioned above</li>
      </ul>
    </div>
  `;

  // Signature section
  html += `
    <div class="signature-section">
      <div style="margin-bottom: 60px;">
        <strong>For ASP Cranes</strong><br>
        <div style="margin-top: 40px; border-bottom: 1px solid #374151; width: 200px; margin-left: auto;"></div>
        <div style="margin-top: 5px; font-size: 12px;">Authorized Signature</div>
      </div>
    </div>
  `;

  html += `
      </div>
    </body>
    </html>
  `;

  return html;
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

function addPrintStyles(html) {
  const printStyles = `
    <style>
      @media print {
        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        @page { margin: 0.5in; size: A4; }
        body { font-size: 11pt; }
        .page-break { page-break-before: always; }
        .no-print { display: none !important; }
        .quotation-container { box-shadow: none !important; }
      }
    </style>
  `;
  
  return html.replace('</head>', printStyles + '</head>');
}

// Template Builder Elements Renderer
function renderTemplateElements(elements, quotation, machines) {
  console.log('🎨 Rendering template elements:', elements.length);
  
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
        return `<div style="${styleStr}">
          <h1 style="margin: 0; ${styleStr}">${replaceVariables(element.content, quotation)}</h1>
        </div>`;

      case 'text':
        const textContent = replaceVariables(element.content, quotation)
          .replace(/\n/g, '<br>');
        return `<div style="${styleStr}">
          <p style="margin: 0; white-space: pre-line;">${textContent}</p>
        </div>`;

      case 'table':
        if (!element.config || !element.config.rows) {
          return `<div style="${styleStr}">Table configuration missing</div>`;
        }
        
        const { rows, columns, showHeader, columnWidths } = element.config;
        let tableHtml = `<table style="width: 100%; border-collapse: collapse; ${styleStr}">`;
        
        // Add header if configured
        if (showHeader && columns) {
          tableHtml += '<thead><tr>';
          columns.forEach((col, index) => {
            const width = columnWidths && columnWidths[index] ? columnWidths[index] : 'auto';
            tableHtml += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; width: ${width};">${col}</th>`;
          });
          tableHtml += '</tr></thead>';
        }
        
        // Add rows
        tableHtml += '<tbody>';
        rows.forEach(row => {
          tableHtml += '<tr>';
          row.forEach((cell, index) => {
            const width = columnWidths && columnWidths[index] ? columnWidths[index] : 'auto';
            const cellContent = replaceVariables(cell, quotation);
            tableHtml += `<td style="border: 1px solid #ddd; padding: 8px; width: ${width};">${cellContent}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        
        return `<div style="${styleStr}">${tableHtml}</div>`;

      case 'terms':
        const termsContent = replaceVariables(element.content, quotation)
          .replace(/\n/g, '<br>')
          .replace(/\n\n/g, '<br><br>');
        return `<div style="${styleStr}">
          <div style="white-space: pre-line; line-height: 1.4;">${termsContent}</div>
        </div>`;

      default:
        return `<div style="${styleStr}">${replaceVariables(element.content || '', quotation)}</div>`;
    }
  }).join('\n');
  
  // Enhanced variable replacement function
  function replaceVariables(content, quotationData) {
    if (!content || !quotationData) return content;

    const variables = {
      '{{customer_name}}': quotationData.customer_name || 'N/A',
      '{{customer_email}}': quotationData.customer_email || 'N/A', 
      '{{customer_phone}}': quotationData.customer_phone || 'N/A',
      '{{customer_address}}': quotationData.customer_address || 'N/A',
      '{{quotation_id}}': quotationData.id || 'N/A',
      '{{machine_type}}': quotationData.machine_type || 'N/A',
      '{{order_type}}': quotationData.order_type || 'N/A',
      '{{number_of_days}}': quotationData.number_of_days || 'N/A',
      '{{working_hours}}': quotationData.working_hours || 'N/A',
      '{{total_cost}}': quotationData.total_cost ? `₹${Number(quotationData.total_cost).toLocaleString('en-IN')}` : 'N/A',
      '{{created_date}}': quotationData.created_at ? new Date(quotationData.created_at).toLocaleDateString('en-IN') : 'N/A',
      '{{site_distance}}': quotationData.site_distance || 'N/A',
      '{{usage}}': quotationData.usage || 'N/A',
      '{{shift}}': quotationData.shift || 'N/A',
      '{{food_resources}}': quotationData.food_resources || 'N/A',
      // Table-specific variables
      '{{item_name}}': quotationData.machine_type || 'Mobile Crane',
      '{{item_capacity}}': quotationData.machine_type || 'N/A',
      '{{item_duration}}': quotationData.number_of_days ? `${quotationData.number_of_days} days` : 'N/A',
      '{{item_rate}}': quotationData.total_cost ? `₹${Number(quotationData.total_cost).toLocaleString('en-IN')}` : 'N/A',
      '{{item_amount}}': quotationData.total_cost ? `₹${Number(quotationData.total_cost).toLocaleString('en-IN')}` : 'N/A'
    };

    let result = content;
    for (const [variable, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }
}

export default router;
