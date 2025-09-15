@echo off
REM Enhanced Templates Database Setup Script for Windows
REM This script creates the enhanced_templates table and initial data

echo 🚀 Setting up Enhanced Templates database...

REM Database connection parameters
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=asp_crm
set DB_USER=postgres
set DB_PASSWORD=crmdb@21

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ psql could not be found. Please install PostgreSQL client.
    exit /b 1
)

echo 🔌 Testing database connection...
set PGPASSWORD=%DB_PASSWORD%

REM Test connection
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Cannot connect to database. Please check your connection parameters.
    exit /b 1
)

echo ✅ Database connection successful!

REM Run the SQL script
echo 📝 Creating enhanced_templates table...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f create_enhanced_templates_table.sql

if %errorlevel% equ 0 (
    echo ✅ Enhanced templates table created successfully!
    echo 🎉 Setup complete! You can now use the Enhanced Template system.
) else (
    echo ❌ Failed to create enhanced templates table.
    exit /b 1
)

REM Clean up
set PGPASSWORD=

echo 📋 Database setup summary:
echo   - Table: enhanced_templates
echo   - Features: CRUD operations, JSONB storage, soft delete
echo   - Indexes: Created for performance
echo   - Sample data: One default template inserted

pause
