@echo off
REM Test Quotation API Integration with Server Restart

echo ========================================
echo Quotation API Integration Test with Server Restart
echo ========================================
echo.

REM Check if the server is already running
netstat -ano | findstr ":3001" > nul
if %errorlevel% equ 0 (
  echo Server is running on port 3001, stopping it...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    taskkill /F /PID %%a
    echo Stopped process with PID %%a
  )
  echo Waiting 2 seconds for the server to fully stop...
  timeout /t 2 /nobreak > nul
) else (
  echo No server running on port 3001.
)

echo.
echo Starting API server...
start "API Server" cmd /c "node src/server.mjs"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak > nul

echo.
echo Testing quotation API endpoints...
node scripts/verify-quotation-routes.mjs

echo.
echo Test completed.
echo Check the output above for results.
echo.
echo Press any key to exit...
pause > nul
