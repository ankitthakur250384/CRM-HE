@echo off
REM MFA Database Setup Script for Windows
REM Run this to set up MFA support in your database

echo 🔧 Setting up MFA database schema...

REM Check if PostgreSQL is running
docker-compose ps postgres | findstr /C:"Up" >nul
if errorlevel 1 (
    echo ❌ Database container is not running. Starting...
    docker-compose up -d postgres
    timeout /t 10 /nobreak >nul
)

REM Run the MFA schema setup
echo 📊 Creating MFA tables and columns...
docker-compose exec -T postgres psql -U postgres -d asp_crm < setup_mfa_database.sql

if %errorlevel% equ 0 (
    echo ✅ MFA database schema setup complete!
    echo.
    echo 🔒 MFA Features Added:
    echo   - MFA enable/disable for users
    echo   - Temporary secret storage during setup
    echo   - Backup codes for recovery
    echo   - MFA attempt logging for security
    echo.
    echo 🚀 You can now restart the backend service:
    echo   docker-compose restart backend
    echo.
    echo 📱 Test MFA endpoints:
    echo   POST /api/mfa/setup - Start MFA setup
    echo   POST /api/mfa/verify-setup - Complete MFA setup
    echo   GET /api/mfa/status - Check MFA status
    echo   POST /api/mfa/disable - Disable MFA
) else (
    echo ❌ Error setting up MFA database schema
    echo Please check the database connection and try again
    exit /b 1
)
