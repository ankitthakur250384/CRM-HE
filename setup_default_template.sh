#!/bin/bash

# Setup Default Template Script
# This script ensures the default template exists in the database

echo "🔧 Setting up default template for ASP Cranes Enhanced Template System..."

# Get database connection details from environment or use defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-asp_crm}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-crmdb@21}

echo "📦 Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) not found. Please install postgresql-client."
    exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
export PGPASSWORD=$DB_PASSWORD

if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo "❌ Cannot connect to database. Please check connection details."
    exit 1
fi

echo "✅ Database connection successful!"

# Run the default template setup script
echo "🚀 Creating/updating default template..."

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ensure_default_template.sql

if [ $? -eq 0 ]; then
    echo "✅ Default template setup completed successfully!"
    echo ""
    echo "📋 Verifying default template..."
    
    # Verify the template exists
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, name, is_default, is_active FROM enhanced_templates WHERE id = 'tpl_default_001';"
    
    echo ""
    echo "🎉 Default template is ready!"
    echo "📝 Template ID: tpl_default_001"
    echo "📝 Template Name: Default ASP Cranes Template"
    echo ""
    echo "You can now use the Enhanced Template System to:"
    echo "  • Set this as the default template in Config > Templates"
    echo "  • Create new templates using the Template Builder"
    echo "  • Generate professional quotations"
else
    echo "❌ Error setting up default template. Please check the database logs."
    exit 1
fi

# Cleanup
unset PGPASSWORD

echo "🏁 Default template setup script completed!"
