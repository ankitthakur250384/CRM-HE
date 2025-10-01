/**
 * Quotation Preview Routes
 * Unified preview system using EnhancedTemplateBuilder
 */

import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import pool from '../lib/dbConnection.js';
import { EnhancedTemplateBuilder } from '../services/EnhancedTemplateBuilder.mjs';

const router = express.Router();


// Helper function to generate quotation number from ID
function generateQuotationNumber(quotationId) {
  // Extract number from quotation ID (quot_XXXXXXXX format)
  const idParts = quotationId.split('_');
  if (idParts.length >= 2) {
    // Use the UUID part to generate a consistent number
    const hashCode = idParts[1].split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const num = Math.abs(hashCode) % 9999 + 1; // Ensure it's between 1-9999
    return `ASP-Q-${num.toString().padStart(3, '0')}`;
  }
  
  // Fallback: use full ID
  return `ASP-Q-${quotationId.substring(5, 8).toUpperCase()}`;
}

// Simple test route to verify the routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Preview routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test route to verify template generation without database
router.get('/test-template', async (req, res) => {
  try {
    console.log('🧪 [Test] Testing template generation...');
    
    const templateBuilder = new EnhancedTemplateBuilder();
    const template = createDefaultQuotationTemplate(templateBuilder);
    
    console.log('🧪 [Test] Template created:', template.name);
    
    // Generate sample preview
    const sampleData = {
      company: {
        name: 'ASP Cranes Pvt. Ltd.',
        address: 'Industrial Area, Pune, Maharashtra',
        phone: '+91 99999 88888',
        email: 'sales@aspcranes.com'
      },
      client: {
        name: 'Test Customer',
        company: 'Test Company Ltd.',
        address: 'Mumbai, Maharashtra',
        phone: '+91 98765 43210',
        email: 'test@company.com'
      },
      quotation: {
        number: 'TEST-001',
        date: new Date().toLocaleDateString('en-IN'),
        machineType: 'Tower Crane',
        duration: '30 days'
      },
      items: [
        {
          description: 'Tower Crane Rental',
          quantity: '30',
          unit: 'Days',
          rate: 25000,
          amount: 750000
        }
      ],
      totals: {
        subtotal: formatCurrency(750000),
        tax: formatCurrency(135000),
        total: formatCurrency(885000)
      }
    };
    
    const html = templateBuilder.generatePreviewHTML(sampleData);
    
    console.log('🧪 [Test] Preview HTML generated, length:', html.length);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('❌ [Test] Template generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Template generation failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Simple iframe test route
router.get('/:id/preview/test', (req, res) => {
  const { id } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Preview Test</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
        .test-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <div class="test-box">
        <h2>🧪 Preview Route Test</h2>
        <p><strong>Quotation ID:</strong> ${id}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p>✅ If you can see this, the iframe routing is working!</p>
        <p>🔄 Now we need to debug the actual preview generation.</p>
      </div>
    </body>
    </html>
  `);
});

// Optional auth for selected endpoints: allows bypass header regardless of NODE_ENV
const optionalAuth = (req, res, next) => {
  const bypassHeader = req.headers['x-bypass-auth'];
  if (bypassHeader === 'development-only-123' || bypassHeader === 'true') {
    console.log('⚠️ OptionalAuth(Preview): bypassing auth based on header');
    req.user = { uid: 'bypass-user', email: 'bypass@example.com', role: 'admin' };
    return next();
  }
  return authenticateToken(req, res, next);
};

/**
 * GET /api/quotations/:id/preview - Generate quotation preview
 * Main preview endpoint that uses EnhancedTemplateBuilder
 */
router.get('/:id/preview', async (req, res) => {
  try {
    const { id: quotationId } = req.params;
    const { templateId, format = 'html' } = req.query;
    
    console.log('👁️ [Preview] Generating preview for quotation:', quotationId);
    console.log('👁️ [Preview] Template ID:', templateId || 'default');
    
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Step 1: Get quotation data
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Step 2: Get or create template
    let template;
    const templateBuilder = new EnhancedTemplateBuilder();
    
    if (templateId) {
      // Use specific template
      try {
        await templateBuilder.loadTemplate(templateId);
        template = templateBuilder.template;
        console.log('📋 [Preview] Using specific template:', template.name);
      } catch (error) {
        console.warn('⚠️ [Preview] Specific template not found, using default');
        template = await getDefaultTemplate(templateBuilder);
      }
    } else {
      // Use default template
      template = await getDefaultTemplate(templateBuilder);
    }

    // Step 3: Generate preview HTML
    const previewData = mapQuotationToTemplateData(quotationData);
    const html = templateBuilder.generatePreviewHTML(previewData);

    if (format === 'json') {
      return res.json({
        success: true,
        data: {
          html,
          template: {
            id: template.id,
            name: template.name,
            description: template.description
          },
          quotation: quotationData
        }
      });
    }

    // Return HTML for iframe preview
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ [Preview] Preview generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Preview generation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/quotations/:id/preview/iframe - Iframe-friendly preview
 * Returns pure HTML without any wrapper
 * BYPASS AUTH: Since iframes can't send custom headers, we bypass auth for iframe requests
 */
router.get('/:id/preview/iframe', async (req, res) => {
  try {
    const { id: quotationId } = req.params;
    const { templateId } = req.query;
    
    // Minimal headers for iframe embedding - avoid browser security warnings
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    
    console.log('🖼️ [Preview] Generating iframe preview for quotation:', quotationId);
    console.log('🖼️ [Preview] Bypassing auth for iframe request');
    
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).send(`
        <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
          <h2 style="color: #dc2626;">Quotation Not Found</h2>
          <p>The requested quotation (${quotationId}) could not be found.</p>
        </div>
      `);
    }

    console.log('✅ [Preview] Quotation data retrieved:', {
      id: quotationData.id,
      customerName: quotationData.customer_name,
      machineType: quotationData.machine_type
    });

    const templateBuilder = new EnhancedTemplateBuilder();
    let template;
    
    if (templateId) {
      try {
        await templateBuilder.loadTemplate(templateId);
        template = templateBuilder.template;
        console.log('📋 [Preview] Using specific template:', template.name);
      } catch (error) {
        console.warn('⚠️ [Preview] Specific template not found, using default');
        template = await getDefaultTemplate(templateBuilder);
      }
    } else {
      template = await getDefaultTemplate(templateBuilder);
    }

    console.log('🎨 [Preview] Using template:', template.name);

    const previewData = mapQuotationToTemplateData(quotationData);
    console.log('📋 [Preview] Mapped data keys:', Object.keys(previewData));
    
    const html = templateBuilder.generatePreviewHTML(previewData);
    console.log('✅ [Preview] HTML generated, length:', html.length);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(html);

  } catch (error) {
    console.error('❌ [Preview] Iframe preview failed:', error);
    console.error('❌ [Preview] Error stack:', error.stack);
    res.status(500).send(`
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
        <h2 style="color: #dc2626;">Preview Error</h2>
        <p>Failed to generate quotation preview.</p>
        <p style="color: #666; font-size: 0.9em;">Error: ${error.message}</p>
        <details style="margin-top: 20px; text-align: left;">
          <summary>Technical Details</summary>
          <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
        </details>
      </div>
    `);
  }
});

/**
 * Helper function to get quotation with details from database
 */
async function getQuotationWithDetails(quotationId) {
  try {
    console.log('🔍 [Helper] Fetching quotation:', quotationId);
    
    const query = `
      SELECT 
        q.id,
        q.customer_name,
        q.customer_contact,
        q.machine_type,
        q.order_type,
        q.number_of_days,
        q.working_hours,
        q.total_rent,
        q.total_cost,
        q.working_cost,
        q.mob_demob_cost,
        q.food_accom_cost,
        q.gst_amount,
        q.status,
        q.notes,
        q.site_distance,
        q.usage,
        q.risk_factor,
        q.shift,
        q.food_resources,
        q.accom_resources,
        q.created_at,
        q.updated_at,
        c.name as customer_db_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.company_name as customer_company
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = $1
    `;
    
    const result = await pool.query(query, [quotationId]);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // Get quotation machines/items
    const itemsQuery = `
      SELECT 
        qm.quantity,
        qm.base_rate,
        qm.running_cost_per_km,
        e.name as equipment_name,
        e.category as equipment_category,
        e.max_lifting_capacity,
        e.equipment_id
      FROM quotation_machines qm
      LEFT JOIN equipment e ON qm.equipment_id = e.id
      WHERE qm.quotation_id = $1
      ORDER BY qm.created_at ASC
    `;
    
    const itemsResult = await pool.query(itemsQuery, [quotationId]);
    
    // Parse customer contact JSON
    let customerContact = {};
    try {
      if (row.customer_contact) {
        customerContact = JSON.parse(row.customer_contact);
      }
    } catch (e) {
      console.warn('Could not parse customer_contact JSON:', e);
    }
    
    // Structure the quotation data
    const quotation = {
      id: row.id,
      quotation_number: generateQuotationNumber(row.id), // Generate from ID
      description: row.notes || 'Crane Rental Service',
      status: row.status,
      machine_type: row.machine_type,
      order_type: row.order_type,
      number_of_days: row.number_of_days,
      working_hours: row.working_hours,
      total_rent: row.total_rent,
      total_cost: row.total_cost,
      working_cost: row.working_cost,
      mob_demob_cost: row.mob_demob_cost,
      food_accom_cost: row.food_accom_cost,
      gst_amount: row.gst_amount,
      site_distance: row.site_distance,
      usage: row.usage,
      risk_factor: row.risk_factor,
      shift: row.shift,
      food_resources: row.food_resources,
      accom_resources: row.accom_resources,
      created_at: row.created_at,
      updated_at: row.updated_at,
      
      // Customer information (prioritize customer_contact JSON, fall back to joined data)
      customer: {
        name: customerContact.name || row.customer_name || row.customer_db_name || 'Unknown Customer',
        email: customerContact.email || row.customer_email || '',
        phone: customerContact.phone || row.customer_phone || '',
        address: customerContact.address || row.customer_address || '',
        company: customerContact.company || row.customer_company || ''
      },
      
      // Items from quotation_machines
      items: itemsResult.rows.map(item => ({
        description: item.equipment_name || 'Equipment',
        quantity: item.quantity || 1,
        unit: 'Days',
        rate: item.base_rate || 0,
        amount: (item.quantity || 1) * (item.base_rate || 0)
      })),
      
      // Company information
      company: {
        name: 'ASP Cranes Pvt. Ltd.',
        address: 'Industrial Area, Pune, Maharashtra 411019',
        phone: '+91 99999 88888',
        email: 'sales@aspcranes.com',
        website: 'www.aspcranes.com'
      }
    };

    console.log('✅ [Helper] Quotation fetched successfully');
    return quotation;
    
  } catch (error) {
    console.error('❌ [Helper] Error fetching quotation:', error);
    throw new Error(`Failed to fetch quotation: ${error.message}`);
  }
}

/**
 * Helper function to get or create default template
 */
async function getDefaultTemplate(templateBuilder) {
  try {
    // First try to get an existing default template
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id FROM enhanced_templates 
        WHERE is_default = true AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `);
      
      if (result.rows.length > 0) {
        await templateBuilder.loadTemplate(result.rows[0].id);
        console.log('📋 [Helper] Loaded existing default template:', result.rows[0].id);
        return templateBuilder.template;
      }
    } catch (dbError) {
      console.warn('⚠️ [Helper] Database query failed, creating fallback template:', dbError.message);
    } finally {
      client.release();
    }
    
    // If no default template exists or DB is not available, create a fallback one
    console.log('📋 [Helper] No default template found, creating fallback template');
    return createDefaultQuotationTemplate(templateBuilder);
    
  } catch (error) {
    console.error('❌ [Helper] Error getting default template:', error);
    console.log('📋 [Helper] Creating emergency fallback template');
    return createDefaultQuotationTemplate(templateBuilder);
  }
}

/**
 * Create a default quotation template using EnhancedTemplateBuilder
 */
function createDefaultQuotationTemplate(templateBuilder) {
  try {
    const templateData = {
      name: 'ASP Cranes Default Template',
      description: 'Professional quotation template for ASP Cranes',
      theme: 'PROFESSIONAL',
      isDefault: true,
      isActive: true
    };
    
    console.log('🎨 [Helper] Creating template with theme: PROFESSIONAL');
    
    templateBuilder.createTemplate(templateData)
      .addElement('header', {
        content: {
          title: 'ASP CRANES',
          subtitle: 'QUOTATION',
          showDate: true,
          showQuotationNumber: true,
          alignment: 'center'
        }
      })
      .addElement('company_info', {
        content: {
          fields: [
            '{{company.name}}',
            '{{company.address}}',
            '{{company.phone}}',
            '{{company.email}}'
          ],
          layout: 'vertical',
          alignment: 'left'
        }
      })
      .addElement('client_info', {
        content: {
          title: 'Bill To:',
          fields: [
            '{{client.name}}',
            '{{client.company}}',
            '{{client.address}}',
            '{{client.phone}}',
            '{{client.email}}'
          ],
          layout: 'vertical',
          alignment: 'left'
        }
      })
      .addElement('quotation_info', {
        content: {
          fields: [
            { label: 'Quotation #', value: '{{quotation.number}}' },
            { label: 'Date', value: '{{quotation.date}}' },
            { label: 'Machine Type', value: '{{quotation.machineType}}' },
            { label: 'Duration', value: '{{quotation.duration}}' }
          ],
          layout: 'table',
          alignment: 'right'
        }
      })
      .addElement('items_table')
      .addElement('totals')
      .addElement('terms', {
        content: {
          title: 'Terms & Conditions',
          text: 'Payment Terms: 50% advance, balance on completion. Equipment delivery within 2-3 working days from advance payment. Fuel charges extra as per actual consumption. All rates are subject to site conditions and accessibility. This quotation is valid for 15 days from date of issue.',
          showTitle: true
        }
      })
      .addElement('signature');
    
    console.log('✅ [Helper] Created default template successfully');
    return templateBuilder.template;
    
  } catch (error) {
    console.error('❌ [Helper] Error creating template:', error);
    
    // Create emergency minimal template
    console.log('🚑 [Helper] Creating emergency minimal template');
    const emergencyTemplate = {
      id: 'emergency-default',
      name: 'Emergency Default Template',
      description: 'Emergency fallback template',
      theme: 'MODERN',
      elements: [
        {
          type: 'header',
          content: { title: 'ASP CRANES', subtitle: 'QUOTATION' }
        },
        {
          type: 'company_info',
          content: { fields: ['{{company.name}}', '{{company.address}}'] }
        },
        {
          type: 'client_info',
          content: { title: 'Bill To:', fields: ['{{client.name}}'] }
        },
        {
          type: 'items_table',
          content: {}
        },
        {
          type: 'totals',
          content: {}
        }
      ],
      isDefault: true,
      isActive: true
    };
    
    templateBuilder.template = emergencyTemplate;
    return emergencyTemplate;
  }
}

/**
 * Map quotation data to template format
 */
function mapQuotationToTemplateData(quotationData) {
  return {
    company: quotationData.company,
    client: quotationData.customer,
    quotation: {
      number: quotationData.quotation_number,
      date: quotationData.created_at ? new Date(quotationData.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
      machineType: quotationData.machine_type,
      duration: `${quotationData.number_of_days} days`,
      validUntil: quotationData.valid_until || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
      paymentTerms: '50% advance, balance on completion'
    },
    items: quotationData.items || [],
    totals: {
      subtotal: formatCurrency(quotationData.total_rent || 0),
      tax: formatCurrency(quotationData.gst_amount || 0),
      total: formatCurrency(quotationData.total_cost || 0),
      workingCost: formatCurrency(quotationData.working_cost || 0),
      mobDemobCost: formatCurrency(quotationData.mob_demob_cost || 0),
      foodAccomCost: formatCurrency(quotationData.food_accom_cost || 0)
    }
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default router;