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
  res.json({
    success: true,
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
 * Get sample data for template building
 */
router.get('/sample-data', async (req, res) => {
  try {
    const sampleData = {
      companies: [
        {
          id: 1,
          name: "ASP Cranes Ltd",
          address: "123 Industrial Park, Mumbai, Maharashtra 400001",
          phone: "+91 22 1234 5678",
          email: "info@aspcranes.com",
          website: "www.aspcranes.com",
          gstin: "27ABCDE1234F1Z5",
          logo: "/assets/asp-logo.jpg"
        }
      ],
      equipment: [
        {
          id: 1,
          name: "Mobile Crane 50T",
          description: "50 Ton Mobile Crane with Telescopic Boom",
          rate: 5000,
          unit: "per day",
          category: "Mobile Cranes"
        },
        {
          id: 2,
          name: "Tower Crane TCR-60",
          description: "60m Jib Tower Crane",
          rate: 15000,
          unit: "per month",
          category: "Tower Cranes"
        },
        {
          id: 3,
          name: "Crawler Crane 80T",
          description: "80 Ton Crawler Crane",
          rate: 8000,
          unit: "per day",
          category: "Crawler Cranes"
        }
      ],
      customers: [
        {
          id: 1,
          name: "Construction Corp Ltd",
          address: "456 Builder Street, Mumbai 400002",
          contact: "Rajesh Kumar",
          phone: "+91 98765 43210",
          email: "rajesh@constructioncorp.com",
          gstin: "27FGHIJ5678K2L9"
        },
        {
          id: 2,
          name: "Infrastructure Builders",
          address: "789 Project Road, Mumbai 400003",
          contact: "Priya Sharma",
          phone: "+91 87654 32109",
          email: "priya@infrabuilders.com",
          gstin: "27MNOPQ9012R3S4"
        }
      ],
      projects: [
        {
          id: 1,
          name: "High-Rise Construction Project",
          location: "Bandra, Mumbai",
          startDate: "2024-01-15",
          endDate: "2024-12-31",
          description: "40-story residential tower construction"
        },
        {
          id: 2,
          name: "Bridge Construction",
          location: "JVLR, Mumbai",
          startDate: "2024-02-01",
          endDate: "2024-08-31",
          description: "Flyover bridge construction project"
        }
      ]
    };

    res.json({
      success: true,
      data: sampleData,
      message: 'Sample data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving sample data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sample data',
      message: error.message
    });
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
    
  } catch (error) {
    console.error('❌ [Enhanced Templates] Error loading quotation templates:', error);
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
    
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      theme = '',
      isActive = true 
    } = req.query;
    
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
    
    // Ensure default template exists
    await ensureDefaultTemplate(client);
    
    try {
      // Build query with filters
      let whereClause = 'WHERE 1=1';
      const queryParams = [];
      let paramCount = 0;
      
      if (search) {
        paramCount++;
        whereClause += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }
      
      if (category) {
        paramCount++;
        whereClause += ` AND category = $${paramCount}`;
        queryParams.push(category);
      }
      
      if (theme) {
        paramCount++;
        whereClause += ` AND theme = $${paramCount}`;
        queryParams.push(theme);
      }
      
      if (isActive !== undefined) {
        paramCount++;
        whereClause += ` AND is_active = $${paramCount}`;
        queryParams.push(isActive);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM enhanced_templates ${whereClause}`;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);
      
      // Get paginated results
      const offset = (page - 1) * limit;
      paramCount++;
      const limitParam = paramCount;
      paramCount++;
      const offsetParam = paramCount;
      
      const query = `
        SELECT id, name, description, theme, category, is_default, is_active, 
               created_by, created_at, updated_at, thumbnail, elements, settings, branding
        FROM enhanced_templates 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;
      
      queryParams.push(limit, offset);
      const result = await client.query(query, queryParams);
      
      const templates = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        theme: row.theme,
        category: row.category,
        isDefault: row.is_default,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        thumbnail: row.thumbnail,
        elements: row.elements || [],
        settings: row.settings || {},
        branding: row.branding || {}
      }));
      
      res.json({
        success: true,
        data: templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        },
        authenticated: !!user
      });
      
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('Error fetching enhanced templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced templates',
      message: error.message
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
    
    const templateBuilder = new EnhancedTemplateBuilder();
    
    // Always create template from data for preview (don't try to load from DB)
    templateBuilder.createTemplate(templateData);
    
    if (format === 'html') {
      const html = templateBuilder.generatePreviewHTML(quotationData);
      res.json({
        success: true,
        data: { html },
        format: 'html',
        timestamp: new Date()
      });
    } else if (format === 'pdf') {
      const html = templateBuilder.generateQuotationHTML(quotationData);
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

/**
 * GET /api/templates/enhanced/sample-data
 * Get sample quotation data for preview
 */
router.get('/sample-data', (req, res) => {
  const templateBuilder = new EnhancedTemplateBuilder();
  const sampleData = templateBuilder.getSampleQuotationData();
  
  res.json({
    success: true,
    data: sampleData,
    message: 'Sample data retrieved successfully'
  });
});

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
  // This is a placeholder - integrate with your existing quotation fetching logic
  // You should replace this with actual database query from your quotation system
  
  console.log('🔍 Fetching quotation data for ID:', quotationId);
  
  // Return sample data for now - replace with actual implementation
  const templateBuilder = new EnhancedTemplateBuilder();
  return {
    ...templateBuilder.getSampleQuotationData(),
    quotation: {
      ...templateBuilder.getSampleQuotationData().quotation,
      number: `QUO-${quotationId}`,
      id: quotationId
    }
  };
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
