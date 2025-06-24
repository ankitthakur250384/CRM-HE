@echo off
echo Starting ASP CRM development environment...
echo.

echo Starting API server...
start cmd /k "npm run server:dev"

echo Starting frontend...
start cmd /k "npm run dev"

echo.
echo Both servers started!
echo - Frontend: http://localhost:5173
echo - API: http://localhost:3001
echo.
echo Press any key to shutdown both servers...

pause > nul

echo Shutting down servers...
taskkill /f /im node.exe > nul 2>&1
echo Done!
