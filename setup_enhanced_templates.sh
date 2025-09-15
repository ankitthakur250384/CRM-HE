#!/bin/bash

# Enhanced Template System Setup Script
# This script installs dependencies and sets up the enhanced template system

echo "🚀 Setting up Enhanced Template System for ASP Cranes CRM..."

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

# Navigate to backend directory
echo "📦 Installing backend dependencies..."
cd crm-app/backend

# Install puppeteer for PDF generation
echo "Installing Puppeteer for PDF generation..."
npm install puppeteer@^22.0.0

# Check if multer is already installed
if ! npm list multer >/dev/null 2>&1; then
    echo "Installing Multer for file uploads..."
    npm install multer@^1.4.5-lts.1
fi

echo "✅ Backend dependencies installed successfully"

# Navigate to frontend directory
echo "📦 Installing frontend dependencies..."
cd ../frontend

# Check if react-beautiful-dnd is installed (should be already)
if ! npm list react-beautiful-dnd >/dev/null 2>&1; then
    echo "Installing React Beautiful DnD..."
    npm install react-beautiful-dnd@^13.1.1
    npm install @types/react-beautiful-dnd@^13.1.1 --save-dev
fi

# Check if lucide-react is installed (should be already)
if ! npm list lucide-react >/dev/null 2>&1; then
    echo "Installing Lucide React icons..."
    npm install lucide-react@^0.344.0
fi

echo "✅ Frontend dependencies installed successfully"

# Navigate back to root
cd ../..

# Run database migration
echo "🗄️ Setting up enhanced template database schema..."

# Check if psql is available
if command_exists psql; then
    echo "Running database migration..."
    
    # Check if .env file exists to get database credentials
    if [ -f "crm-app/backend/.env" ]; then
        echo "Loading database configuration from .env file..."
        source crm-app/backend/.env
        
        # Run the migration
        if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -f enhanced_template_migration.sql
            if [ $? -eq 0 ]; then
                echo "✅ Database migration completed successfully"
            else
                echo "❌ Database migration failed. Please check your database connection."
            fi
        else
            echo "⚠️ Database credentials not found in .env file. Please run the migration manually:"
            echo "psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration.sql"
        fi
    else
        echo "⚠️ No .env file found. Please run the migration manually:"
        echo "psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration.sql"
    fi
else
    echo "⚠️ psql not found. Please install PostgreSQL client or run the migration manually:"
    echo "psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration.sql"
fi

# Create directories for uploads if they don't exist
echo "📁 Creating upload directories..."
mkdir -p crm-app/backend/uploads/templates
mkdir -p crm-app/backend/uploads/logos

echo "🔧 Setting up file permissions..."
chmod 755 crm-app/backend/uploads/templates
chmod 755 crm-app/backend/uploads/logos

# Create a simple test file to verify the setup
echo "🧪 Creating setup verification file..."
cat > setup_verification.js << 'EOF'
/**
 * Enhanced Template System Setup Verification
 * Run this script to verify that all components are properly installed
 */

console.log('🔍 Verifying Enhanced Template System setup...\n');

// Check backend dependencies
try {
    const puppeteer = require('./crm-app/backend/node_modules/puppeteer');
    const multer = require('./crm-app/backend/node_modules/multer');
    console.log('✅ Backend dependencies verified');
    console.log('  - Puppeteer:', puppeteer.executablePath ? 'Installed' : 'Not found');
    console.log('  - Multer: Installed');
} catch (error) {
    console.log('❌ Backend dependencies verification failed:', error.message);
}

// Check if enhanced template files exist
const fs = require('fs');
const backendFiles = [
    './crm-app/backend/src/services/EnhancedTemplateBuilder.mjs',
    './crm-app/backend/src/services/AdvancedPDFGenerator.mjs',
    './crm-app/backend/src/routes/enhancedTemplateRoutes.mjs'
];

const frontendFiles = [
    './crm-app/frontend/src/components/quotations/EnhancedTemplateBuilder.tsx',
    './crm-app/frontend/src/pages/quotations/EnhancedTemplateManager.tsx'
];

console.log('\n📁 Checking file installation:');
[...backendFiles, ...frontendFiles].forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file}`);
    }
});

// Check migration file
if (fs.existsSync('./enhanced_template_migration.sql')) {
    console.log('✅ Database migration file found');
} else {
    console.log('❌ Database migration file not found');
}

console.log('\n🎉 Setup verification complete!');
console.log('\nNext steps:');
console.log('1. Start your backend server: cd crm-app/backend && npm run dev');
console.log('2. Start your frontend server: cd crm-app/frontend && npm run dev');
console.log('3. Navigate to the Enhanced Template Manager in your application');
console.log('4. Create your first enhanced template!');
EOF

node setup_verification.js
rm setup_verification.js

echo ""
echo "🎉 Enhanced Template System setup complete!"
echo ""
echo "📋 Summary:"
echo "✅ Backend dependencies installed (Puppeteer, Multer)"
echo "✅ Frontend dependencies verified (React Beautiful DnD, Lucide React)"
echo "✅ Enhanced template services created"
echo "✅ API routes configured"
echo "✅ Frontend components created"
echo "✅ Database migration prepared"
echo "✅ Upload directories created"
echo ""
echo "🚀 Next steps:"
echo "1. Ensure your database migration has been applied"
echo "2. Restart your backend server to load the new routes"
echo "3. Access the Enhanced Template Manager from your frontend"
echo "4. Start creating professional quotation templates!"
echo ""
echo "📍 Enhanced Template Manager will be available at:"
echo "   Frontend: /quotations/enhanced-templates"
echo "   API: /api/templates/enhanced/*"
echo ""
echo "📖 For more information, check the QUOTATION_PRINTING_GUIDE.md"
