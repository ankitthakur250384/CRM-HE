import express from 'express';
import { authenticateToken } from '../authMiddleware.mjs';

const router = express.Router();

// Mock templates for now
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Default Template',
    description: 'Standard quotation template with company branding',
    content: 'Default template content',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'template-2',
    name: 'Advanced Template',
    description: 'Advanced quotation template with detailed sections',
    content: 'Advanced template content',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/templates - Get all templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, data: mockTemplates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = mockTemplates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch template' });
  }
});

// POST /api/templates - Create a new template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newTemplate = {
      id: `template-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockTemplates.push(newTemplate);
    res.status(201).json({ success: true, data: newTemplate });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, message: 'Failed to create template' });
  }
});

// PATCH /api/templates/:id - Update a template
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const templateIndex = mockTemplates.findIndex(t => t.id === req.params.id);
    if (templateIndex === -1) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    mockTemplates[templateIndex] = {
      ...mockTemplates[templateIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json({ success: true, data: mockTemplates[templateIndex] });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const templateIndex = mockTemplates.findIndex(t => t.id === req.params.id);
    if (templateIndex === -1) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    mockTemplates.splice(templateIndex, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
});

export default router;
