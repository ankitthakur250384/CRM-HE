#!/bin/bash
# Run schema update for modern templates

echo "Running template schema update..."

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q postgres; then
    echo "Error: PostgreSQL container is not running. Please start the database first."
    echo "Try running: docker-compose up db"
    exit 1
fi

# Run the schema update
echo "Applying schema updates..."
docker exec -i asp-cranes-structured-db-1 psql -U postgres -d aspcranes_crm < update_template_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema update completed successfully!"
else
    echo "❌ Schema update failed. Please check the logs above."
    exit 1
fi

echo "Done!"
