@echo off
echo === ASP Cranes Template System Fix ===
echo 1. Running database schema update...

REM Run database update
psql -U postgres -d asp_crm -f update_template_schema.sql

echo.
echo 2. Checking template data...

REM Check templates
psql -U postgres -d asp_crm -f check_templates.sql

echo.
echo 3. Database update complete!
echo 4. Next steps:
echo    - Restart your backend server
echo    - Refresh your browser
echo    - Test template creation and editing
echo.
echo === Fix Complete ===
pause
