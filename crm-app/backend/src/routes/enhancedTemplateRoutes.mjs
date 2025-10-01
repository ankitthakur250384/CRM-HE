/**
 * Enhanced Template Management Routes
 * Advanced template builder and PDF generation functionality
 * Inspired by InvoiceNinja's template system adapted for ASP Cranes
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import { EnhancedTemplateBuilder, TEMPLATE_ELEMENT_TYPES, TEMPLATE_THEMES } from '../services/EnhancedTemplateBuilder.mjs';
import { AdvancedPDFGenerator, PDF_OPTIONS } from '../services/AdvancedPDFGenerator.mjs';

const router = express.Router();

// Configure multer for file uploads (logos, assets)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'templates');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `template-asset-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * GET /api/templates/enhanced/info
 * Get enhanced template builder information and capabilities
 */
router.get('/info', (req, res) => {
  console.log('🔍 [EnhancedTemplates] Info endpoint requested');
  res.json({
    success: true,
    message: 'Enhanced Template System is operational',
    features: ['Template Builder', 'PDF Generation', 'Asset Management'],
    themes: Object.values(TEMPLATE_THEMES),
    elementTypes: Object.values(TEMPLATE_ELEMENT_TYPES),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/templates/enhanced/health
 * Health check endpoint (no auth required)
 */
router.get('/health', (req, res) => {
  console.log('🏥 [EnhancedTemplates] Health check requested');
  res.json({ 
    success: true, 
    message: 'Enhanced Template system is operational',
    timestamp: new Date().toISOString(),
    database: 'checking...',
    data: {
      elementTypes: TEMPLATE_ELEMENT_TYPES,
      themes: TEMPLATE_THEMES,
      pdfFormats: PDF_OPTIONS.FORMATS,
      pdfOrientations: PDF_OPTIONS.ORIENTATIONS,
      pdfQuality: PDF_OPTIONS.QUALITY,
      features: {
        visualBuilder: true,
        dragDrop: true,
        realTimePreview: true,
        multiFormat: true,
        watermarks: true,
        headerFooter: true,
        customCSS: true,
        batch: true,
        templates: true,
        versioning: true
      },
      limits: {
        maxElements: 50,
        maxTemplates: 100,
        maxFileSize: '5MB',
        supportedImageTypes: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'ico']
      }
    }
  });
});

/**
 * POST /api/templates/enhanced/create
 * Create new enhanced template
 * Note: Made more flexible for demo purposes
 */
router.post('/create', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = { id: 'demo-user', email: 'demo@aspcranes.com', role: 'admin' };
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, using demo user');
      }
    }
    
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const {
      name,
      description = '',
      theme = 'MODERN',
      category = 'Quotation',
      isDefault = false,
      elements = [],
      settings = {},
      branding = {}
    } = req.body;
    
    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });
    
    await client.connect();
    
    try {
      const query = `
        INSERT INTO enhanced_templates (
          id, name, description, theme, category, is_default, is_active,
          created_by, elements, settings, branding
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        templateId,
        name,
        description,
        theme,
        category,
        isDefault,
        true, // is_active
        user.id,
        JSON.stringify(elements),
        JSON.stringify(settings),
        JSON.stringify(branding)
      ];
      
      const result = await client.query(query, values);
      const savedTemplate = result.rows[0];
      
      console.log('✅ Created enhanced template:', savedTemplate.name);
      
      res.status(201).json({
        success: true,
        data: {
          id: savedTemplate.id,
          name: savedTemplate.name,
          description: savedTemplate.description,
          theme: savedTemplate.theme,
          category: savedTemplate.category,
          isDefault: savedTemplate.is_default,
          isActive: savedTemplate.is_active,
          createdBy: savedTemplate.created_by,
          createdAt: savedTemplate.created_at,
          updatedAt: savedTemplate.updated_at,
          elements: savedTemplate.elements,
          settings: savedTemplate.settings,
          branding: savedTemplate.branding
        },
        message: 'Enhanced template created successfully'
      });
      
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('Error creating enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create enhanced template',
      message: error.message
    });
  }
});

/**
 * GET /api/templates/enhanced/sample-data
 * Get real quotation data for template building and preview
 */
router.get('/sample-data', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] =================== SAMPLE DATA ENDPOINT CALLED ===================');
    
    // Try to fetch real quotation data from the quotations API (exactly like your network tab)
    try {
      console.log('🔍 Fetching quotations from internal API...');
      
      const response = await fetch('http://localhost:3001/api/quotations');
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Quotations API response received, success:', result.success);
        
        if (result.success && result.data && result.data.length > 0) {
          // Find a quotation with complete financial data instead of just using the first one
          let quotation = result.data.find(q => 
            (q.totalCost || q.total_cost) > 0 && (q.workingCost || q.working_cost) > 0 && (q.numberOfDays || q.number_of_days) > 0
          ) || result.data[0]; // Fallback to first if none found with complete data
          
          console.log('📋 Using quotation:', quotation.quotationNumber || quotation.id);
          console.log('📊 Available quotations:', result.data.length);
          console.log('� Selected quotation has complete data:', {
            hasTotalCost: !!quotation.totalCost,
            hasWorkingCost: !!quotation.workingCost,
            hasNumberOfDays: !!quotation.numberOfDays,
            totalCost: quotation.totalCost,
            workingCost: quotation.workingCost
          });
          console.log('🔧 Raw quotation data (checking both snake_case and camelCase):', {
            id: quotation.id,
            quotationNumber: quotation.quotationNumber || quotation.quotation_number,
            machineType: quotation.machineType || quotation.machine_type,
            orderType: quotation.orderType || quotation.order_type,
            workingCost: quotation.workingCost || quotation.working_cost,
            mobDemobCost: quotation.mobDemobCost || quotation.mob_demob_cost,
            numberOfDays: quotation.numberOfDays || quotation.number_of_days,
            totalCost: quotation.totalCost || quotation.total_cost,
            gstAmount: quotation.gstAmount || quotation.gst_amount,
            // Check which format we're getting
            fieldFormat: quotation.totalCost ? 'camelCase' : 'snake_case'
          });
          
          // Transform the quotation data to template format using the exact same data structure as your network tab
          const quotationData = {
            company: {
              name: 'ASP Cranes Pvt. Ltd.',
              address: 'Industrial Area, Pune, Maharashtra 411019',
              phone: '+91 99999 88888',
              email: 'sales@aspcranes.com',
              website: 'www.aspcranes.com'
            },
            client: {
              name: quotation.customerName || quotation.customer_name || 'Client Name',
              company: quotation.customerContact?.company || 'Client Company',
              address: quotation.customerContact?.address || 'Client Address',
              phone: quotation.customerContact?.phone || quotation.customer_phone || 'Client Phone',
              email: quotation.customerContact?.email || quotation.customer_email || 'client@email.com'
            },
            quotation: {
              number: quotation.quotationNumber || quotation.quotation_number || quotation.id,
              date: new Date(quotation.createdAt || quotation.created_at).toLocaleDateString('en-IN'),
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
              paymentTerms: '50% advance, balance on completion',
              terms: 'This quotation is valid for 30 days. All rates are inclusive of GST.'
            },
            // Create items array using the quotation data directly with correct camelCase field names
            items: [{
              no: 1,
              description: (quotation.machineType || quotation.machine_type) 
                ? `${(quotation.machineType || quotation.machine_type).replace(/[_-]/g, ' ').toUpperCase()} - Rental Service`
                : 'MOBILE CRANE - Rental Service',
              jobType: quotation.orderType || quotation.order_type || 'small',
              quantity: 1,
              duration: (quotation.numberOfDays || quotation.number_of_days) ? `${quotation.numberOfDays || quotation.number_of_days} days` : '24 days',
              rate: ((quotation.workingCost || quotation.working_cost) && (quotation.numberOfDays || quotation.number_of_days)) 
                ? `₹${Math.round((quotation.workingCost || quotation.working_cost) / (quotation.numberOfDays || quotation.number_of_days)).toLocaleString('en-IN')}/day`
                : '₹9,600/day',
              rental: (quotation.workingCost || quotation.working_cost) 
                ? `₹${Math.round(quotation.workingCost || quotation.working_cost).toLocaleString('en-IN')}`
                : '₹2,30,400',
              mobDemob: (quotation.mobDemobCost || quotation.mob_demob_cost) 
                ? `₹${Math.round(quotation.mobDemobCost || quotation.mob_demob_cost).toLocaleString('en-IN')}`
                : '₹15,000'
            }],
            totals: {
              subtotal: `₹${Math.round(((quotation.totalCost || quotation.total_cost) || 0) - ((quotation.gstAmount || quotation.gst_amount) || 0)).toLocaleString('en-IN')}`,
              discount: '₹0',
              tax: `₹${Math.round((quotation.gstAmount || quotation.gst_amount) || 0).toLocaleString('en-IN')}`,
              total: `₹${Math.round((quotation.totalCost || quotation.total_cost) || 0).toLocaleString('en-IN')}`
            }
          };
          
          console.log('📊 Template data created:', {
            itemsCount: quotationData.items.length,
            customerName: quotationData.client.name,
            quotationNumber: quotationData.quotation.number,
            firstItem: quotationData.items[0]
          });
          
          return res.json({
            success: true,
            data: quotationData,
            message: 'Real quotation data retrieved successfully'
          });
        }
      }
    } catch (fetchError) {
      console.log('⚠️ API fetch failed, trying database fallback:', fetchError.message);
    }
    
    // Fallback to database query if API fails
    const pg = await import('pg');
    const pool = new pg.default.Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21'
    });

    const client = await pool.connect();
    
    try {
      // Get the most recent quotation with complete data
      const quotationResult = await client.query(`
        SELECT q.*, c.name as customer_name, c.email as customer_email,
               c.phone as customer_phone, c.company_name as customer_company,
               c.address as customer_address, c.designation as customer_designation,
               d.title as deal_title
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        LEFT JOIN deals d ON q.deal_id = d.id
        ORDER BY q.created_at DESC
        LIMIT 1;
      `);

      let quotationData;
      
      if (quotationResult.rows.length > 0) {
        const quotation = quotationResult.rows[0];
        
        // Get associated machines/equipment
        console.log('🔍 [DEBUG] Looking for equipment for quotation ID:', quotation.id);
        const machinesResult = await client.query(`
          SELECT qm.id, qm.quotation_id, qm.equipment_id, qm.quantity, 
                 qm.base_rate, qm.running_cost_per_km, qm.created_at,
                 e.name as equipment_name, e.category, e.type as equipment_type
          FROM quotation_machines qm
          LEFT JOIN equipment e ON qm.equipment_id = e.id
          WHERE qm.quotation_id = $1;
        `, [quotation.id]);
        
        console.log('🔍 [DEBUG] Found equipment records:', machinesResult.rows.length);
        if (machinesResult.rows.length > 0) {
          console.log('🔍 [DEBUG] Equipment data:', machinesResult.rows);
        }

        // Generate quotation number
        function generateQuotationNumber(quotationId) {
          const idParts = quotationId.split('_');
          if (idParts.length >= 2) {
            const hashCode = idParts[1].split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            const num = Math.abs(hashCode) % 9999 + 1;
            return `ASP-Q-${num.toString().padStart(3, '0')}`;
          }
          return `ASP-Q-${quotationId.substring(5, 8).toUpperCase()}`;
        }

        // Transform database data to template format
        quotationData = {
          company: {
            name: 'ASP Cranes Pvt. Ltd.',
            address: 'Industrial Area, Pune, Maharashtra 411019',
            phone: '+91 99999 88888',
            email: 'sales@aspcranes.com',
            website: 'www.aspcranes.com'
          },
          client: {
            name: quotation.customer_name || quotation.contact_name || 'Client Name',
            company: quotation.customer_company || quotation.company_name || 'Client Company',
            address: quotation.customer_address || 'Client Address',
            phone: quotation.customer_phone || 'Client Phone',
            email: quotation.customer_email || 'client@email.com'
          },
          quotation: {
            number: quotation.quotation_number || generateQuotationNumber(quotation.id),
            date: new Date(quotation.created_at).toLocaleDateString('en-IN'),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
            paymentTerms: '50% advance, balance on completion',
            terms: 'This quotation is valid for 30 days. All rates are inclusive of GST.'
          },
          items: machinesResult.rows.map((machine, index) => {
            const dailyRate = machine.base_rate || quotation.total_rent || 10000;
            const totalDays = quotation.number_of_days || 1;
            const workingCost = quotation.working_cost || (dailyRate * totalDays);
            const mobDemobCost = quotation.mob_demob_cost || 0;
            
            const item = {
              no: index + 1,
              description: `${machine.equipment_name || machine.equipment_type || quotation.machine_type || 'Equipment'} - ${machine.category || 'Rental Service'}`,
              jobType: quotation.order_type || quotation.job_type || 'Standard',
              quantity: machine.quantity || 1,
              duration: totalDays,
              rate: `₹${dailyRate.toLocaleString('en-IN')}/day`,
              rental: `₹${workingCost.toLocaleString('en-IN')}`,
              mobDemob: mobDemobCost > 0 ? `₹${mobDemobCost.toLocaleString('en-IN')}` : '₹0'
            };
            console.log('🔍 [DEBUG] Created equipment item (8-column format):', item);
            return item;
          }),
          totals: {
            subtotal: `₹${Math.round(quotation.working_cost || quotation.total_rent || 100000).toLocaleString('en-IN')}`,
            discount: '₹0',
            tax: `₹${Math.round(quotation.gst_amount || ((quotation.total_cost || 100000) * 0.18)).toLocaleString('en-IN')}`,
            total: `₹${Math.round(quotation.total_cost || 118000).toLocaleString('en-IN')}`
          }
        };

        // Log equipment status for debugging
        if (quotationData.items.length === 0) {
          console.log('⚠️ [WARNING] No equipment found for quotation:', quotationId);
          console.log('⚠️ This should not happen if quotations are created properly with equipment selection');
        } else {
          console.log('✅ [SUCCESS] Found', quotationData.items.length, 'equipment items for quotation:', quotationId);
        }
        
        console.log('🔍 [DEBUG] Final items array:', quotationData.items);
      } else {
        // Fallback to sample data if no quotations in database
        const templateBuilder = new EnhancedTemplateBuilder();
        quotationData = templateBuilder.getSampleQuotationData();
      }

      client.release();
      await pool.end();

      res.json({
        success: true,
        data: quotationData,
        message: 'Quotation data retrieved successfully'
      });
      
    } catch (dbError) {
      if (client) {
        client.release();
      }
      if (pool) {
        await pool.end();
      }
      console.error('Database error, falling back to sample data:', dbError);
      
      // Fallback to sample data on database error
      const templateBuilder = new EnhancedTemplateBuilder();
      const sampleData = templateBuilder.getSampleQuotationData();
      
      res.json({
        success: true,
        data: sampleData,
        message: 'Sample data retrieved (database fallback)'
      });
    }
    
  } catch (error) {
    console.error('Error retrieving quotation data:', error);
    
    // Ultimate fallback to sample data
    try {
      const templateBuilder = new EnhancedTemplateBuilder();
      const sampleData = templateBuilder.getSampleQuotationData();
      
      res.json({
        success: true,
        data: sampleData,
        message: 'Sample data retrieved (error fallback)'
      });
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve data',
        message: fallbackError.message
      });
    }
  }
});

/**
 * GET /api/templates/enhanced/default
 * Get the current default template
 */
router.get('/default', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = null;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, continuing without auth');
      }
    }

    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });

    await client.connect();

    try {
      const query = `
        SELECT * FROM enhanced_templates 
        WHERE is_default = true AND is_active = true 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const result = await client.query(query);
      
      if (result.rows.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'No default template configured'
        });
      }

      const defaultTemplate = result.rows[0];

      res.json({
        success: true,
        data: {
          id: defaultTemplate.id,
          name: defaultTemplate.name,
          description: defaultTemplate.description,
          theme: defaultTemplate.theme,
          category: defaultTemplate.category,
          isDefault: defaultTemplate.is_default,
          isActive: defaultTemplate.is_active,
          createdBy: defaultTemplate.created_by,
          createdAt: defaultTemplate.created_at,
          updatedAt: defaultTemplate.updated_at,
          elements: defaultTemplate.elements,
          settings: defaultTemplate.settings,
          branding: defaultTemplate.branding
        },
        message: 'Default template retrieved successfully'
      });

    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('Error retrieving default template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve default template',
      message: error.message
    });
  }
});

/**
 * Auto-create default template if it doesn't exist
 */
async function ensureDefaultTemplate(client) {
  try {
    // Check if default template exists
    const checkQuery = `SELECT id FROM enhanced_templates WHERE id = 'tpl_default_001'`;
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('🔧 Creating default template as it does not exist...');
      
      const defaultElements = [
        {
          "id": "header-1",
          "type": "header",
          "content": {
            "title": "ASP CRANES",
            "subtitle": "Professional Equipment Solutions"
          },
          "visible": true,
          "style": {"fontSize": "24px", "color": "#0052CC", "textAlign": "center"}
        },
        {
          "id": "company-info-1", 
          "type": "company_info",
          "content": {
            "fields": ["{{company.name}}", "{{company.address}}", "{{company.phone}}"],
            "layout": "vertical"
          },
          "visible": true,
          "style": {"fontSize": "14px"}
        }
      ];
      
      const defaultSettings = {
        "pageSize": "A4",
        "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}
      };
      
      const defaultBranding = {
        "primaryColor": "#0052CC",
        "secondaryColor": "#1f2937",
        "logoUrl": null
      };
      
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
        JSON.stringify(defaultSettings),
        JSON.stringify(defaultBranding)
      ]);
      
      console.log('✅ Default template created successfully');
    }
  } catch (error) {
    console.error('⚠️ Error ensuring default template exists:', error);
  }
}

/**
 * GET /api/templates/quotation
 * Get all enhanced templates for quotation printing (frontend compatibility)
 */
router.get('/quotation', async (req, res) => {
  try {
    console.log('📋 [Enhanced Templates] Loading templates for quotation printing');
    
    // Try database first
    try {
      const client = new Client(dbConfig);
      await client.connect();
      
      try {
        const query = `
          SELECT 
            id, name, description, theme, category, 
            is_default, is_active, created_by, created_at, updated_at
          FROM enhanced_templates 
          WHERE is_active = true
          ORDER BY is_default DESC, updated_at DESC
        `;
        
        const result = await client.query(query);
        
        // Convert to format expected by QuotationPrintSystem
        const templates = result.rows.map(row => ({
          id: row.id, // Keep as string for Enhanced Templates
          name: row.name,
          description: row.description,
          is_active: row.is_active,
          is_default: row.is_default,
          theme: row.theme,
          category: row.category
        }));
        
        console.log(`✅ [Enhanced Templates] Found ${templates.length} active templates for quotation printing`);
        
        res.json({
          success: true,
          templates: templates,
          count: templates.length
        });
        
      } finally {
        await client.end();
      }
      
    } catch (dbError) {
      console.warn('⚠️ [Enhanced Templates] Database error, using fallback templates:', dbError.message);
      
      // Fallback templates when database is unavailable
      const fallbackTemplates = [
        {
          id: 'tpl_default_001',
          name: 'ASP Cranes Professional',
          description: 'Professional quotation template with company branding',
          is_active: true,
          is_default: true,
          theme: 'PROFESSIONAL',
          category: 'quotation'
        },
        {
          id: 'tpl_simple_001',
          name: 'Simple Clean',
          description: 'Clean and simple quotation layout',
          is_active: true,
          is_default: false,
          theme: 'MINIMAL',
          category: 'quotation'
        }
      ];
      
      console.log(`✅ [Enhanced Templates] Using ${fallbackTemplates.length} fallback templates`);
      
      res.json({
        success: true,
        templates: fallbackTemplates,
        count: fallbackTemplates.length,
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('❌ [Enhanced Templates] Critical error loading quotation templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quotation templates',
      message: error.message
    });
  }
});

/**
 * GET /api/templates/enhanced/list
 * Get all enhanced templates with filtering and pagination
 * Note: Made this endpoint less restrictive for demo purposes
 */
router.get('/list', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = null;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, continuing without auth');
      }
    }
    
    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });
    
    let templates = [];
    
    try {
      await client.connect();
      
      // Check if enhanced_templates table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'enhanced_templates'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('⚠️ Enhanced templates table does not exist, returning default template');
        templates = [{
          id: 'default_asp_template',
          name: 'Default ASP Cranes Template',
          description: 'Standard quotation template for ASP Cranes',
          theme: 'PROFESSIONAL',
          category: 'quotation',
          is_default: true,
          is_active: true,
          created_at: new Date().toISOString(),
          elements: []
        }];
      } else {
        // Ensure default template exists
        await ensureDefaultTemplate(client);
        
        // Get templates from database
        const result = await client.query(`
          SELECT id, name, description, theme, is_default, is_active, created_at, updated_at, elements
          FROM enhanced_templates 
          WHERE is_active = true 
          ORDER BY is_default DESC, created_at DESC
        `);
        
        templates = result.rows;
      }
    } catch (dbError) {
      console.error('Database error, using fallback templates:', dbError.message);
      templates = [{
        id: 'default_asp_template',
        name: 'Default ASP Cranes Template',
        description: 'Standard quotation template for ASP Cranes (fallback)',
        theme: 'PROFESSIONAL',
        category: 'quotation',
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
        elements: []
      }];
    } finally {
      try {
        await client.end();
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    
    res.json({
      success: true,
      data: templates,
      total: templates.length,
      message: templates.length > 0 ? 'Templates loaded successfully' : 'No templates found'
    });
    
  } catch (error) {
    console.error('Enhanced Template List Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load templates: ' + error.message,
      fallback: true
    });
  }
});

/**
 * GET /api/templates/enhanced/:id
 * Get specific enhanced template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = null;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, continuing without auth');
      }
    }
    
    const { id } = req.params;
    
    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });
    
    await client.connect();
    
    try {
      const query = `
        SELECT id, name, description, theme, category, is_default, is_active,
               created_by, created_at, updated_at, thumbnail, elements, settings, branding
        FROM enhanced_templates 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      const template = result.rows[0];
      
      // Debug: log element types
      console.log('🔍 [DEBUG] Template elements from DB:', template.elements);
      if (template.elements && Array.isArray(template.elements)) {
        console.log('🔍 [DEBUG] Element types found:', template.elements.map(el => el.type));
      }
      
      res.json({
        success: true,
        data: {
          id: template.id,
          name: template.name,
          description: template.description,
          theme: template.theme,
          category: template.category,
          isDefault: template.is_default,
          isActive: template.is_active,
          createdBy: template.created_by,
          createdAt: template.created_at,
          updatedAt: template.updated_at,
          thumbnail: template.thumbnail,
          elements: template.elements || [],
          settings: template.settings || {},
          branding: template.branding || {}
        }
      });
      
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('Error fetching enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
      message: error.message
    });
  }
});

/**
 * PUT /api/templates/enhanced/:id
 * Update existing enhanced template
 */
router.put('/:id', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = { id: 'demo-user' };
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, using demo user');
      }
    }
    
    const { id } = req.params;
    const {
      name,
      description,
      theme,
      category,
      isDefault,
      elements,
      settings,
      branding
    } = req.body;
    
    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });
    
    await client.connect();
    
    try {
      const query = `
        UPDATE enhanced_templates 
        SET name = $2, description = $3, theme = $4, category = $5, 
            is_default = $6, elements = $7, settings = $8, branding = $9
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;
      
      const values = [
        id,
        name,
        description,
        theme,
        category,
        isDefault,
        JSON.stringify(elements || []),
        JSON.stringify(settings || {}),
        JSON.stringify(branding || {})
      ];
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      const updatedTemplate = result.rows[0];
      
      res.json({
        success: true,
        data: {
          id: updatedTemplate.id,
          name: updatedTemplate.name,
          description: updatedTemplate.description,
          theme: updatedTemplate.theme,
          category: updatedTemplate.category,
          isDefault: updatedTemplate.is_default,
          isActive: updatedTemplate.is_active,
          createdBy: updatedTemplate.created_by,
          createdAt: updatedTemplate.created_at,
          updatedAt: updatedTemplate.updated_at,
          elements: updatedTemplate.elements,
          settings: updatedTemplate.settings,
          branding: updatedTemplate.branding
        },
        message: 'Enhanced template updated successfully'
      });
      
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('Error updating enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update enhanced template',
      message: error.message
    });
  }
});

/**
 * PATCH /api/templates/enhanced/:id
 * Partially update existing enhanced template (alias for PUT)
 */
router.patch('/:id', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = { id: 'demo-user' };
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, using demo user');
      }
    }
    
    const { id } = req.params;
    
    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });
    
    await client.connect();
    
    // Ensure default template exists if this is trying to access it
    if (id === 'tpl_default_001') {
      await ensureDefaultTemplate(client);
    }
    
    try {
      // Get current template data first
      const getCurrentQuery = `
        SELECT * FROM enhanced_templates 
        WHERE id = $1 AND is_active = true
      `;
      
      const currentResult = await client.query(getCurrentQuery, [id]);
      
      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      const currentTemplate = currentResult.rows[0];
      
      // Merge the updates with current data
      const updates = req.body;
      const updatedData = {
        name: updates.name !== undefined ? updates.name : currentTemplate.name,
        description: updates.description !== undefined ? updates.description : currentTemplate.description,
        theme: updates.theme !== undefined ? updates.theme : currentTemplate.theme,
        category: updates.category !== undefined ? updates.category : currentTemplate.category,
        is_default: updates.isDefault !== undefined ? updates.isDefault : currentTemplate.is_default,
        elements: updates.elements !== undefined ? updates.elements : currentTemplate.elements,
        settings: updates.settings !== undefined ? updates.settings : currentTemplate.settings,
        branding: updates.branding !== undefined ? updates.branding : currentTemplate.branding
      };
      
      // If setting this template as default, unset all other defaults first
      if (updates.isDefault === true) {
        await client.query(`UPDATE enhanced_templates SET is_default = false WHERE is_active = true`);
      }
      
      const updateQuery = `
        UPDATE enhanced_templates 
        SET name = $2, description = $3, theme = $4, category = $5, 
            is_default = $6, elements = $7, settings = $8, branding = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [
        id,
        updatedData.name,
        updatedData.description,
        updatedData.theme,
        updatedData.category,
        updatedData.is_default,
        updatedData.elements,
        updatedData.settings,
        updatedData.branding
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found or update failed'
        });
      }
      
      const updatedTemplate = result.rows[0];
      
      res.json({
        success: true,
        data: {
          id: updatedTemplate.id,
          name: updatedTemplate.name,
          description: updatedTemplate.description,
          theme: updatedTemplate.theme,
          category: updatedTemplate.category,
          isDefault: updatedTemplate.is_default,
          isActive: updatedTemplate.is_active,
          createdBy: updatedTemplate.created_by,
          createdAt: updatedTemplate.created_at,
          updatedAt: updatedTemplate.updated_at,
          elements: updatedTemplate.elements,
          settings: updatedTemplate.settings,
          branding: updatedTemplate.branding
        },
        message: 'Enhanced template updated successfully'
      });
      
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('Error patching enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update enhanced template',
      message: error.message
    });
  }
});

/**
 * DELETE /api/templates/enhanced/:id
 * Delete enhanced template (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = { id: 'demo-user' };
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, using demo user');
      }
    }
    
    const { id } = req.params;
    
    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });
    
    await client.connect();
    
    try {
      // Soft delete by setting is_active to false
      const query = `
        UPDATE enhanced_templates 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING id, name
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Enhanced template deleted successfully'
      });
      
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('Error deleting enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete enhanced template',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/preview
 * Generate template preview with advanced options
 * Note: Made more flexible for demo purposes
 */
router.post('/preview', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = null;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, continuing with demo preview');
      }
    }
    
    const { templateData, quotationData, format = 'html', options = {} } = req.body;
    
    // Debug: log template data
    console.log('🔍 [DEBUG] Preview template data:', templateData);
    if (templateData.elements && Array.isArray(templateData.elements)) {
      console.log('🔍 [DEBUG] Preview element types:', templateData.elements.map(el => el.type));
    }
    console.log('🔍 [DEBUG] Preview quotation data:', quotationData);
    
    const templateBuilder = new EnhancedTemplateBuilder();
    
    // Always create template from data for preview (don't try to load from DB)
    templateBuilder.createTemplate(templateData);
    
    // If no quotation data provided, get sample data
    let finalQuotationData = quotationData;
    if (!finalQuotationData) {
      console.log('📝 No quotation data provided, using sample data');
      finalQuotationData = templateBuilder.getSampleQuotationData();
    }
    
    if (format === 'html') {
      const html = templateBuilder.generatePreviewHTML(finalQuotationData);
      res.json({
        success: true,
        data: { html },
        format: 'html',
        timestamp: new Date()
      });
    } else if (format === 'pdf') {
      const html = templateBuilder.generateQuotationHTML(finalQuotationData);
      const pdfGenerator = new AdvancedPDFGenerator();
      
      const pdfOptions = {
        format: options.format || 'A4',
        orientation: options.orientation || 'portrait',
        quality: options.quality || 'STANDARD',
        margins: options.margins
      };
      
      const pdfBuffer = await pdfGenerator.generatePDF(html, pdfOptions);
      await pdfGenerator.cleanup();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
      res.send(pdfBuffer);
    }
  } catch (error) {
    console.error('Error generating enhanced preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/generate-pdf
 * Generate advanced PDF from template and quotation data
 */
router.post('/generate-pdf', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = null;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, continuing with demo PDF generation');
      }
    }
    const {
      templateId,
      quotationData,
      options = {},
      filename
    } = req.body;
    
    console.log('🎨 [Enhanced PDF] Generating PDF with advanced options...');
    console.log('📋 Template ID:', templateId);
    console.log('⚙️ Options:', options);
    
    const templateBuilder = new EnhancedTemplateBuilder();
    await templateBuilder.loadTemplate(templateId);
    
    const html = templateBuilder.generateQuotationHTML(quotationData);
    const pdfGenerator = new AdvancedPDFGenerator();
    
    const pdfOptions = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      quality: options.quality || 'STANDARD',
      margins: options.margins,
      displayHeaderFooter: options.headerFooter || false,
      printBackground: true,
      ...options
    };
    
    console.log('🔧 PDF Options:', pdfOptions);
    
    let pdfBuffer;
    
    if (options.watermark) {
      console.log('💧 Adding watermark...');
      pdfBuffer = await pdfGenerator.generatePDFWithWatermark(html, options.watermark, pdfOptions);
    } else if (options.headerFooter) {
      console.log('📄 Adding header/footer...');
      pdfBuffer = await pdfGenerator.generatePDFWithHeaderFooter(html, options.headerFooter, pdfOptions);
    } else {
      console.log('📝 Generating standard PDF...');
      pdfBuffer = await pdfGenerator.generatePDF(html, pdfOptions);
    }
    
    await pdfGenerator.cleanup();
    
    const downloadFilename = filename || `quotation_${quotationData.quotation?.number || Date.now()}.pdf`;
    
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generating enhanced PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/generate-quotation-pdf
 * Generate PDF for specific quotation using enhanced template
 */
router.post('/generate-quotation-pdf', authenticateToken, async (req, res) => {
  try {
    const { quotationId, templateId, options = {} } = req.body;
    
    console.log('🎯 [Enhanced Quotation PDF] Starting generation...');
    console.log('📋 Quotation ID:', quotationId);
    console.log('🎨 Template ID:', templateId);
    
    // Fetch quotation data from your existing system
    // This should integrate with your existing quotation fetching logic
    const quotationData = await getQuotationData(quotationId);
    
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }
    
    const templateBuilder = new EnhancedTemplateBuilder();
    
    if (templateId) {
      await templateBuilder.loadTemplate(templateId);
    } else {
      // Use default template or create a basic one
      templateBuilder.createTemplate({
        name: 'Default Enhanced Template',
        theme: 'PROFESSIONAL',
        elements: this.createDefaultElements()
      });
    }
    
    const html = templateBuilder.generateQuotationHTML(quotationData);
    const pdfGenerator = new AdvancedPDFGenerator();
    
    const pdfOptions = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      quality: options.quality || 'HIGH', // Use high quality for final documents
      margins: options.margins || { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      displayHeaderFooter: false,
      printBackground: true,
      ...options
    };
    
    const pdfBuffer = await pdfGenerator.generatePDF(html, pdfOptions);
    await pdfGenerator.cleanup();
    
    const filename = `ASP_Quotation_${quotationData.quotation?.number || quotationId}.pdf`;
    
    console.log('✅ Enhanced quotation PDF generated successfully');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generating enhanced quotation PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced quotation PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/batch-pdf
 * Generate multiple PDFs from template
 */
router.post('/batch-pdf', authenticateToken, async (req, res) => {
  try {
    const {
      templateId,
      quotations,
      options = {}
    } = req.body;
    
    console.log('📚 [Batch PDF] Starting batch generation...');
    console.log('📋 Template ID:', templateId);
    console.log('📊 Quotations count:', quotations.length);
    
    const templateBuilder = new EnhancedTemplateBuilder();
    await templateBuilder.loadTemplate(templateId);
    
    const htmlContents = quotations.map(quotationData => 
      templateBuilder.generateQuotationHTML(quotationData)
    );
    
    const pdfGenerator = new AdvancedPDFGenerator();
    const results = await pdfGenerator.batchGeneratePDFs(htmlContents, options);
    
    await pdfGenerator.cleanup();
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Batch PDF generation completed: ${successful.length}/${results.length} successful`);
    
    res.json({
      success: true,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results.map(r => ({
          index: r.index,
          success: r.success,
          error: r.error || null,
          size: r.buffer ? r.buffer.length : 0
        }))
      },
      message: `Generated ${successful.length} of ${results.length} PDFs successfully`
    });
    
  } catch (error) {
    console.error('❌ Error in batch PDF generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch PDFs',
      message: error.message
    });
  }
});

// Duplicate route removed - using the unified sample-data endpoint above

/**
 * POST /api/templates/enhanced/upload-logo
 * Upload a logo for template branding
 */
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    // Check for auth but don't require it for demo purposes
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        user = decoded;
      } catch (authError) {
        console.warn('Logo upload auth warning (continuing in demo mode):', authError.message);
      }
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No logo file uploaded'
      });
    }
    
    const logoInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      logoUrl: `/uploads/templates/${req.file.filename}`,
      uploadedBy: user?.id || 'demo',
      uploadedAt: new Date()
    };
    
    res.json({
      success: true,
      data: logoInfo,
      message: 'Logo uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload logo'
    });
  }
});

/**
 * POST /api/templates/enhanced/upload-asset
 * Upload template asset (logo, image, etc.)
 */
router.post('/upload-asset', authenticateToken, upload.single('asset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const assetInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/templates/${req.file.filename}`,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };
    
    res.json({
      success: true,
      data: assetInfo,
      message: 'Asset uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload asset',
      message: error.message
    });
  }
});

/**
 * Helper function to get quotation data
 * This should integrate with your existing quotation system
 */
async function getQuotationData(quotationId) {
  console.log('🔍 Fetching quotation data for ID:', quotationId);
  
  try {
    // Connect directly to database to fetch quotation data
    const pg = await import('pg');
    const pool = new pg.default.Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21'
    });
    
    const client = await pool.connect();
    
    try {
      // Fetch quotation data from database
      const quotationResult = await client.query(
        'SELECT * FROM quotations WHERE id = $1', 
        [quotationId]
      );
      
      if (quotationResult.rows.length === 0) {
        console.log('❌ Quotation not found:', quotationId);
        return null;
      }
      
      const quotationRow = quotationResult.rows[0];
      console.log('✅ Quotation found:', quotationRow.quotation_number);
      console.log('🔍 Machine type:', quotationRow.machine_type);
      console.log('🔍 Customer:', quotationRow.customer_name);
      
      // Parse customer_contact JSON if it exists
      let customerContact = {};
      try {
        if (quotationRow.customer_contact) {
          customerContact = typeof quotationRow.customer_contact === 'string' 
            ? JSON.parse(quotationRow.customer_contact) 
            : quotationRow.customer_contact;
        }
      } catch (parseError) {
        console.log('⚠️ Error parsing customer_contact:', parseError.message);
      }
      
      // Transform database data to template format
      const templateData = {
        company: {
          name: 'ASP Cranes Pvt. Ltd.',
          address: 'Industrial Area, Pune, Maharashtra 411019',
          phone: '+91 99999 88888',
          email: 'sales@aspcranes.com',
          website: 'www.aspcranes.com'
        },
        client: {
          name: customerContact.name || quotationRow.customer_name || 'Client Name',
          company: customerContact.company || 'Client Company',
          address: customerContact.address || quotationRow.address || 'Client Address',
          phone: customerContact.phone || 'Client Phone',
          email: customerContact.email || 'client@email.com'
        },
        quotation: {
          number: quotationRow.quotation_number || `QUO-${quotationId}`,
          date: new Date(quotationRow.created_at).toLocaleDateString('en-IN'),
          validUntil: quotationRow.valid_until 
            ? new Date(quotationRow.valid_until).toLocaleDateString('en-IN')
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
          paymentTerms: '50% advance, balance on completion',
          terms: 'This quotation is valid for 30 days. All rates are inclusive of GST.'
        },
        // Create items array from quotation data since selectedMachines might not exist
        items: [{
          no: 1,
          description: `${quotationRow.machine_type.replace('_', ' ').toUpperCase()} - Rental Service`,
          jobType: quotationRow.order_type || 'Standard',
          quantity: 1,
          duration: `${quotationRow.number_of_days} days`,
          rate: quotationRow.working_cost 
            ? `₹${Math.round(quotationRow.working_cost / quotationRow.number_of_days).toLocaleString('en-IN')}/day`
            : '₹0/day',
          rental: `₹${Math.round(quotationRow.working_cost || 0).toLocaleString('en-IN')}`,
          mobDemob: `₹${Math.round(quotationRow.mob_demob_cost || 0).toLocaleString('en-IN')}`
        }],
        totals: {
          subtotal: `₹${Math.round((quotationRow.total_cost || 0) - (quotationRow.gst_amount || 0)).toLocaleString('en-IN')}`,
          discount: '₹0',
          tax: `₹${Math.round(quotationRow.gst_amount || 0).toLocaleString('en-IN')}`,
          total: `₹${Math.round(quotationRow.total_cost || 0).toLocaleString('en-IN')}`
        }
      };
      
      console.log('📋 Template data prepared:', {
        itemsCount: templateData.items.length,
        customerName: templateData.client.name,
        quotationNumber: templateData.quotation.number
      });
      
      return templateData;
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Error fetching quotation data:', error);
    // Return sample data as fallback
    const templateBuilder = new EnhancedTemplateBuilder();
    return templateBuilder.getSampleQuotationData();
  }
}

/**
 * Helper function to create default template elements
 */
function createDefaultElements() {
  return [
    {
      type: TEMPLATE_ELEMENT_TYPES.HEADER,
      content: {
        title: 'ASP CRANES PVT. LTD.',
        subtitle: 'QUOTATION',
        alignment: 'center'
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.COMPANY_INFO,
      content: {
        fields: [
          '{{company.name}}',
          '{{company.address}}',
          '{{company.phone}}',
          '{{company.email}}'
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.CLIENT_INFO,
      content: {
        title: 'Bill To:',
        fields: [
          '{{client.name}}',
          '{{client.address}}',
          '{{client.phone}}',
          '{{client.email}}'
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.QUOTATION_INFO,
      content: {
        fields: [
          { label: 'Quotation #', value: '{{quotation.number}}' },
          { label: 'Date', value: '{{quotation.date}}' },
          { label: 'Valid Until', value: '{{quotation.validUntil}}' }
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.ITEMS_TABLE,
      content: {
        columns: [
          { key: 'description', label: 'Description', width: '40%', alignment: 'left' },
          { key: 'quantity', label: 'Qty', width: '15%', alignment: 'center' },
          { key: 'rate', label: 'Rate', width: '20%', alignment: 'right' },
          { key: 'amount', label: 'Amount', width: '25%', alignment: 'right' }
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.TOTALS,
      content: {
        fields: [
          { label: 'Subtotal', value: '{{totals.subtotal}}', showIf: 'always' },
          { label: 'Tax', value: '{{totals.tax}}', showIf: 'hasTax' },
          { label: 'Total', value: '{{totals.total}}', showIf: 'always', emphasized: true }
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.TERMS,
      content: {
        title: 'Terms & Conditions',
        text: '{{quotation.terms}}'
      }
    }
  ];
}

/**
 * POST /api/templates/enhanced/duplicate
 * Duplicate an existing enhanced template
 */
router.post('/duplicate', async (req, res) => {
  try {
    // Check for authentication but don't require it for demo
    const authHeader = req.headers['authorization'];
    let user = { id: 'demo-user' };
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
      try {
        user = jwt.verify(token, jwtSecret);
      } catch (err) {
        console.log('⚠️ Invalid token provided, using demo user');
      }
    }

    const { templateId, newName } = req.body;

    if (!templateId || !newName) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and new name are required'
      });
    }

    // Database connection
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: (process.env.DB_SSL === 'true') ? true : false
    });

    await client.connect();

    try {
      // First, get the original template
      const getQuery = `
        SELECT name, description, theme, category, elements, settings, branding
        FROM enhanced_templates
        WHERE id = $1 AND is_active = true
      `;
      
      const originalResult = await client.query(getQuery, [templateId]);
      
      if (originalResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Original template not found'
        });
      }

      const original = originalResult.rows[0];

      // Create the duplicate
      const insertQuery = `
        INSERT INTO enhanced_templates (
          name, description, theme, category, elements, settings, branding, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const insertResult = await client.query(insertQuery, [
        newName,
        original.description ? `${original.description} (Copy)` : 'Duplicated template',
        original.theme,
        original.category,
        original.elements,
        original.settings,
        original.branding,
        user.id
      ]);

      const duplicatedTemplate = insertResult.rows[0];

      res.json({
        success: true,
        data: {
          id: duplicatedTemplate.id,
          name: duplicatedTemplate.name,
          description: duplicatedTemplate.description,
          theme: duplicatedTemplate.theme,
          category: duplicatedTemplate.category,
          isDefault: duplicatedTemplate.is_default,
          isActive: duplicatedTemplate.is_active,
          createdBy: duplicatedTemplate.created_by,
          createdAt: duplicatedTemplate.created_at,
          updatedAt: duplicatedTemplate.updated_at,
          elements: duplicatedTemplate.elements,
          settings: duplicatedTemplate.settings,
          branding: duplicatedTemplate.branding
        },
        message: 'Template duplicated successfully'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('Error duplicating enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate enhanced template',
      message: error.message
    });
  }
});

export default router;
