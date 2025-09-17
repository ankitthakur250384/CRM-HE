/**
 * Quotation Print Routes - Professional architecture inspired by Twenty CRM
 */
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import pool from '../lib/dbConnection.js';
import { templateService } from '../services/TemplateService.mjs';
import { htmlGeneratorService } from '../services/htmlGeneratorService.mjs';
import { pdfService } from '../services/PdfService.mjs';

const router = express.Router();

/**
 * Health check endpoint for print services
 */
router.get('/health', (req, res) => {
  console.log('🏥 [PrintRoutes] Health check requested');
  res.json({ 
    success: true, 
    message: 'Print services are operational',
    timestamp: new Date().toISOString(),
    services: {
      templateService: 'loaded',
      htmlGeneratorService: 'loaded', 
      pdfService: 'loaded'
    }
  });
});

/**
 * Simple test endpoint to verify route is working
 */
router.get('/ping', (req, res) => {
  console.log('🏓 [PrintRoutes] Ping endpoint called');
  res.json({ 
    success: true, 
    message: 'Print routes are working!',
    architecture: 'Professional Twenty CRM inspired'
  });
});

/**
 * TEST endpoint to verify the new architecture (no auth required for testing)
 */
router.post('/test-print', async (req, res) => {
  try {
    console.log('🧪 [PrintRoutes] Test print endpoint called');
    console.log('📋 [PrintRoutes] Request body:', req.body);
    
    // Test template service
    const templates = await templateService.getAllTemplates();
    console.log('📄 [PrintRoutes] Found templates:', templates.length);
    
    // Test HTML generator with sample data
    const sampleData = {
      quotation_number: 'TEST-001',
      quotation_date: 'January 15, 2025',
      company_name: 'ASP Cranes',
      customer_name: 'Test Customer',
      customer_address: 'Test Address',
      items: [
        { description: 'Test Item', quantity: 1, unit_price: 1000, total: 1000 }
      ],
      subtotal: '₹1,000.00',
      total: '₹1,000.00'
    };
    
    // Create a simple test template
    const testTemplate = {
      id: 'test-template',
      name: 'Test Template',
      elements: [
        {
          type: 'header',
          content: '{{company_name}} - Quotation'
        },
        {
          type: 'section',
          id: 'quotation_details'
        },
        {
          type: 'table',
          id: 'quotation_items'
        }
      ]
    };
    
    const html = await htmlGeneratorService.generateHTML(testTemplate, sampleData);
    
    console.log('✅ [PrintRoutes] Test completed successfully');
    
    res.json({
      success: true,
      message: 'New architecture is working!',
      data: {
        templatesFound: templates.length,
        htmlGenerated: html.length > 0,
        sampleHtml: html.substring(0, 500) + '...'
      }
    });
    
  } catch (error) {
    console.error('❌ [PrintRoutes] Test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
});

/**
 * POST /api/quotations/print - Main print endpoint
 */
router.post('/print', authenticateToken, async (req, res) => {
  try {
    const { quotationId, templateId, format = 'html' } = req.body;
    
    console.log('🖨️ [PrintRoutes] Print request:', {
      quotationId,
      templateId,
      format,
      userId: req.user?.id
    });

    // Validate required parameters
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Step 1: Get quotation data
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Step 2: Get template
    const template = templateId 
      ? await templateService.getTemplateById(templateId)
      : await templateService.getDefaultTemplate();

    // Step 3: Map data for template
    const mappedData = templateService.mapQuotationData(quotationData);

    // Step 4: Return template data for frontend rendering
    // The frontend will handle the actual HTML generation
    console.log('✅ [PrintRoutes] Template data prepared for frontend');
    res.json({
      success: true,
      template: template,
      quotationData: quotationData,
      mappedData: mappedData,
      renderMode: 'frontend' // Signal to frontend to use its renderer
    });

  } catch (error) {
    console.error('❌ [PrintRoutes] Print generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Print generation failed',
      message: error.message
    });
  }
});

/**
 * Helper function to get quotation with details
 */
async function getQuotationWithDetails(quotationId) {
  try {
    console.log('🔍 [Helper] Fetching quotation:', quotationId);
    
    const query = `
      SELECT 
        q.id,
        q.quotation_number,
        q.description,
        q.status,
        q.valid_until,
        q.total_amount,
        q.tax_rate,
        q.created_at,
        q.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.company as customer_company
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = $1 AND q.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [quotationId]);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // Get quotation items
    const itemsQuery = `
      SELECT 
        description,
        quantity,
        unit_price,
        total
      FROM quotation_items
      WHERE quotation_id = $1
      ORDER BY created_at ASC
    `;
    
    const itemsResult = await pool.query(itemsQuery, [quotationId]);
    
    // Structure the data
    const quotation = {
      id: row.id,
      quotation_number: row.quotation_number,
      description: row.description,
      status: row.status,
      valid_until: row.valid_until,
      total_amount: row.total_amount,
      tax_rate: row.tax_rate,
      created_at: row.created_at,
      updated_at: row.updated_at,
      
      customer: {
        name: row.customer_name,
        email: row.customer_email,
        phone: row.customer_phone,
        address: row.customer_address,
        company: row.customer_company
      },
      
      items: itemsResult.rows || [],
      
      company: {
        name: 'ASP Cranes',
        address: 'Industrial Area, New Delhi, India',
        phone: '+91-XXXX-XXXX',
        email: 'info@aspcranes.com'
      }
    };

    console.log('✅ [Helper] Quotation fetched successfully');
    return quotation;
    
  } catch (error) {
    console.error('❌ [Helper] Error fetching quotation:', error);
    throw new Error(`Failed to fetch quotation: ${error.message}`);
  }
}

/**
 * POST /api/quotations/print/preview - Generate print preview
 */
router.post('/print/preview', async (req, res) => {
  try {
    const { quotationId, templateId, format = 'html' } = req.body;
    
    console.log('👁️ [PrintRoutes] Preview request:', {
      quotationId,
      templateId,
      format
    });

    // Validate required parameters
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Step 1: Get quotation data
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Step 2: Get template (Enhanced Template System)
    const template = templateId 
      ? await templateService.getTemplateById(templateId)
      : await templateService.getDefaultTemplate();

    // Step 3: Generate basic HTML for preview
    const html = await htmlGeneratorService.generateBasicHTML(template, quotationData);

    console.log('✅ [PrintRoutes] Preview generated successfully');
    res.json({
      success: true,
      html: html,
      template: {
        id: template.id,
        name: template.name
      }
    });

  } catch (error) {
    console.error('❌ [PrintRoutes] Preview generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Preview generation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/quotations/print/print - Generate printable version
 */
router.post('/print/print', async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;
    
    console.log('🖨️ [PrintRoutes] Print request:', {
      quotationId,
      templateId
    });

    // Validate required parameters
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Step 1: Get quotation data
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Step 2: Get template (Enhanced Template System)
    const template = templateId 
      ? await templateService.getTemplateById(templateId)
      : await templateService.getDefaultTemplate();

    // Step 3: Generate HTML for printing
    const html = await htmlGeneratorService.generateBasicHTML(template, quotationData);

    console.log('✅ [PrintRoutes] Print HTML generated successfully');
    res.json({
      success: true,
      html: html,
      template: {
        id: template.id,
        name: template.name
      }
    });

  } catch (error) {
    console.error('❌ [PrintRoutes] Print generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Print generation failed',
      message: error.message
    });
  }
});

export default router;
