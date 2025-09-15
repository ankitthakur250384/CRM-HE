# Legacy Template System - Moved Files

## Overview
This folder contains the old template system files that were replaced by the new Enhanced Template Builder (InvoiceNinja-style) implementation.

## Date Moved
September 15, 2025

## Files Moved

### Routes (from `/crm-app/backend/src/routes/`)
- `templateRoutes.mjs` - Legacy template API routes
- `templateBuilderRoutes.mjs` - Old template builder routes  
- `modernTemplateRoutes.mjs` - Previous "modern" template routes
- `templateConfigRoutes.mjs` - Template configuration routes

### Services (from `/crm-app/backend/src/services/`)
- `templateBuilderService.js` - Old template builder service
- `modernTemplateService.js` - Previous "modern" template service

## Reason for Migration
These files were replaced with the new Enhanced Template System that provides:
- InvoiceNinja-style visual drag-and-drop builder
- Advanced PDF generation with Puppeteer
- Professional themes and elements
- Better database schema with proper relationships
- TypeScript support throughout

## New Implementation Files
The replacement Enhanced Template System includes:
- `EnhancedTemplateBuilder.mjs` - Core template building service
- `AdvancedPDFGenerator.mjs` - Professional PDF generation  
- `enhancedTemplateRoutes.mjs` - API routes for enhanced templates
- `EnhancedTemplateBuilder.tsx` - Visual drag-and-drop builder
- `EnhancedTemplateManager.tsx` - Template management interface

## Recovery
If you need to restore any of these files:
1. Copy the file from this legacy folder back to its original location
2. Add the import back to `server.mjs`
3. Add the route mounting back to `server.mjs`
4. Restart the server

⚠️ **Warning**: Using legacy files alongside the enhanced system may cause route conflicts and database issues.
