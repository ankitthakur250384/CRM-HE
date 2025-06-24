@echo off
echo Starting ASP Cranes CRM...

echo.
echo === Checking Database Connection ===
call npm run db:pg-test
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Database connection failed! Please check your database configuration.
  echo Make sure PostgreSQL is running and the credentials in .env are correct.
  goto :error
)

echo.
echo === Starting API Server ===
echo Starting API server in a new terminal...
start cmd /k "npm run server"

echo.
echo === Starting Frontend ===
echo Starting frontend application...
echo.
echo When both services are running, visit http://localhost:5173 in your browser.
echo.

npm run dev

goto :end

:error
echo.
echo Setup failed. Please fix the issues above and try again.
exit /b 1

:end
