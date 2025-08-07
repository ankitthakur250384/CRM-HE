import express from 'express';
import { authenticateToken } from '../authMiddleware.mjs';
import modernTemplateService from '../services/modernTemplateService.js';

const router = express.Router();

// GET /api/templates/modern - Get all modern templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await modernTemplateService.getTemplates();
    res.json({ data: templates });
  } catch (error) {
    console.error('Error fetching modern templates:', error);
    res.status(500).json({ message: 'Failed to fetch modern templates', error: error.message });
  }
});

// GET /api/templates/modern/:id - Get a specific modern template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await modernTemplateService.getTemplateById(req.params.id);
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

// POST /api/templates/modern - Create a new modern template
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Add the authenticated user as the creator
    const templateData = {
      ...req.body,
      createdBy: req.user?.id || 'system'
    };
    const newTemplate = await modernTemplateService.createTemplate(templateData);
    res.status(201).json({ data: newTemplate });
  } catch (error) {
    console.error('Error creating modern template:', error);
    res.status(500).json({ message: 'Failed to create modern template', error: error.message });
  }
});

// PATCH /api/templates/modern/:id - Update a modern template
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedTemplate = await modernTemplateService.updateTemplate(req.params.id, req.body);
    res.json({ data: updatedTemplate });
  } catch (error) {
    console.error('Error updating modern template:', error);
    res.status(500).json({ message: 'Failed to update modern template', error: error.message });
  }
});

// DELETE /api/templates/modern/:id - Delete a modern template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await modernTemplateService.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting modern template:', error);
    res.status(500).json({ message: 'Failed to delete modern template', error: error.message });
  }
});

export default router;
