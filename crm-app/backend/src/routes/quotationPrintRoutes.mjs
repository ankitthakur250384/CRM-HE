import express from 'express';
import { db } from '../lib/dbClient.js';

const router = express.Router();

// Generate quotation preview/print HTML
router.post('/preview', async (req, res) => {
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

    // If still no template, get the first active template
    if (!templateId) {
      const firstTemplateQuery = `
        SELECT id FROM quotation_templates 
        WHERE is_active = true 
        ORDER BY created_at DESC 
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
      WHERE id = $1 AND is_active = true
    `;
    
    const templateResult = await db.query(templateQuery, [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = templateResult.rows[0];
    console.log('🎨 Template:', template.name);

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
router.post('/print', async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;
    
    console.log('🖨️ Print request:', { quotationId, templateId });

    // Generate preview first
    const previewBody = { quotationId, templateId, format: 'html' };
    const previewReq = { body: previewBody };
    const previewRes = { 
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
    };

    // Simulate calling the preview endpoint
    const mockRes = {
      data: null,
      json(data) { this.data = data; },
      status(code) { 
        return {
          json: (data) => { this.data = { ...data, statusCode: code }; }
        };
      }
    };

    // Call preview logic directly
    await router.stack.find(layer => layer.route && layer.route.path === '/preview')
      ?.route.stack[0].handle(previewReq, mockRes, () => {});

    if (!mockRes.data || !mockRes.data.success) {
      throw new Error('Failed to generate preview for printing');
    }

    // Add print-specific styling
    const printHtml = addPrintStyles(mockRes.data.html);

    res.json({ success: true, html: printHtml });

  } catch (error) {
    console.error('❌ Error generating print version:', error);
    res.status(500).json({ success: false, error: 'Failed to generate print version' });
  }
});

// Download PDF
router.post('/pdf', async (req, res) => {
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
router.post('/email-pdf', async (req, res) => {
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
  const elements = template.elements || [];
  const styles = template.styles || {};
  
  console.log('🔧 Generating HTML with', elements.length, 'elements');
  
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

export default router;
