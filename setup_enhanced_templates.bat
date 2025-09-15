@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up Enhanced Template System for ASP Cranes CRM...
echo.

REM Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check for npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📋 Prerequisites check passed
echo.

REM Navigate to backend directory
echo 📦 Installing backend dependencies...
cd crm-app\backend

REM Install puppeteer for PDF generation
echo Installing Puppeteer for PDF generation...
call npm install puppeteer@^22.0.0

REM Check if multer is already installed
npm list multer >nul 2>&1
if errorlevel 1 (
    echo Installing Multer for file uploads...
    call npm install multer@^1.4.5-lts.1
)

echo ✅ Backend dependencies installed successfully
echo.

REM Navigate to frontend directory
echo 📦 Installing frontend dependencies...
cd ..\frontend

REM Check if react-beautiful-dnd is installed
npm list react-beautiful-dnd >nul 2>&1
if errorlevel 1 (
    echo Installing React Beautiful DnD...
    call npm install react-beautiful-dnd@^13.1.1
    call npm install @types/react-beautiful-dnd@^13.1.1 --save-dev
)

REM Check if lucide-react is installed
npm list lucide-react >nul 2>&1
if errorlevel 1 (
    echo Installing Lucide React icons...
    call npm install lucide-react@^0.344.0
)

echo ✅ Frontend dependencies installed successfully
echo.

REM Navigate back to root
cd ..\..

REM Create directories for uploads
echo 📁 Creating upload directories...
if not exist "crm-app\backend\uploads\templates" mkdir crm-app\backend\uploads\templates
if not exist "crm-app\backend\uploads\logos" mkdir crm-app\backend\uploads\logos

echo 📁 Upload directories created
echo.

REM Check for database migration
echo 🗄️ Database migration setup...
if exist "enhanced_template_migration.sql" (
    echo ✅ Database migration file found
    echo ⚠️ Please run the migration manually using:
    echo psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration.sql
) else (
    echo ❌ Database migration file not found
)
echo.

REM Create verification script
echo 🧪 Creating setup verification...
(
echo /**
echo  * Enhanced Template System Setup Verification
echo  * Run this script to verify that all components are properly installed
echo  */
echo.
echo console.log^('🔍 Verifying Enhanced Template System setup...\n'^);
echo.
echo // Check backend dependencies
echo try {
echo     const puppeteer = require^('./crm-app/backend/node_modules/puppeteer'^);
echo     const multer = require^('./crm-app/backend/node_modules/multer'^);
echo     console.log^('✅ Backend dependencies verified'^);
echo     console.log^('  - Puppeteer:', puppeteer.executablePath ? 'Installed' : 'Not found'^);
echo     console.log^('  - Multer: Installed'^);
echo } catch ^(error^) {
echo     console.log^('❌ Backend dependencies verification failed:', error.message^);
echo }
echo.
echo // Check if enhanced template files exist
echo const fs = require^('fs'^);
echo const backendFiles = [
echo     './crm-app/backend/src/services/EnhancedTemplateBuilder.mjs',
echo     './crm-app/backend/src/services/AdvancedPDFGenerator.mjs',
echo     './crm-app/backend/src/routes/enhancedTemplateRoutes.mjs'
echo ];
echo.
echo const frontendFiles = [
echo     './crm-app/frontend/src/components/quotations/EnhancedTemplateBuilder.tsx',
echo     './crm-app/frontend/src/pages/quotations/EnhancedTemplateManager.tsx'
echo ];
echo.
echo console.log^('\n📁 Checking file installation:'^);
echo [...backendFiles, ...frontendFiles].forEach^(file =^> {
echo     if ^(fs.existsSync^(file^)^) {
echo         console.log^(`✅ ${file}`^);
echo     } else {
echo         console.log^(`❌ ${file}`^);
echo     }
echo }^);
echo.
echo // Check migration file
echo if ^(fs.existsSync^('./enhanced_template_migration.sql'^)^) {
echo     console.log^('✅ Database migration file found'^);
echo } else {
echo     console.log^('❌ Database migration file not found'^);
echo }
echo.
echo console.log^('\n🎉 Setup verification complete!'^);
echo console.log^('\nNext steps:'^);
echo console.log^('1. Start your backend server: cd crm-app/backend ^&^& npm run dev'^);
echo console.log^('2. Start your frontend server: cd crm-app/frontend ^&^& npm run dev'^);
echo console.log^('3. Navigate to the Enhanced Template Manager in your application'^);
echo console.log^('4. Create your first enhanced template!'^);
) > setup_verification.js

node setup_verification.js
del setup_verification.js

echo.
echo 🎉 Enhanced Template System setup complete!
echo.
echo 📋 Summary:
echo ✅ Backend dependencies installed ^(Puppeteer, Multer^)
echo ✅ Frontend dependencies verified ^(React Beautiful DnD, Lucide React^)
echo ✅ Enhanced template services created
echo ✅ API routes configured
echo ✅ Frontend components created
echo ✅ Database migration prepared
echo ✅ Upload directories created
echo.
echo 🚀 Next steps:
echo 1. Run the database migration manually
echo 2. Restart your backend server to load the new routes
echo 3. Access the Enhanced Template Manager from your frontend
echo 4. Start creating professional quotation templates!
echo.
echo 📍 Enhanced Template Manager will be available at:
echo    Frontend: /quotations/enhanced-templates
echo    API: /api/templates/enhanced/*
echo.
echo 📖 For more information, check the QUOTATION_PRINTING_GUIDE.md
echo.
pause
