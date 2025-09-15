/**
 * Enhanced Template Management Routes
 * Advanced template builder and PDF generation functionality
 * Inspired by InvoiceNinja's template system adapted for ASP Cranes
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import { EnhancedTemplateBuilder, TEMPLATE_ELEMENT_TYPES, TEMPLATE_THEMES } from '../services/EnhancedTemplateBuilder.mjs';
import { AdvancedPDFGenerator, PDF_OPTIONS } from '../services/AdvancedPDFGenerator.mjs';

const router = express.Router();

// Configure multer for file uploads (logos, assets)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'templates');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `template-asset-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * GET /api/templates/enhanced/info
 * Get enhanced template builder information and capabilities
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      elementTypes: TEMPLATE_ELEMENT_TYPES,
      themes: TEMPLATE_THEMES,
      pdfFormats: PDF_OPTIONS.FORMATS,
      pdfOrientations: PDF_OPTIONS.ORIENTATIONS,
      pdfQuality: PDF_OPTIONS.QUALITY,
      features: {
        visualBuilder: true,
        dragDrop: true,
        realTimePreview: true,
        multiFormat: true,
        watermarks: true,
        headerFooter: true,
        customCSS: true,
        batch: true,
        templates: true,
        versioning: true
      },
      limits: {
        maxElements: 50,
        maxTemplates: 100,
        maxFileSize: '5MB',
        supportedImageTypes: ['jpeg', 'jpg', 'png', 'gif', 'svg', 'ico']
      }
    }
  });
});

/**
 * POST /api/templates/enhanced/create
 * Create new enhanced template
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const templateBuilder = new EnhancedTemplateBuilder();
    templateBuilder.createTemplate(templateData);
    
    await templateBuilder.saveTemplate();
    
    res.status(201).json({
      success: true,
      data: templateBuilder.template,
      message: 'Enhanced template created successfully'
    });
  } catch (error) {
    console.error('Error creating enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create enhanced template',
      message: error.message
    });
  }
});

/**
 * GET /api/templates/enhanced/list
 * Get all enhanced templates with filtering and pagination
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      theme = '',
      isActive = true 
    } = req.query;
    
    // This is a placeholder implementation - you should integrate with your database
    // For now, return sample templates
    const sampleTemplates = [
      {
        id: 'tpl_001',
        name: 'Professional ASP Cranes Template',
        description: 'Modern professional template with company branding',
        theme: 'PROFESSIONAL',
        category: 'Quotation',
        isDefault: true,
        isActive: true,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail: null,
        usageCount: 15
      },
      {
        id: 'tpl_002', 
        name: 'Classic Business Template',
        description: 'Traditional business template with clean layout',
        theme: 'CLASSIC',
        category: 'Quotation',
        isDefault: false,
        isActive: true,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail: null,
        usageCount: 8
      }
    ];
    
    res.json({
      success: true,
      data: sampleTemplates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sampleTemplates.length,
        pages: Math.ceil(sampleTemplates.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced templates',
      message: error.message
    });
  }
});

/**
 * GET /api/templates/enhanced/:id
 * Get specific enhanced template by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const templateBuilder = new EnhancedTemplateBuilder();
    
    await templateBuilder.loadTemplate(id);
    
    res.json({
      success: true,
      data: templateBuilder.template
    });
  } catch (error) {
    console.error('Error fetching enhanced template:', error);
    res.status(404).json({
      success: false,
      error: 'Template not found',
      message: error.message
    });
  }
});

/**
 * PUT /api/templates/enhanced/:id
 * Update existing enhanced template
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };
    
    const templateBuilder = new EnhancedTemplateBuilder();
    await templateBuilder.loadTemplate(id);
    
    // Update template properties
    Object.assign(templateBuilder.template, updateData);
    
    await templateBuilder.saveTemplate();
    
    res.json({
      success: true,
      data: templateBuilder.template,
      message: 'Enhanced template updated successfully'
    });
  } catch (error) {
    console.error('Error updating enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update enhanced template',
      message: error.message
    });
  }
});

/**
 * DELETE /api/templates/enhanced/:id
 * Delete enhanced template (soft delete)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Implement soft delete by setting isActive to false
    const templateBuilder = new EnhancedTemplateBuilder();
    await templateBuilder.loadTemplate(id);
    
    templateBuilder.template.isActive = false;
    templateBuilder.template.deletedAt = new Date().toISOString();
    templateBuilder.template.deletedBy = req.user.id;
    
    await templateBuilder.saveTemplate();
    
    res.json({
      success: true,
      message: 'Enhanced template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enhanced template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete enhanced template',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/preview
 * Generate template preview with advanced options
 */
router.post('/preview', authenticateToken, async (req, res) => {
  try {
    const { templateData, quotationData, format = 'html', options = {} } = req.body;
    
    const templateBuilder = new EnhancedTemplateBuilder();
    
    if (templateData.id) {
      await templateBuilder.loadTemplate(templateData.id);
    } else {
      templateBuilder.createTemplate(templateData);
    }
    
    if (format === 'html') {
      const html = templateBuilder.generatePreviewHTML(quotationData);
      res.json({
        success: true,
        data: { html },
        format: 'html',
        timestamp: new Date()
      });
    } else if (format === 'pdf') {
      const html = templateBuilder.generateQuotationHTML(quotationData);
      const pdfGenerator = new AdvancedPDFGenerator();
      
      const pdfOptions = {
        format: options.format || 'A4',
        orientation: options.orientation || 'portrait',
        quality: options.quality || 'STANDARD',
        margins: options.margins
      };
      
      const pdfBuffer = await pdfGenerator.generatePDF(html, pdfOptions);
      await pdfGenerator.cleanup();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
      res.send(pdfBuffer);
    }
  } catch (error) {
    console.error('Error generating enhanced preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/generate-pdf
 * Generate advanced PDF from template and quotation data
 */
router.post('/generate-pdf', authenticateToken, async (req, res) => {
  try {
    const {
      templateId,
      quotationData,
      options = {},
      filename
    } = req.body;
    
    console.log('🎨 [Enhanced PDF] Generating PDF with advanced options...');
    console.log('📋 Template ID:', templateId);
    console.log('⚙️ Options:', options);
    
    const templateBuilder = new EnhancedTemplateBuilder();
    await templateBuilder.loadTemplate(templateId);
    
    const html = templateBuilder.generateQuotationHTML(quotationData);
    const pdfGenerator = new AdvancedPDFGenerator();
    
    const pdfOptions = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      quality: options.quality || 'STANDARD',
      margins: options.margins,
      displayHeaderFooter: options.headerFooter || false,
      printBackground: true,
      ...options
    };
    
    console.log('🔧 PDF Options:', pdfOptions);
    
    let pdfBuffer;
    
    if (options.watermark) {
      console.log('💧 Adding watermark...');
      pdfBuffer = await pdfGenerator.generatePDFWithWatermark(html, options.watermark, pdfOptions);
    } else if (options.headerFooter) {
      console.log('📄 Adding header/footer...');
      pdfBuffer = await pdfGenerator.generatePDFWithHeaderFooter(html, options.headerFooter, pdfOptions);
    } else {
      console.log('📝 Generating standard PDF...');
      pdfBuffer = await pdfGenerator.generatePDF(html, pdfOptions);
    }
    
    await pdfGenerator.cleanup();
    
    const downloadFilename = filename || `quotation_${quotationData.quotation?.number || Date.now()}.pdf`;
    
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generating enhanced PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/generate-quotation-pdf
 * Generate PDF for specific quotation using enhanced template
 */
router.post('/generate-quotation-pdf', authenticateToken, async (req, res) => {
  try {
    const { quotationId, templateId, options = {} } = req.body;
    
    console.log('🎯 [Enhanced Quotation PDF] Starting generation...');
    console.log('📋 Quotation ID:', quotationId);
    console.log('🎨 Template ID:', templateId);
    
    // Fetch quotation data from your existing system
    // This should integrate with your existing quotation fetching logic
    const quotationData = await getQuotationData(quotationId);
    
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }
    
    const templateBuilder = new EnhancedTemplateBuilder();
    
    if (templateId) {
      await templateBuilder.loadTemplate(templateId);
    } else {
      // Use default template or create a basic one
      templateBuilder.createTemplate({
        name: 'Default Enhanced Template',
        theme: 'PROFESSIONAL',
        elements: this.createDefaultElements()
      });
    }
    
    const html = templateBuilder.generateQuotationHTML(quotationData);
    const pdfGenerator = new AdvancedPDFGenerator();
    
    const pdfOptions = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      quality: options.quality || 'HIGH', // Use high quality for final documents
      margins: options.margins || { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      displayHeaderFooter: false,
      printBackground: true,
      ...options
    };
    
    const pdfBuffer = await pdfGenerator.generatePDF(html, pdfOptions);
    await pdfGenerator.cleanup();
    
    const filename = `ASP_Quotation_${quotationData.quotation?.number || quotationId}.pdf`;
    
    console.log('✅ Enhanced quotation PDF generated successfully');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generating enhanced quotation PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced quotation PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/templates/enhanced/batch-pdf
 * Generate multiple PDFs from template
 */
router.post('/batch-pdf', authenticateToken, async (req, res) => {
  try {
    const {
      templateId,
      quotations,
      options = {}
    } = req.body;
    
    console.log('📚 [Batch PDF] Starting batch generation...');
    console.log('📋 Template ID:', templateId);
    console.log('📊 Quotations count:', quotations.length);
    
    const templateBuilder = new EnhancedTemplateBuilder();
    await templateBuilder.loadTemplate(templateId);
    
    const htmlContents = quotations.map(quotationData => 
      templateBuilder.generateQuotationHTML(quotationData)
    );
    
    const pdfGenerator = new AdvancedPDFGenerator();
    const results = await pdfGenerator.batchGeneratePDFs(htmlContents, options);
    
    await pdfGenerator.cleanup();
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Batch PDF generation completed: ${successful.length}/${results.length} successful`);
    
    res.json({
      success: true,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results.map(r => ({
          index: r.index,
          success: r.success,
          error: r.error || null,
          size: r.buffer ? r.buffer.length : 0
        }))
      },
      message: `Generated ${successful.length} of ${results.length} PDFs successfully`
    });
    
  } catch (error) {
    console.error('❌ Error in batch PDF generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch PDFs',
      message: error.message
    });
  }
});

/**
 * GET /api/templates/enhanced/sample-data
 * Get sample quotation data for preview
 */
router.get('/sample-data', (req, res) => {
  const templateBuilder = new EnhancedTemplateBuilder();
  const sampleData = templateBuilder.getSampleQuotationData();
  
  res.json({
    success: true,
    data: sampleData,
    message: 'Sample data retrieved successfully'
  });
});

/**
 * POST /api/templates/enhanced/upload-asset
 * Upload template asset (logo, image, etc.)
 */
router.post('/upload-asset', authenticateToken, upload.single('asset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const assetInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/templates/${req.file.filename}`,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };
    
    res.json({
      success: true,
      data: assetInfo,
      message: 'Asset uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload asset',
      message: error.message
    });
  }
});

/**
 * Helper function to get quotation data
 * This should integrate with your existing quotation system
 */
async function getQuotationData(quotationId) {
  // This is a placeholder - integrate with your existing quotation fetching logic
  // You should replace this with actual database query from your quotation system
  
  console.log('🔍 Fetching quotation data for ID:', quotationId);
  
  // Return sample data for now - replace with actual implementation
  const templateBuilder = new EnhancedTemplateBuilder();
  return {
    ...templateBuilder.getSampleQuotationData(),
    quotation: {
      ...templateBuilder.getSampleQuotationData().quotation,
      number: `QUO-${quotationId}`,
      id: quotationId
    }
  };
}

/**
 * Helper function to create default template elements
 */
function createDefaultElements() {
  return [
    {
      type: TEMPLATE_ELEMENT_TYPES.HEADER,
      content: {
        title: 'ASP CRANES PVT. LTD.',
        subtitle: 'QUOTATION',
        alignment: 'center'
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.COMPANY_INFO,
      content: {
        fields: [
          '{{company.name}}',
          '{{company.address}}',
          '{{company.phone}}',
          '{{company.email}}'
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.CLIENT_INFO,
      content: {
        title: 'Bill To:',
        fields: [
          '{{client.name}}',
          '{{client.address}}',
          '{{client.phone}}',
          '{{client.email}}'
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.QUOTATION_INFO,
      content: {
        fields: [
          { label: 'Quotation #', value: '{{quotation.number}}' },
          { label: 'Date', value: '{{quotation.date}}' },
          { label: 'Valid Until', value: '{{quotation.validUntil}}' }
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.ITEMS_TABLE,
      content: {
        columns: [
          { key: 'description', label: 'Description', width: '40%', alignment: 'left' },
          { key: 'quantity', label: 'Qty', width: '15%', alignment: 'center' },
          { key: 'rate', label: 'Rate', width: '20%', alignment: 'right' },
          { key: 'amount', label: 'Amount', width: '25%', alignment: 'right' }
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.TOTALS,
      content: {
        fields: [
          { label: 'Subtotal', value: '{{totals.subtotal}}', showIf: 'always' },
          { label: 'Tax', value: '{{totals.tax}}', showIf: 'hasTax' },
          { label: 'Total', value: '{{totals.total}}', showIf: 'always', emphasized: true }
        ]
      }
    },
    {
      type: TEMPLATE_ELEMENT_TYPES.TERMS,
      content: {
        title: 'Terms & Conditions',
        text: '{{quotation.terms}}'
      }
    }
  ];
}

export default router;
