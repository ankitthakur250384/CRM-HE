import express from 'express';
import { authenticateToken } from '../authMiddleware.mjs';
import templateService from '../services/templateService.js';

const router = express.Router();


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
