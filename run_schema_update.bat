@echo off
REM Run schema update for modern templates

echo Running template schema update...

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker first.
    exit /b 1
)

REM Check if PostgreSQL container is running
docker ps | findstr postgres >nul
if %errorlevel% neq 0 (
    echo Error: PostgreSQL container is not running. Please start the database first.
    echo Try running: docker-compose up db
    exit /b 1
)

REM Run the schema update
echo Applying schema updates...
docker exec -i asp-cranes-structured-db-1 psql -U postgres -d aspcranes_crm < update_template_schema.sql

if %errorlevel% equ 0 (
    echo ✅ Schema update completed successfully!
) else (
    echo ❌ Schema update failed. Please check the logs above.
    exit /b 1
)

echo Done!
pause
