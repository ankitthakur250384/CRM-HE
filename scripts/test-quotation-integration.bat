@echo off
REM Test Quotation API Integration

echo ========================================
echo Quotation API Integration Test
echo ========================================
echo.

REM Check if the server is already running
netstat -ano | findstr ":3001" > nul
if %errorlevel% equ 0 (
  echo API server is already running on port 3001
) else (
  echo Starting API server in a new window...
  start "API Server" cmd /c "node src/server.mjs"
  
  echo Waiting 5 seconds for server to start...
  timeout /t 5 /nobreak > nul
)

echo.
echo Testing login with admin credentials...
node scripts/test-login.mjs

echo.
echo Press any key to continue with the quotation API test...
pause > nul

echo.
echo Running quotation API test...
node scripts/test-quotation-api.mjs

echo.
echo Test completed.
echo Check the output above for results.
echo.
echo Press any key to exit...
pause > nul
