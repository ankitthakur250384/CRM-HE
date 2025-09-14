/**
 * Quotation Print Routes - Professional architecture inspired by Twenty CRM
 */
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import { dbPool } from '../lib/dbConnection.js';
import { templateService } from '../services/TemplateService.mjs';
import { htmlGeneratorService } from '../services/HtmlGeneratorService.mjs';
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
    timestamp: new Date().toISOString()
  });
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

    // Step 4: Generate HTML
    const html = await htmlGeneratorService.generateHTML(template, mappedData);

    // Step 5: Return response
    console.log('✅ [PrintRoutes] Generation completed successfully');
    res.json({
      success: true,
      html,
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
    
    const result = await dbPool.query(query, [quotationId]);
    
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
    
    const itemsResult = await dbPool.query(itemsQuery, [quotationId]);
    
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

export default router;
