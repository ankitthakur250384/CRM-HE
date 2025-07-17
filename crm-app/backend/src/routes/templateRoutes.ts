
import express from 'express';
import * as templateService from '../services/templateService';
import { mergeTemplate } from '../utils/templateMerger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticateToken } = require('../authMiddleware.mjs');
const router = express.Router();

// POST /api/templates/merge - Merge template with data
router.post('/merge', authenticateToken, async (req, res) => {
  try {
    const { templateId, data } = req.body;
    if (!templateId || !data) {
      return res.status(400).json({ success: false, message: 'templateId and data are required' });
    }
    const template = await templateService.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    // Use backend merger logic
    const mergedContent = mergeTemplate(template, data);
    res.json({ success: true, mergedContent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to merge template' });
  }
});

// GET /api/templates - Get all templates
router.get('/', authenticateToken, async (_req, res) => {
  try {
    const templates = await templateService.getTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await templateService.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch template' });
  }
});

// POST /api/templates - Create a new template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create template' });
  }
});

// PATCH /api/templates/:id - Update a template
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
});

export default router;
