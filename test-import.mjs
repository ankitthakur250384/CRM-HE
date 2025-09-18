#!/usr/bin/env node

/**
 * Quick test to verify all imports work correctly
 */

console.log('🔍 Testing imports...');

try {
  console.log('Testing TemplateService...');
  const { templateService } = await import('./crm-app/backend/src/services/TemplateService.mjs');
  console.log('✅ TemplateService imported successfully');

  console.log('Testing HtmlGeneratorService...');
  const { htmlGeneratorService } = await import('./crm-app/backend/src/services/HtmlGeneratorService.mjs');
  console.log('✅ HtmlGeneratorService imported successfully');

  console.log('Testing PdfService...');
  const { pdfService } = await import('./crm-app/backend/src/services/PdfService.mjs');
  console.log('✅ PdfService imported successfully');

  console.log('Testing EnhancedTemplateBuilder...');
  const { EnhancedTemplateBuilder, TEMPLATE_ELEMENT_TYPES, TEMPLATE_THEMES } = await import('./crm-app/backend/src/services/EnhancedTemplateBuilder.mjs');
  console.log('✅ EnhancedTemplateBuilder imported successfully');

  console.log('Testing quotationPrintRoutes...');
  const quotationPrintRoutes = await import('./crm-app/backend/src/routes/quotationPrintRoutes.mjs');
  console.log('✅ quotationPrintRoutes imported successfully');

  console.log('Testing enhancedTemplateRoutes...');
  const enhancedTemplateRoutes = await import('./crm-app/backend/src/routes/enhancedTemplateRoutes.mjs');
  console.log('✅ enhancedTemplateRoutes imported successfully');

  console.log('\n🎉 All imports successful! Backend should start correctly now.');

} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
