#!/bin/bash

# Quick Test Script
# This script quickly tests if the restructured application works

echo "🧪 Testing CRM Application Setup..."

# Check if we're in the right directory
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Please run this script from the crm-app directory"
    exit 1
fi

# Test environment file
if [ ! -f ".env.development" ]; then
    echo "📄 Creating .env.development from template..."
    cp .env.example .env.development
fi

# Test Docker Compose file syntax
echo "🔍 Checking Docker Compose syntax..."
if docker-compose -f docker-compose.dev.yml config > /dev/null 2>&1; then
    echo "✅ Docker Compose syntax is valid"
else
    echo "❌ Docker Compose syntax error"
    docker-compose -f docker-compose.dev.yml config
    exit 1
fi

# Test backend package.json
echo "🔍 Checking backend package.json..."
if cd backend && npm list > /dev/null 2>&1; then
    echo "✅ Backend dependencies are valid"
    cd ..
else
    echo "⚠️  Backend dependencies may need installation"
    cd ..
fi

# Test frontend package.json
echo "🔍 Checking frontend package.json..."
if cd frontend && npm list > /dev/null 2>&1; then
    echo "✅ Frontend dependencies are valid"
    cd ..
else
    echo "⚠️  Frontend dependencies may need installation"
    cd ..
fi

# Test database schema
echo "🔍 Checking database schema..."
if [ -f "database/schema.sql" ]; then
    echo "✅ Database schema file exists"
else
    echo "❌ Database schema file missing"
    exit 1
fi

# Test important files
echo "🔍 Checking important files..."
required_files=(
    "backend/src/server.mjs"
    "backend/package.json"
    "backend/Dockerfile"
    "frontend/src/App.tsx"
    "frontend/package.json"
    "frontend/Dockerfile"
    "nginx/nginx.conf"
    "docker-compose.yml"
    "docker-compose.dev.yml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🎉 All tests passed! The application structure is ready."
echo ""
echo "Next steps:"
echo "1. Run: ./dev-setup.sh (Linux/Mac) or .\dev-setup.ps1 (Windows)"
echo "2. Or run: docker-compose -f docker-compose.dev.yml up -d"
echo "3. Access: http://localhost:3000 (frontend) and http://localhost:3001 (backend)"
echo ""
echo "For production deployment, see PROJECT_DOCUMENTATION.md"
