import express from 'express';
import { authenticateToken } from '../authMiddleware.mjs';
import modernTemplateService from '../services/modernTemplateService.js';

const router = express.Router();

console.log('🚀 Modern template routes loaded with best-in-class features');

// GET /api/templates/modern - Get templates with search, filtering, and pagination
router.get('/', authenticateToken, async (req, res) => {
  console.log('📋 Modern templates GET route hit');
  try {
    const {
      search = '',
      category = null,
      isActive = 'true',
      limit = '20',
      offset = '0',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      search: search.trim(),
      category: category || null,
      isActive: isActive === 'true',
      limit: Math.min(parseInt(limit) || 20, 100), // Cap at 100
      offset: parseInt(offset) || 0,
      sortBy: ['created_at', 'updated_at', 'name', 'usage_count'].includes(sortBy) ? sortBy : 'created_at',
      sortOrder: ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'
    };

    const templates = await modernTemplateService.getTemplates(options);
    
    console.log('📋 Found templates:', templates.length);
    res.json({ 
      data: templates,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        hasMore: templates.length === options.limit
      }
    });
  } catch (error) {
    console.error('Error fetching modern templates:', error);
    res.status(500).json({ message: 'Failed to fetch modern templates', error: error.message });
  }
});

// GET /api/templates/modern/categories - Get template categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await modernTemplateService.getCategories();
    res.json({ data: categories });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// GET /api/templates/modern/statistics - Get template statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const stats = await modernTemplateService.getStatistics();
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching template statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
});

// GET /api/templates/modern/:id - Get a specific modern template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await modernTemplateService.getTemplateById(req.params.id);
    
    // Increment usage count when template is accessed for viewing/editing
    if (req.query.incrementUsage === 'true') {
      await modernTemplateService.incrementUsage(req.params.id);
    }
    
    res.json({ data: template });
  } catch (error) {
    console.error('Error fetching modern template:', error);
    if (error.message === 'Template not found') {
      res.status(404).json({ message: 'Template not found' });
    } else {
      res.status(500).json({ message: 'Failed to fetch modern template', error: error.message });
    }
  }
});

// GET /api/templates/modern/:id/history - Get template history
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { limit = '10', offset = '0' } = req.query;
    const history = await modernTemplateService.getTemplateHistory(
      req.params.id,
      Math.min(parseInt(limit) || 10, 50), // Cap at 50
      parseInt(offset) || 0
    );
    
    res.json({ 
      data: history,
      pagination: {
        limit: parseInt(limit) || 10,
        offset: parseInt(offset) || 0,
        hasMore: history.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching template history:', error);
    res.status(500).json({ message: 'Failed to fetch template history', error: error.message });
  }
});

// POST /api/templates/modern - Create a new modern template
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Validate required fields
    const { name, elements } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required' });
    }
    
    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({ message: 'Template elements must be an array' });
    }

    // Add the authenticated user as the creator
    const templateData = {
      ...req.body,
      createdBy: req.user?.id || 'usr_admin01'
    };
    
    const newTemplate = await modernTemplateService.createTemplate(templateData);
    
    console.log('✅ Template created:', newTemplate.id);
    res.status(201).json({ 
      data: newTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating modern template:', error);
    
    if (error.message.includes('Template name') || error.message.includes('validation')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create modern template', error: error.message });
    }
  }
});

// PATCH /api/templates/modern/:id - Update a modern template with optimistic locking
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { version } = req.body;
    const expectedVersion = version ? parseInt(version) : null;
    
    // Remove version from update data
    const { version: _, ...updateData } = req.body;
    
    const updatedTemplate = await modernTemplateService.updateTemplate(
      req.params.id, 
      updateData, 
      expectedVersion
    );
    
    console.log('✅ Template updated:', updatedTemplate.id, 'version:', updatedTemplate.version);
    res.json({ 
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating modern template:', error);
    
    if (error.message.includes('Version conflict')) {
      res.status(409).json({ message: error.message, code: 'VERSION_CONFLICT' });
    } else if (error.message.includes('validation') || error.message.includes('not found')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update modern template', error: error.message });
    }
  }
});

// PUT /api/templates/modern/:id/default - Set template as default
router.put('/:id/default', authenticateToken, async (req, res) => {
  try {
    await modernTemplateService.setDefaultTemplate(req.params.id);
    
    console.log('✅ Default template set:', req.params.id);
    res.json({ 
      success: true,
      message: 'Template set as default successfully'
    });
  } catch (error) {
    console.error('Error setting default template:', error);
    res.status(500).json({ message: 'Failed to set default template', error: error.message });
  }
});

// POST /api/templates/modern/:id/usage - Increment usage count
router.post('/:id/usage', authenticateToken, async (req, res) => {
  try {
    await modernTemplateService.incrementUsage(req.params.id);
    
    res.json({ 
      success: true,
      message: 'Usage count incremented'
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ message: 'Failed to increment usage', error: error.message });
  }
});

// DELETE /api/templates/modern/:id - Soft delete a modern template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await modernTemplateService.deleteTemplate(req.params.id);
    
    console.log('✅ Template deleted (soft):', req.params.id);
    res.json({ 
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting modern template:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete modern template', error: error.message });
    }
  }
});

export default router;
