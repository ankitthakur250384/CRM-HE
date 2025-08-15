@echo off
echo Running database schema update...
psql -U postgres -d asp_crm -f update_template_schema.sql
pause
