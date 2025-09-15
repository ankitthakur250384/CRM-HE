#!/bin/bash

# Enhanced Templates Database Setup Script
# This script creates the enhanced_templates table and initial data

echo "🚀 Setting up Enhanced Templates database..."

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-asp_crm}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-crmdb@21}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql could not be found. Please install PostgreSQL client."
    exit 1
fi

# Check if we can connect to the database
echo "🔌 Testing database connection..."
export PGPASSWORD=$DB_PASSWORD
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo "❌ Cannot connect to database. Please check your connection parameters."
    exit 1
fi

echo "✅ Database connection successful!"

# Run the SQL script
echo "📝 Creating enhanced_templates table..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f create_enhanced_templates_table.sql

if [ $? -eq 0 ]; then
    echo "✅ Enhanced templates table created successfully!"
    echo "🎉 Setup complete! You can now use the Enhanced Template system."
else
    echo "❌ Failed to create enhanced templates table."
    exit 1
fi

# Clean up
unset PGPASSWORD

echo "📋 Database setup summary:"
echo "  - Table: enhanced_templates"
echo "  - Features: CRUD operations, JSONB storage, soft delete"
echo "  - Indexes: Created for performance"
echo "  - Sample data: One default template inserted"
