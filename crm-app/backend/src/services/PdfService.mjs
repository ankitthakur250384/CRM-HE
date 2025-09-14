/**
 * PdfService - Professional PDF generation service
 * 
 * Inspired by Twenty CRM's modular architecture
 * Responsibilities:
 * - HTML to PDF conversion
 * - PDF configuration and styling
 * - Error handling and validation
 * - Performance optimization
 */

export class PdfService {
  constructor() {
    this.defaultOptions = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      printBackground: true,
      preferCSSPageSize: true
    };
  }

  /**
   * Generate PDF from HTML content
   * @param {string} htmlContent - HTML content to convert
   * @param {Object} options - PDF generation options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(htmlContent, options = {}) {
    try {
      console.log('🔄 [PdfService] Starting PDF generation...');
      
      // Validate input
      if (!htmlContent || typeof htmlContent !== 'string') {
        throw new Error('Valid HTML content is required for PDF generation');
      }

      // For now, return a simple PDF-like response
      // In production, you would use Puppeteer, Playwright, or similar
      const pdfOptions = { ...this.defaultOptions, ...options };
      
      console.log('📄 [PdfService] PDF configuration:', pdfOptions);
      
      // Simulate PDF generation (replace with actual PDF library)
      const pdfBuffer = await this.convertHtmlToPdf(htmlContent, pdfOptions);
      
      console.log('✅ [PdfService] PDF generation completed successfully');
      return pdfBuffer;
    } catch (error) {
      console.error('❌ [PdfService] PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Convert HTML to PDF (placeholder for actual implementation)
   * @param {string} htmlContent - HTML content
   * @param {Object} options - PDF options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async convertHtmlToPdf(htmlContent, options) {
    // For immediate testing, return HTML content as base64
    // In production, implement with Puppeteer:
    /*
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf(options);
    await browser.close();
    return pdfBuffer;
    */
    
    // Temporary implementation - return HTML as buffer for testing
    console.log('⚠️ [PdfService] Using temporary HTML buffer (implement Puppeteer for production)');
    return Buffer.from(htmlContent, 'utf8');
  }

  /**
   * Generate PDF with custom headers and footers
   * @param {string} htmlContent - HTML content
   * @param {Object} headerFooterConfig - Header/footer configuration
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDFWithHeaderFooter(htmlContent, headerFooterConfig = {}) {
    const options = {
      ...this.defaultOptions,
      displayHeaderFooter: true,
      headerTemplate: headerFooterConfig.header || this.getDefaultHeader(),
      footerTemplate: headerFooterConfig.footer || this.getDefaultFooter(),
      margin: {
        ...this.defaultOptions.margin,
        top: '30mm', // Extra space for header
        bottom: '25mm' // Extra space for footer
      }
    };

    return this.generatePDF(htmlContent, options);
  }

  /**
   * Get default PDF header template
   * @returns {string} Header HTML template
   */
  getDefaultHeader() {
    return `
      <div style="
        width: 100%;
        font-size: 10px;
        color: #666;
        text-align: center;
        margin: 0 15mm;
        padding: 5mm 0;
        border-bottom: 1px solid #eee;
      ">
        <span class="title"></span>
      </div>
    `;
  }

  /**
   * Get default PDF footer template
   * @returns {string} Footer HTML template
   */
  getDefaultFooter() {
    return `
      <div style="
        width: 100%;
        font-size: 10px;
        color: #666;
        text-align: center;
        margin: 0 15mm;
        padding: 5mm 0;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
      ">
        <span>ASP Cranes - Professional Quotation System</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  /**
   * Validate PDF generation options
   * @param {Object} options - PDF options to validate
   * @throws {Error} If options are invalid
   */
  validateOptions(options) {
    if (options.format && !this.isValidFormat(options.format)) {
      throw new Error(`Invalid PDF format: ${options.format}`);
    }

    if (options.margin && !this.isValidMargin(options.margin)) {
      throw new Error('Invalid margin configuration');
    }

    console.log('✅ [PdfService] Options validation passed');
  }

  /**
   * Check if format is valid
   * @param {string} format - PDF format
   * @returns {boolean} Is valid
   */
  isValidFormat(format) {
    const validFormats = ['A4', 'A3', 'A5', 'Letter', 'Legal', 'Tabloid'];
    return validFormats.includes(format);
  }

  /**
   * Check if margin configuration is valid
   * @param {Object} margin - Margin configuration
   * @returns {boolean} Is valid
   */
  isValidMargin(margin) {
    if (typeof margin !== 'object') return false;
    
    const requiredFields = ['top', 'right', 'bottom', 'left'];
    return requiredFields.every(field => 
      margin[field] && typeof margin[field] === 'string'
    );
  }

  /**
   * Get file-safe filename for PDF
   * @param {string} quotationNumber - Quotation number
   * @returns {string} Safe filename
   */
  generateFilename(quotationNumber) {
    const safeNumber = (quotationNumber || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `Quotation_${safeNumber}_${timestamp}.pdf`;
  }

  /**
   * Get PDF response headers
   * @param {string} filename - PDF filename
   * @returns {Object} Response headers
   */
  getPdfHeaders(filename) {
    return {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  /**
   * Get configuration for different PDF types
   * @param {string} type - PDF type (quotation, invoice, etc.)
   * @returns {Object} PDF configuration
   */
  getConfigForType(type) {
    const configs = {
      quotation: {
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        displayHeaderFooter: false,
        printBackground: true
      },
      invoice: {
        format: 'A4',
        margin: { top: '25mm', right: '15mm', bottom: '25mm', left: '15mm' },
        displayHeaderFooter: true,
        printBackground: true
      },
      letterhead: {
        format: 'A4',
        margin: { top: '30mm', right: '20mm', bottom: '20mm', left: '20mm' },
        displayHeaderFooter: true,
        printBackground: true
      }
    };

    return configs[type] || configs.quotation;
  }
}

// Export singleton instance
export const pdfService = new PdfService();
