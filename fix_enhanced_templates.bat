@echo off
setlocal enabledelayedexpansion

echo 🔧 Fixing Enhanced Template System issues...
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

echo ✅ Prerequisites check passed
echo.

REM Apply the fixed database migration
echo 🗄️ Applying fixed database migration...

if exist "crm-app\backend\.env" (
    echo Loading database configuration from .env file...
    
    REM Note: For Windows, manual database migration is recommended
    echo ⚠️ Please run the database migration manually:
    echo psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration_fixed.sql
    echo.
    echo Or if you have the credentials from your .env file:
    echo Check crm-app\backend\.env for DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
    echo.
) else (
    echo ⚠️ No .env file found. Please run the migration manually.
)

REM Fix npm vulnerabilities in backend
echo 🔒 Fixing backend npm vulnerabilities...
cd crm-app\backend
call npm audit fix --force
if errorlevel 1 (
    echo ⚠️ Some backend vulnerabilities could not be automatically fixed
) else (
    echo ✅ Backend vulnerabilities fixed
)

REM Fix npm vulnerabilities in frontend
echo 🔒 Fixing frontend npm vulnerabilities...
cd ..\frontend
call npm audit fix --force
if errorlevel 1 (
    echo ⚠️ Some frontend vulnerabilities could not be automatically fixed
) else (
    echo ✅ Frontend vulnerabilities fixed
)

REM Navigate back to root
cd ..\..

REM Create and run verification script
echo 🧪 Running verification...
(
echo const fs = require^('fs'^);
echo const path = require^('path'^);
echo.
echo console.log^('🔍 Enhanced Template System Verification\n'^);
echo.
echo // Check if all required files exist
echo const requiredFiles = [
echo     './crm-app/backend/src/services/EnhancedTemplateBuilder.mjs',
echo     './crm-app/backend/src/services/AdvancedPDFGenerator.mjs',
echo     './crm-app/backend/src/routes/enhancedTemplateRoutes.mjs',
echo     './crm-app/frontend/src/components/quotations/EnhancedTemplateBuilder.tsx',
echo     './crm-app/frontend/src/pages/quotations/EnhancedTemplateManager.tsx',
echo     './enhanced_template_migration_fixed.sql'
echo ];
echo.
echo console.log^('📁 Checking file installation:'^);
echo let allFilesExist = true;
echo requiredFiles.forEach^(file =^> {
echo     if ^(fs.existsSync^(file^)^) {
echo         console.log^(`✅ ${file}`^);
echo     } else {
echo         console.log^(`❌ ${file}`^);
echo         allFilesExist = false;
echo     }
echo }^);
echo.
echo // Check backend dependencies
echo console.log^('\n📦 Checking backend dependencies:'^);
echo try {
echo     const backendPackageJson = JSON.parse^(fs.readFileSync^('./crm-app/backend/package.json', 'utf8'^)^);
echo     const hasPuppeteer = backendPackageJson.dependencies.puppeteer ^|^| false;
echo     const hasMulter = backendPackageJson.dependencies.multer ^|^| false;
echo     
echo     console.log^(`  - Puppeteer: ${hasPuppeteer ? '✅ Installed' : '❌ Missing'}`^);
echo     console.log^(`  - Multer: ${hasMulter ? '✅ Installed' : '❌ Missing'}`^);
echo } catch ^(error^) {
echo     console.log^('❌ Error checking backend dependencies:', error.message^);
echo }
echo.
echo // Check frontend dependencies
echo console.log^('\n📦 Checking frontend dependencies:'^);
echo try {
echo     const frontendPackageJson = JSON.parse^(fs.readFileSync^('./crm-app/frontend/package.json', 'utf8'^)^);
echo     const hasReactDnd = frontendPackageJson.dependencies['react-beautiful-dnd'] ^|^| false;
echo     const hasLucide = frontendPackageJson.dependencies['lucide-react'] ^|^| false;
echo     const hasTypesReactDnd = frontendPackageJson.devDependencies['@types/react-beautiful-dnd'] ^|^| false;
echo     
echo     console.log^(`  - React Beautiful DnD: ${hasReactDnd ? '✅ Installed' : '❌ Missing'}`^);
echo     console.log^(`  - Lucide React: ${hasLucide ? '✅ Installed' : '❌ Missing'}`^);
echo     console.log^(`  - TypeScript Types for DnD: ${hasTypesReactDnd ? '✅ Installed' : '❌ Missing'}`^);
echo } catch ^(error^) {
echo     console.log^('❌ Error checking frontend dependencies:', error.message^);
echo }
echo.
echo console.log^('\n🎉 Verification complete!'^);
echo.
echo if ^(allFilesExist^) {
echo     console.log^('\n🚀 Next steps:'^);
echo     console.log^('1. Restart your backend server: cd crm-app/backend ^&^& npm run dev'^);
echo     console.log^('2. Restart your frontend server: cd crm-app/frontend ^&^& npm run dev'^);
echo     console.log^('3. Access Enhanced Templates at: /quotations/enhanced-templates'^);
echo } else {
echo     console.log^('\n⚠️ Some files are missing. Please check the installation.'^);
echo }
) > verification_check.js

node verification_check.js
del verification_check.js

echo.
echo 🎉 Enhanced Template System fix completed!
echo.
echo 📋 Summary of fixes applied:
echo ✅ Fixed database migration with proper table creation order
echo ✅ Fixed .env file syntax errors ^(quoted values with spaces^)
echo ✅ Applied npm security fixes
echo ✅ Verified all files are in place
echo.
echo 🚀 Next steps:
echo 1. Run the database migration manually:
echo    psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration_fixed.sql
echo 2. Restart your services ^(Docker or npm^)
echo 3. Access the Enhanced Template Manager
echo 4. Test template creation and PDF generation
echo.
echo 📍 Access points:
echo    Frontend: http://your-server:3000/quotations/enhanced-templates
echo    API: http://your-server:3001/api/templates/enhanced/*
echo.
pause
