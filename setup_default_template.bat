@echo off
REM Setup Default Template Script for Windows
REM This script ensures the default template exists in the database

echo 🔧 Setting up default template for ASP Cranes Enhanced Template System...

REM Set database connection details (modify as needed)
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=asp_crm
set DB_USER=postgres
set DB_PASSWORD=crmdb@21

echo 📦 Database: %DB_NAME% on %DB_HOST%:%DB_PORT%

REM Check if PostgreSQL is available
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ PostgreSQL client (psql) not found. Please install PostgreSQL and add it to PATH.
    pause
    exit /b 1
)

REM Test database connection
echo 🔌 Testing database connection...
set PGPASSWORD=%DB_PASSWORD%

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Cannot connect to database. Please check connection details.
    pause
    exit /b 1
)

echo ✅ Database connection successful!

REM Run the default template setup script
echo 🚀 Creating/updating default template...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f ensure_default_template.sql

if %ERRORLEVEL% equ 0 (
    echo ✅ Default template setup completed successfully!
    echo.
    echo 📋 Verifying default template...
    
    REM Verify the template exists
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT id, name, is_default, is_active FROM enhanced_templates WHERE id = 'tpl_default_001';"
    
    echo.
    echo 🎉 Default template is ready!
    echo 📝 Template ID: tpl_default_001
    echo 📝 Template Name: Default ASP Cranes Template
    echo.
    echo You can now use the Enhanced Template System to:
    echo   • Set this as the default template in Config ^> Templates
    echo   • Create new templates using the Template Builder
    echo   • Generate professional quotations
) else (
    echo ❌ Error setting up default template. Please check the database logs.
    pause
    exit /b 1
)

REM Cleanup
set PGPASSWORD=

echo 🏁 Default template setup script completed!
pause
