import express from 'express';
import { authenticateToken } from '../authMiddleware.mjs';
import modernTemplateService from '../services/modernTemplateService.js';

const router = express.Router();

console.log('🚀 Enhanced Modern template routes loaded with SuiteCRM-inspired features');

// GET /api/templates/modern - Get templates with advanced search, filtering, and pagination
router.get('/', authenticateToken, async (req, res) => {
  console.log('📋 Enhanced templates GET route hit');
  try {
    const {
      search = '',
      category = null,
      isActive = 'true',
      limit = '20',
      offset = '0',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      tags = '',
      includeShared = 'false',
      includeAnalytics = 'false'
    } = req.query;

    const options = {
      search: search.trim(),
      category: category || null,
      isActive: isActive === 'true',
      limit: Math.min(parseInt(limit) || 20, 100),
      offset: parseInt(offset) || 0,
      sortBy: ['created_at', 'updated_at', 'name', 'usage_count'].includes(sortBy) ? sortBy : 'created_at',
      sortOrder: ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      includeShared: includeShared === 'true',
      includeAnalytics: includeAnalytics === 'true',
      userId: req.user.uid
    };

    const result = await modernTemplateService.getTemplatesEnhanced(options);
    
    console.log('📋 Found enhanced templates:', result.templates.length);
    res.json({ 
      data: result.templates,
      analytics: result.analytics,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: result.total,
        hasMore: (options.offset + result.templates.length) < result.total
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced templates:', error);
    res.status(500).json({ message: 'Failed to fetch enhanced templates', error: error.message });
  }
});

// GET /api/templates/modern/categories - Get template categories with usage stats
router.get('/categories', authenticateToken, async (req, res) => {
  console.log('📁 Template categories GET route hit');
  try {
    const includeStats = req.query.includeStats === 'true';
    const categories = await modernTemplateService.getCategories(includeStats);
    
    console.log('📁 Found categories:', categories.length);
    res.json({ data: categories });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({ message: 'Failed to fetch template categories', error: error.message });
  }
});

// GET /api/templates/modern/analytics - Get comprehensive template analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  console.log('📊 Template analytics GET route hit');
  try {
    const {
      dateFrom = null,
      dateTo = null,
      templateIds = '',
      groupBy = 'month'
    } = req.query;

    const options = {
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      templateIds: templateIds ? templateIds.split(',') : [],
      groupBy: ['day', 'week', 'month', 'year'].includes(groupBy) ? groupBy : 'month',
      userId: req.user.uid
    };

    const analytics = await modernTemplateService.getAnalytics(options);
    
    console.log('📊 Template analytics generated');
    res.json({ data: analytics });
  } catch (error) {
    console.error('Error fetching template analytics:', error);
    res.status(500).json({ message: 'Failed to fetch template analytics', error: error.message });
  }
});

// GET /api/templates/modern/:id - Get specific template with optional version
router.get('/:id', authenticateToken, async (req, res) => {
  console.log('📄 Template detail GET route hit for ID:', req.params.id);
  try {
    const { version = null, includeHistory = 'false' } = req.query;
    
    const template = await modernTemplateService.getTemplateById(
      req.params.id, 
      {
        version: version ? parseInt(version) : null,
        includeHistory: includeHistory === 'true',
        userId: req.user.uid
      }
    );
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    console.log('📄 Template found:', template.name);
    res.json({ data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template', error: error.message });
  }
});

// GET /api/templates/modern/:id/versions - Get template version history
router.get('/:id/versions', authenticateToken, async (req, res) => {
  console.log('🕒 Template versions GET route hit for ID:', req.params.id);
  try {
    const versions = await modernTemplateService.getTemplateVersions(req.params.id);
    
    console.log('🕒 Found versions:', versions.length);
    res.json({ data: versions });
  } catch (error) {
    console.error('Error fetching template versions:', error);
    res.status(500).json({ message: 'Failed to fetch template versions', error: error.message });
  }
});

// GET /api/templates/modern/:id/history - Get template change history
router.get('/:id/history', authenticateToken, async (req, res) => {
  console.log('📜 Template history GET route hit for ID:', req.params.id);
  try {
    const { limit = '50', offset = '0' } = req.query;
    
    const history = await modernTemplateService.getTemplateHistory(req.params.id, {
      limit: Math.min(parseInt(limit) || 50, 200),
      offset: parseInt(offset) || 0
    });
    
    console.log('📜 Found history entries:', history.length);
    res.json({ data: history });
  } catch (error) {
    console.error('Error fetching template history:', error);
    res.status(500).json({ message: 'Failed to fetch template history', error: error.message });
  }
});

// POST /api/templates/modern - Create new template with enhanced features
router.post('/', authenticateToken, async (req, res) => {
  console.log('💾 Enhanced template creation POST route hit');
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.uid,
      elements: req.body.elements || [],
      styles: req.body.styles || {},
      layout: req.body.layout || {},
      tags: req.body.tags || [],
      category: req.body.category || 'general',
      isActive: req.body.isActive !== false,
      version: 1
    };

    // Validate required fields
    if (!templateData.name || !templateData.name.trim()) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    if (!templateData.elements || templateData.elements.length === 0) {
      return res.status(400).json({ message: 'Template must have at least one element' });
    }

    const template = await modernTemplateService.createTemplateEnhanced(templateData);
    
    console.log('💾 Enhanced template created:', template.id);
    res.status(201).json({ 
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating enhanced template:', error);
    res.status(500).json({ message: 'Failed to create template', error: error.message });
  }
});

// PUT /api/templates/modern/:id - Update template with versioning
router.put('/:id', authenticateToken, async (req, res) => {
  console.log('📝 Enhanced template update PUT route hit for ID:', req.params.id);
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.uid
    };

    // Check if user has permission to edit
    const hasPermission = await modernTemplateService.checkEditPermission(req.params.id, req.user.uid);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to edit this template' });
    }

    const template = await modernTemplateService.updateTemplateEnhanced(req.params.id, updateData);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    console.log('📝 Enhanced template updated:', template.id);
    res.json({ 
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating enhanced template:', error);
    res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
});

// POST /api/templates/modern/:id/clone - Clone template with new name
router.post('/:id/clone', authenticateToken, async (req, res) => {
  console.log('📋 Template clone POST route hit for ID:', req.params.id);
  try {
    const { name, description, category } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'New template name is required' });
    }

    const clonedTemplate = await modernTemplateService.cloneTemplate(req.params.id, {
      name: name.trim(),
      description: description || '',
      category: category || 'general',
      clonedBy: req.user.uid
    });
    
    console.log('📋 Template cloned:', clonedTemplate.id);
    res.status(201).json({ 
      data: clonedTemplate,
      message: 'Template cloned successfully'
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({ message: 'Failed to clone template', error: error.message });
  }
});

// POST /api/templates/modern/:id/restore/:version - Restore template to specific version
router.post('/:id/restore/:version', authenticateToken, async (req, res) => {
  console.log('🔄 Template restore POST route hit for ID:', req.params.id, 'Version:', req.params.version);
  try {
    const hasPermission = await modernTemplateService.checkEditPermission(req.params.id, req.user.uid);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to restore this template' });
    }

    const template = await modernTemplateService.restoreTemplateVersion(
      req.params.id, 
      parseInt(req.params.version),
      req.user.uid
    );
    
    console.log('🔄 Template restored to version:', req.params.version);
    res.json({ 
      data: template,
      message: `Template restored to version ${req.params.version}`
    });
  } catch (error) {
    console.error('Error restoring template:', error);
    res.status(500).json({ message: 'Failed to restore template', error: error.message });
  }
});

// POST /api/templates/modern/:id/share - Share template with other users
router.post('/:id/share', authenticateToken, async (req, res) => {
  console.log('🤝 Template share POST route hit for ID:', req.params.id);
  try {
    const { userIds, permissionLevel = 'VIEW', expiresAt = null } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    if (!['VIEW', 'EDIT', 'ADMIN'].includes(permissionLevel)) {
      return res.status(400).json({ message: 'Invalid permission level' });
    }

    const shares = await modernTemplateService.shareTemplate(req.params.id, {
      userIds,
      permissionLevel,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sharedBy: req.user.uid
    });
    
    console.log('🤝 Template shared with users:', userIds.length);
    res.json({ 
      data: shares,
      message: 'Template shared successfully'
    });
  } catch (error) {
    console.error('Error sharing template:', error);
    res.status(500).json({ message: 'Failed to share template', error: error.message });
  }
});

// DELETE /api/templates/modern/:id/share/:userId - Revoke template sharing
router.delete('/:id/share/:userId', authenticateToken, async (req, res) => {
  console.log('🚫 Template unshare DELETE route hit for ID:', req.params.id, 'User:', req.params.userId);
  try {
    await modernTemplateService.revokeTemplateShare(req.params.id, req.params.userId);
    
    console.log('🚫 Template sharing revoked');
    res.json({ message: 'Template sharing revoked successfully' });
  } catch (error) {
    console.error('Error revoking template share:', error);
    res.status(500).json({ message: 'Failed to revoke template share', error: error.message });
  }
});

// POST /api/templates/modern/:id/usage - Track template usage
router.post('/:id/usage', authenticateToken, async (req, res) => {
  console.log('📈 Template usage tracking POST route hit for ID:', req.params.id);
  try {
    const { quotationId, usageType = 'GENERATE', metadata = {} } = req.body;
    
    const usage = await modernTemplateService.trackUsage(req.params.id, {
      quotationId,
      usageType,
      metadata,
      userId: req.user.uid
    });
    
    console.log('📈 Template usage tracked:', usageType);
    res.json({ 
      data: usage,
      message: 'Template usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking template usage:', error);
    res.status(500).json({ message: 'Failed to track template usage', error: error.message });
  }
});

// DELETE /api/templates/modern/:id - Soft delete template
router.delete('/:id', authenticateToken, async (req, res) => {
  console.log('🗑️ Template delete DELETE route hit for ID:', req.params.id);
  try {
    const hasPermission = await modernTemplateService.checkDeletePermission(req.params.id, req.user.uid);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to delete this template' });
    }

    await modernTemplateService.deleteTemplate(req.params.id, req.user.uid);
    
    console.log('🗑️ Template deleted:', req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
});

// GET /api/templates/modern/shared/with-me - Get templates shared with current user
router.get('/shared/with-me', authenticateToken, async (req, res) => {
  console.log('👥 Shared templates GET route hit');
  try {
    const { limit = '20', offset = '0' } = req.query;
    
    const templates = await modernTemplateService.getSharedTemplates(req.user.uid, {
      limit: Math.min(parseInt(limit) || 20, 100),
      offset: parseInt(offset) || 0
    });
    
    console.log('👥 Found shared templates:', templates.length);
    res.json({ data: templates });
  } catch (error) {
    console.error('Error fetching shared templates:', error);
    res.status(500).json({ message: 'Failed to fetch shared templates', error: error.message });
  }
});

// GET /api/templates/modern/export/:id - Export template configuration
router.get('/export/:id', authenticateToken, async (req, res) => {
  console.log('📤 Template export GET route hit for ID:', req.params.id);
  try {
    const template = await modernTemplateService.exportTemplate(req.params.id, req.user.uid);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template-${req.params.id}.json"`);
    
    console.log('📤 Template exported:', req.params.id);
    res.json(template);
  } catch (error) {
    console.error('Error exporting template:', error);
    res.status(500).json({ message: 'Failed to export template', error: error.message });
  }
});

// POST /api/templates/modern/import - Import template configuration
router.post('/import', authenticateToken, async (req, res) => {
  console.log('📥 Template import POST route hit');
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.uid,
      importedAt: new Date()
    };

    const template = await modernTemplateService.importTemplate(templateData);
    
    console.log('📥 Template imported:', template.id);
    res.status(201).json({ 
      data: template,
      message: 'Template imported successfully'
    });
  } catch (error) {
    console.error('Error importing template:', error);
    res.status(500).json({ message: 'Failed to import template', error: error.message });
  }
});

export default router;
