@echo off
REM Setup and Test Deals Pipeline Integration

echo.
echo ===================================================
echo Setting up and testing Deals Pipeline integration
echo ===================================================
echo.

echo Step 1: Creating deals table in PostgreSQL...
call npm run db:create-deals
if %ERRORLEVEL% NEQ 0 (
    echo Failed to create deals table!
    exit /b %ERRORLEVEL%
)
echo.

echo Step 2: Testing deals API endpoints...
call npm run test:deals
if %ERRORLEVEL% NEQ 0 (
    echo Deals API test failed!
    exit /b %ERRORLEVEL%
)
echo.

echo Step 3: Starting the development server...
echo To complete the test:
echo - Log in to the application
echo - Navigate to the Deals page
echo - Try dragging deals between stages to verify functionality
echo.
echo Press Ctrl+C to exit the server when done.
echo.
call npm run dev
