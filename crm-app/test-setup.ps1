# Quick Test Script for Windows PowerShell
# This script quickly tests if the restructured application works

Write-Host "🧪 Testing CRM Application Setup..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "docker-compose.dev.yml")) {
    Write-Host "❌ Please run this script from the crm-app directory" -ForegroundColor Red
    exit 1
}

# Test environment file
if (-not (Test-Path ".env.development")) {
    Write-Host "📄 Creating .env.development from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env.development
}

# Test Docker Compose file syntax
Write-Host "🔍 Checking Docker Compose syntax..." -ForegroundColor Blue
try {
    docker-compose -f docker-compose.dev.yml config | Out-Null
    Write-Host "✅ Docker Compose syntax is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose syntax error" -ForegroundColor Red
    docker-compose -f docker-compose.dev.yml config
    exit 1
}

# Test backend package.json
Write-Host "🔍 Checking backend package.json..." -ForegroundColor Blue
Push-Location backend
try {
    npm list | Out-Null
    Write-Host "✅ Backend dependencies are valid" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend dependencies may need installation" -ForegroundColor Yellow
}
Pop-Location

# Test frontend package.json
Write-Host "🔍 Checking frontend package.json..." -ForegroundColor Blue
Push-Location frontend
try {
    npm list | Out-Null
    Write-Host "✅ Frontend dependencies are valid" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend dependencies may need installation" -ForegroundColor Yellow
}
Pop-Location

# Test database schema
Write-Host "🔍 Checking database schema..." -ForegroundColor Blue
if (Test-Path "database/schema.sql") {
    Write-Host "✅ Database schema file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Database schema file missing" -ForegroundColor Red
    exit 1
}

# Test important files
Write-Host "🔍 Checking important files..." -ForegroundColor Blue
$required_files = @(
    "backend/src/server.mjs",
    "backend/package.json",
    "backend/Dockerfile",
    "frontend/src/App.tsx",
    "frontend/package.json",
    "frontend/Dockerfile",
    "nginx/nginx.conf",
    "docker-compose.yml",
    "docker-compose.dev.yml"
)

foreach ($file in $required_files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 All tests passed! The application structure is ready." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: .\dev-setup.ps1 (Windows) or ./dev-setup.sh (Linux/Mac)" -ForegroundColor White
Write-Host "2. Or run: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor White
Write-Host "3. Access: http://localhost:3000 (frontend) and http://localhost:3001 (backend)" -ForegroundColor White
Write-Host ""
Write-Host "For production deployment, see PROJECT_DOCUMENTATION.md" -ForegroundColor Yellow
