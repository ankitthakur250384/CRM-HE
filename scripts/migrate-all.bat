@echo off
rem Batch file to migrate all Firestore collections to PostgreSQL tables

echo Starting migration of all collections...

rem Customers Collection
echo.
echo Migrating customers collection...
node scripts\migrate-firestore-collection.cjs customers customers --uid-column customer_id --mandatory-fields customer_id,name,created_at,updated_at
if %ERRORLEVEL% NEQ 0 (
  echo Error migrating customers collection
  pause
  exit /b %ERRORLEVEL%
)

rem Equipment Collection
echo.
echo Migrating equipment collection...
node scripts\migrate-firestore-collection.cjs equipment equipment --uid-column equipment_id --mandatory-fields equipment_id,name,created_at,updated_at
if %ERRORLEVEL% NEQ 0 (
  echo Error migrating equipment collection
  pause
  exit /b %ERRORLEVEL%
)

rem Deals Collection
echo.
echo Migrating deals collection...
node scripts\migrate-firestore-collection.cjs deals deals --uid-column deal_id --mandatory-fields deal_id,status,created_at,updated_at
if %ERRORLEVEL% NEQ 0 (
  echo Error migrating deals collection
  pause
  exit /b %ERRORLEVEL%
)

rem Leads Collection
echo.
echo Migrating leads collection...
node scripts\migrate-firestore-collection.cjs leads leads --uid-column lead_id --mandatory-fields lead_id,status,created_at,updated_at
if %ERRORLEVEL% NEQ 0 (
  echo Error migrating leads collection
  pause
  exit /b %ERRORLEVEL%
)

rem Quotations Collection
echo.
echo Migrating quotations collection...
node scripts\migrate-firestore-collection.cjs quotations quotations --uid-column quotation_id --mandatory-fields quotation_id,status,created_at,updated_at
if %ERRORLEVEL% NEQ 0 (
  echo Error migrating quotations collection
  pause
  exit /b %ERRORLEVEL%
)

rem Config Collection
echo.
echo Migrating config collection...
node scripts\migrate-config.cjs
if %ERRORLEVEL% NEQ 0 (
  echo Error migrating config collection
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Migration of all collections completed successfully!
pause
