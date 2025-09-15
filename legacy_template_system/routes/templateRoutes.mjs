import express from 'express';
import { authenticateToken } from '../authMiddleware.mjs';
import templateService from '../services/templateService.js';
import { db } from '../lib/dbClient.js';

const router = express.Router();

// GET /api/templates/quotation - Get all quotation templates
router.get('/quotation', async (req, res) => {
  try {
    console.log('📋 Fetching quotation templates...');

    const query = `
      SELECT id, name, description, is_active, is_default, created_at, updated_at
      FROM quotation_templates 
      WHERE is_active = true
      ORDER BY is_default DESC, name ASC
    `;

    const result = await db.query(query);
    console.log(`📋 Found ${result.rows.length} templates`);

    res.json({
      success: true,
      templates: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching quotation templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quotation templates'
    });
  }
});

// GET /api/templates/quotation/:id - Get specific template by ID
router.get('/quotation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching template ID: ${id}`);

    const query = `
      SELECT * FROM quotation_templates 
      WHERE id = $1 AND is_active = true
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template'
    });
  }
});

// POST /api/templates/quotation/create-default - Create a default template if none exists
router.post('/quotation/create-default', async (req, res) => {
  try {
    console.log('🔧 Creating default quotation template...');

    // Check if default template already exists
    const checkQuery = `
      SELECT id FROM quotation_templates 
      WHERE is_default = true AND is_active = true
    `;
    
    const checkResult = await db.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Default template already exists',
        templateId: checkResult.rows[0].id
      });
    }

    // Create default template
    const defaultTemplate = {
      name: 'ASP Cranes Default Template',
      description: 'Default professional quotation template for ASP Cranes',
      elements: [
        {
          id: 'header-1',
          type: 'header',
          content: 'ASP Cranes - Quotation',
          style: {
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#2563eb'
          }
        },
        {
          id: 'company-info',
          type: 'text',
          content: 'Professional Crane Services | Your Trusted Partner',
          style: {
            textAlign: 'center',
            marginBottom: '30px',
            color: '#64748b'
          }
        }
      ],
      styles: {
        container: {
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px',
          fontFamily: 'Arial, sans-serif'
        }
      },
      layout: {
        type: 'single-column',
        sections: ['header', 'details', 'items', 'totals', 'terms']
      },
      is_active: true,
      is_default: true
    };

    const insertQuery = `
      INSERT INTO quotation_templates (name, description, elements, styles, layout, is_active, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const insertResult = await db.query(insertQuery, [
      defaultTemplate.name,
      defaultTemplate.description,
      JSON.stringify(defaultTemplate.elements),
      JSON.stringify(defaultTemplate.styles),
      JSON.stringify(defaultTemplate.layout),
      defaultTemplate.is_active,
      defaultTemplate.is_default
    ]);

    console.log(`✅ Created default template with ID: ${insertResult.rows[0].id}`);

    res.json({
      success: true,
      message: 'Default template created successfully',
      templateId: insertResult.rows[0].id
    });

  } catch (error) {
    console.error('❌ Error creating default template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create default template'
    });
  }
});

// GET /api/templates - Get all templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await templateService.getTemplates();
    res.json({ data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await templateService.getTemplate(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template', error: error.message });
  }
});

// POST /api/templates - Create a new template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newTemplate = await templateService.createTemplate(req.body);
    res.status(201).json({ data: newTemplate });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template', error: error.message });
  }
});

// PATCH /api/templates/:id - Update a template
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedTemplate = await templateService.updateTemplate(req.params.id, req.body);
    res.json({ data: updatedTemplate });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
});

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
});

export default router;
