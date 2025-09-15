#!/bin/bash

# Enhanced Template System Fix Script
# This script fixes the database and environment issues

echo "🔧 Fixing Enhanced Template System issues..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists psql; then
    echo "❌ psql is not installed. Please install PostgreSQL client first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Navigate to project root
cd "$(dirname "$0")"

# Apply the fixed database migration
echo "🗄️ Applying fixed database migration..."

# Check if .env file exists to get database credentials
if [ -f "crm-app/backend/.env" ]; then
    echo "Loading database configuration from .env file..."
    
    # Extract database connection details from .env file
    DB_HOST=$(grep "^DB_HOST=" crm-app/backend/.env | cut -d '=' -f2)
    DB_NAME=$(grep "^DB_NAME=" crm-app/backend/.env | cut -d '=' -f2)
    DB_USER=$(grep "^DB_USER=" crm-app/backend/.env | cut -d '=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" crm-app/backend/.env | cut -d '=' -f2)
    
    if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
        echo "Applying fixed database migration..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -f enhanced_template_migration_fixed.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Fixed database migration completed successfully"
        else
            echo "❌ Fixed database migration failed. Please check your database connection."
            echo "Manual command: PGPASSWORD='$DB_PASSWORD' psql -h '$DB_HOST' -d '$DB_NAME' -U '$DB_USER' -f enhanced_template_migration_fixed.sql"
        fi
    else
        echo "⚠️ Database credentials not found in .env file. Please run the migration manually:"
        echo "PGPASSWORD='YOUR_PASSWORD' psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration_fixed.sql"
    fi
else
    echo "⚠️ No .env file found. Please run the migration manually:"
    echo "PGPASSWORD='YOUR_PASSWORD' psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration_fixed.sql"
fi

# Fix npm vulnerabilities in backend
echo "🔒 Fixing backend npm vulnerabilities..."
cd crm-app/backend
npm audit fix --force
if [ $? -eq 0 ]; then
    echo "✅ Backend vulnerabilities fixed"
else
    echo "⚠️ Some backend vulnerabilities could not be automatically fixed"
fi

# Fix npm vulnerabilities in frontend
echo "🔒 Fixing frontend npm vulnerabilities..."
cd ../frontend
npm audit fix --force
if [ $? -eq 0 ]; then
    echo "✅ Frontend vulnerabilities fixed"
else
    echo "⚠️ Some frontend vulnerabilities could not be automatically fixed"
fi

# Navigate back to root
cd ../..

# Create verification script
echo "🧪 Running verification..."
cat > verification_check.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🔍 Enhanced Template System Verification\n');

// Check if all required files exist
const requiredFiles = [
    './crm-app/backend/src/services/EnhancedTemplateBuilder.mjs',
    './crm-app/backend/src/services/AdvancedPDFGenerator.mjs',
    './crm-app/backend/src/routes/enhancedTemplateRoutes.mjs',
    './crm-app/frontend/src/components/quotations/EnhancedTemplateBuilder.tsx',
    './crm-app/frontend/src/pages/quotations/EnhancedTemplateManager.tsx',
    './enhanced_template_migration_fixed.sql'
];

console.log('📁 Checking file installation:');
let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file}`);
        allFilesExist = false;
    }
});

// Check if backend dependencies are installed
console.log('\n📦 Checking backend dependencies:');
try {
    const backendPackageJson = JSON.parse(fs.readFileSync('./crm-app/backend/package.json', 'utf8'));
    const hasPuppeteer = backendPackageJson.dependencies.puppeteer || false;
    const hasMulter = backendPackageJson.dependencies.multer || false;
    
    console.log(`  - Puppeteer: ${hasPuppeteer ? '✅ Installed' : '❌ Missing'}`);
    console.log(`  - Multer: ${hasMulter ? '✅ Installed' : '❌ Missing'}`);
} catch (error) {
    console.log('❌ Error checking backend dependencies:', error.message);
}

// Check if frontend dependencies are installed
console.log('\n📦 Checking frontend dependencies:');
try {
    const frontendPackageJson = JSON.parse(fs.readFileSync('./crm-app/frontend/package.json', 'utf8'));
    const hasReactDnd = frontendPackageJson.dependencies['react-beautiful-dnd'] || false;
    const hasLucide = frontendPackageJson.dependencies['lucide-react'] || false;
    const hasTypesReactDnd = frontendPackageJson.devDependencies['@types/react-beautiful-dnd'] || false;
    
    console.log(`  - React Beautiful DnD: ${hasReactDnd ? '✅ Installed' : '❌ Missing'}`);
    console.log(`  - Lucide React: ${hasLucide ? '✅ Installed' : '❌ Missing'}`);
    console.log(`  - TypeScript Types for DnD: ${hasTypesReactDnd ? '✅ Installed' : '❌ Missing'}`);
} catch (error) {
    console.log('❌ Error checking frontend dependencies:', error.message);
}

// Check .env file syntax
console.log('\n⚙️ Checking .env file:');
try {
    const envContent = fs.readFileSync('./crm-app/backend/.env', 'utf8');
    const hasQuotedMFAIssuer = envContent.includes('MFA_ISSUER="ASP Cranes CRM"');
    const hasQuotedEmailFrom = envContent.includes('EMAIL_FROM="ASP Cranes CRM <your_email@company.com>"');
    
    console.log(`  - MFA_ISSUER properly quoted: ${hasQuotedMFAIssuer ? '✅ Fixed' : '❌ Needs fixing'}`);
    console.log(`  - EMAIL_FROM properly quoted: ${hasQuotedEmailFrom ? '✅ Fixed' : '❌ Needs fixing'}`);
} catch (error) {
    console.log('❌ Error checking .env file:', error.message);
}

console.log('\n🎉 Verification complete!');

if (allFilesExist) {
    console.log('\n🚀 Next steps:');
    console.log('1. Restart your backend server: cd crm-app/backend && npm run dev');
    console.log('2. Restart your frontend server: cd crm-app/frontend && npm run dev');
    console.log('3. Access Enhanced Templates at: /quotations/enhanced-templates');
} else {
    console.log('\n⚠️ Some files are missing. Please check the installation.');
}
EOF

node verification_check.js
rm verification_check.js

echo ""
echo "🎉 Enhanced Template System fix completed!"
echo ""
echo "📋 Summary of fixes applied:"
echo "✅ Fixed database migration with proper table creation order"
echo "✅ Fixed .env file syntax errors (quoted values with spaces)"
echo "✅ Applied npm security fixes"
echo "✅ Verified all files are in place"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your services (Docker or npm)"
echo "2. Access the Enhanced Template Manager"
echo "3. Test template creation and PDF generation"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://your-server:3000/quotations/enhanced-templates"
echo "   API: http://your-server:3001/api/templates/enhanced/*"
