@echo off
setlocal enabledelayedexpansion

:: Notification Engine Deployment Script for Windows
:: Run this script to deploy the notification engine to your ASP Cranes CRM

echo 🚀 ASP Cranes CRM - Notification Engine Deployment
echo =================================================

:: Check if we're in the right directory
if not exist "crm-app\backend\package.json" (
    echo [ERROR] This script must be run from the asp-cranes-structured directory
    echo [ERROR] Current directory: %CD%
    pause
    exit /b 1
)

echo.
echo [STEP] 1. Installing Required Packages
echo ----------------------------------------
cd crm-app\backend

:: Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found in crm-app\backend
    pause
    exit /b 1
)

:: Install required packages
echo [INFO] Installing nodemailer, twilio, and ws packages...
call npm install nodemailer twilio ws
if !errorlevel! equ 0 (
    echo [INFO] ✅ Packages installed successfully
) else (
    echo [ERROR] ❌ Failed to install packages
    pause
    exit /b 1
)

cd ..\..

echo.
echo [STEP] 2. Database Schema Setup
echo ----------------------------------------
echo [INFO] Database schema file: enhanced_notifications_schema.sql
echo [WARNING] You need to manually run the database schema update:
echo.
echo For PostgreSQL:
echo   psql -h localhost -d aspcranes -U your_username -f enhanced_notifications_schema.sql
echo.
echo Or import the SQL file through your database management tool
echo.

echo.
echo [STEP] 3. Environment Configuration
echo ----------------------------------------
echo [INFO] Creating sample environment configuration...

:: Create sample .env file if it doesn't exist
set ENV_FILE=crm-app\backend\.env.sample
if not exist "!ENV_FILE!" (
    (
        echo # Database Configuration
        echo DATABASE_URL=postgresql://username:password@localhost:5432/aspcranes
        echo.
        echo # Email Configuration ^(SMTP^)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_SECURE=false
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-gmail-app-password
        echo EMAIL_FROM=ASP Cranes CRM ^<your-email@gmail.com^>
        echo.
        echo # SMS Configuration ^(Twilio^)
        echo TWILIO_ACCOUNT_SID=your_twilio_account_sid
        echo TWILIO_AUTH_TOKEN=your_twilio_auth_token
        echo TWILIO_PHONE_NUMBER=+1234567890
        echo.
        echo # Notification Engine Settings ^(Optional^)
        echo NOTIFICATION_BATCH_SIZE=50
        echo NOTIFICATION_RETRY_ATTEMPTS=3
        echo NOTIFICATION_RETRY_DELAY=5000
        echo SCHEDULED_PROCESSOR_INTERVAL=60000
        echo.
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV=development
    ) > "!ENV_FILE!"
    echo [INFO] ✅ Created sample environment file: !ENV_FILE!
) else (
    echo [INFO] Environment sample file already exists
)

echo.
echo [STEP] 4. Configuration Instructions
echo ----------------------------------------
echo [WARNING] IMPORTANT: You must configure the following before starting the server:
echo.
echo 1. Copy .env.sample to .env and update with your credentials:
echo    copy crm-app\backend\.env.sample crm-app\backend\.env
echo.
echo 2. Configure email settings:
echo    - For Gmail: Enable 2FA and create an App Password
echo    - Update SMTP_USER and SMTP_PASS with your credentials
echo.
echo 3. Configure SMS settings (optional):
echo    - Create a Twilio account and get your credentials
echo    - Update TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER
echo.
echo 4. Run the database schema update
echo.

echo.
echo [STEP] 5. Verification Steps
echo ----------------------------------------
echo [INFO] After configuration, verify the installation:
echo.
echo 1. Start the server:
echo    cd crm-app\backend ^&^& npm run dev
echo.
echo 2. Look for these messages in the console:
echo    - '🚀 API server running at http://localhost:3001'
echo    - '✅ Notification Engine initialized successfully'
echo    - '- WebSocket: ws://localhost:3001 (real-time notifications)'
echo.
echo 3. Test the notification API:
echo    curl -X GET http://localhost:3001/api/notifications/health
echo.

echo.
echo [STEP] 6. Feature Summary
echo ----------------------------------------
echo [INFO] The notification engine provides:
echo • 📱 Real-time in-app notifications via WebSocket
echo • 📧 Email notifications via SMTP
echo • 📱 SMS notifications via Twilio
echo • 🔄 Automatic notifications for leads, jobs, and quotations
echo • ⚙️  User preference management
echo • 📊 Notification analytics and logging
echo • ⏰ Scheduled notification delivery
echo • 🎨 Customizable notification templates
echo.

echo.
echo [STEP] 7. Next Steps
echo ----------------------------------------
echo [INFO] Complete setup checklist:
echo ☐ Install packages (✅ Done)
echo ☐ Run database schema update
echo ☐ Configure environment variables
echo ☐ Test email configuration
echo ☐ Test SMS configuration (optional)
echo ☐ Start the server and verify initialization
echo ☐ Test notification functionality
echo.

echo [INFO] 📚 For detailed instructions, see: NOTIFICATION_ENGINE_SETUP.md
echo [INFO] 🎉 Notification Engine deployment preparation complete!

echo.
echo =================================================
echo Next: Configure your .env file and run the database schema update
echo Then start the server with: cd crm-app\backend ^&^& npm run dev
echo =================================================

pause
