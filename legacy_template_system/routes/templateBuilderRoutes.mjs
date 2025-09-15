import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import templateBuilderService from '../services/templateBuilderService.js';

const router = express.Router();

// GET /api/templates - Get all templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      category,
      search,
      limit = 50,
      offset = 0,
      includeInactive = false
    } = req.query;

    const options = {
      category,
      searchTerm: search,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeInactive: includeInactive === 'true'
    };

    const templates = await templateBuilderService.getTemplates(options);

    res.json({
      success: true,
      data: templates,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: templates.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateBuilderService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
      message: error.message
    });
  }
});

// GET /api/templates/default/current - Get default template
router.get('/default/current', authenticateToken, async (req, res) => {
  try {
    const template = await templateBuilderService.getDefaultTemplate();

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'No default template found'
      });
    }

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('❌ Error fetching default template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch default template',
      message: error.message
    });
  }
});

// POST /api/templates - Create new template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Validate elements
    if (templateData.elements) {
      templateBuilderService.validateTemplateElements(templateData.elements);
    }

    const template = await templateBuilderService.saveTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating template:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create template',
      message: error.message
    });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;

    // Validate elements if provided
    if (templateData.elements) {
      templateBuilderService.validateTemplateElements(templateData.elements);
    }

    const template = await templateBuilderService.updateTemplate(id, templateData);

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating template:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update template',
      message: error.message
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await templateBuilderService.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error.message
    });
  }
});

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const template = await templateBuilderService.duplicateTemplate(id, name);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template duplicated successfully'
    });

  } catch (error) {
    console.error('❌ Error duplicating template:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to duplicate template',
      message: error.message
    });
  }
});

// POST /api/templates/:id/set-default - Set template as default
router.post('/:id/set-default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateBuilderService.setAsDefault(id);

    res.json({
      success: true,
      data: template,
      message: 'Template set as default successfully'
    });

  } catch (error) {
    console.error('❌ Error setting template as default:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set template as default',
      message: error.message
    });
  }
});

// POST /api/templates/validate - Validate template structure
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { elements } = req.body;

    if (!elements) {
      return res.status(400).json({
        success: false,
        error: 'Elements are required for validation'
      });
    }

    templateBuilderService.validateTemplateElements(elements);

    res.json({
      success: true,
      message: 'Template structure is valid'
    });

  } catch (error) {
    console.error('❌ Template validation error:', error);
    res.status(400).json({
      success: false,
      error: 'Template validation failed',
      message: error.message
    });
  }
});

export default router;
