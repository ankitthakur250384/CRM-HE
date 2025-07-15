# Development Setup Script for Windows PowerShell
# This script sets up the development environment

Write-Host "🚀 Setting up CRM Development Environment..." -ForegroundColor Green

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path .env.development)) {
    Write-Host "📄 Creating .env.development file..." -ForegroundColor Yellow
    Copy-Item .env.example .env.development
    Write-Host "⚠️  Please edit .env.development with your configuration" -ForegroundColor Yellow
}

# Build and start development environment
Write-Host "🏗️  Building development environment..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml build

Write-Host "🔄 Starting development services..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml up -d

Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$services = docker-compose -f docker-compose.dev.yml ps
if ($services -match "Up") {
    Write-Host "✅ Development environment is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Services available at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:3001" -ForegroundColor White
    Write-Host "   Database: localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 To view logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Yellow
    Write-Host "🛑 To stop: docker-compose -f docker-compose.dev.yml down" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to start development environment" -ForegroundColor Red
    docker-compose -f docker-compose.dev.yml logs
    exit 1
}
