import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import { db } from '../lib/dbClient.js';

const router = express.Router();

// Get template configuration
router.get('/templates', async (req, res) => {
  try {
    const query = `
      SELECT key, value 
      FROM system_config 
      WHERE key IN (
        'defaultQuotationTemplate',
        'defaultInvoiceTemplate', 
        'defaultReportTemplate',
        'enableTemplateSelection'
      )
    `;
    
    const result = await db.query(query);
    
    // Convert to object format
    const config = {
      defaultQuotationTemplate: '',
      defaultInvoiceTemplate: '',
      defaultReportTemplate: '',
      enableTemplateSelection: true
    };
    
    result.rows.forEach(row => {
      if (row.key === 'enableTemplateSelection') {
        config[row.key] = row.value === 'true';
      } else {
        config[row.key] = row.value || '';
      }
    });

    res.json({ success: true, data: config });

  } catch (error) {
    console.error('Error fetching template config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
  }
});

// Save template configuration
router.post('/templates', authenticateToken, async (req, res) => {
  try {
    const { 
      defaultQuotationTemplate, 
      defaultInvoiceTemplate, 
      defaultReportTemplate, 
      enableTemplateSelection 
    } = req.body;

    const configs = [
      { key: 'defaultQuotationTemplate', value: defaultQuotationTemplate || '' },
      { key: 'defaultInvoiceTemplate', value: defaultInvoiceTemplate || '' },
      { key: 'defaultReportTemplate', value: defaultReportTemplate || '' },
      { key: 'enableTemplateSelection', value: enableTemplateSelection.toString() }
    ];

    // Create system_config table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Update or insert each config
    for (const config of configs) {
      await db.query(`
        INSERT INTO system_config (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) 
        DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
      `, [config.key, config.value]);
    }

    res.json({ success: true, message: 'Configuration saved successfully' });

  } catch (error) {
    console.error('Error saving template config:', error);
    res.status(500).json({ success: false, error: 'Failed to save configuration' });
  }
});

// Get default template for a specific type
router.get('/templates/default/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const configKey = `default${type.charAt(0).toUpperCase() + type.slice(1)}Template`;
    
    const query = `
      SELECT value 
      FROM system_config 
      WHERE key = $1
    `;
    
    const result = await db.query(query, [configKey]);
    
    if (result.rows.length > 0 && result.rows[0].value) {
      // Get template details
      const templateQuery = `
        SELECT * FROM quotation_templates 
        WHERE id = $1 AND is_active = true
      `;
      
      const templateResult = await db.query(templateQuery, [result.rows[0].value]);
      
      if (templateResult.rows.length > 0) {
        res.json({ success: true, data: templateResult.rows[0] });
      } else {
        res.json({ success: false, error: 'Default template not found or inactive' });
      }
    } else {
      res.json({ success: false, error: 'No default template configured' });
    }

  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch default template' });
  }
});

export default router;
