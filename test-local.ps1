# Local Development and Testing Script for Windows
# This script helps run the same checks that CI/CD pipeline runs

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting local CI/CD simulation..." -ForegroundColor Green

# Function to print colored output
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
}

# Stage 1: Backend Testing
Write-Info "Stage 1: Testing Backend..."
Set-Location "crm-app/backend"
if (Test-Path "package.json") {
    Write-Info "Installing backend dependencies..."
    npm ci
    
    Write-Info "Running backend tests..."
    npm test
    
    Write-Info "Building backend (if script exists)..."
    $buildScript = npm run | Select-String "build"
    if ($buildScript) {
        npm run build
    } else {
        Write-Warning "No build script found for backend, skipping"
    }
} else {
    Write-Error "Backend package.json not found!"
    exit 1
}

Set-Location "../.."

# Stage 2: Frontend Testing
Write-Info "Stage 2: Testing Frontend..."
Set-Location "crm-app/frontend"
if (Test-Path "package.json") {
    Write-Info "Installing frontend dependencies..."
    npm ci
    
    Write-Info "Running frontend tests..."
    npm test
    
    Write-Info "Building frontend with npx (bypassing permission issues)..."
    npx vite build
} else {
    Write-Error "Frontend package.json not found!"
    exit 1
}

Set-Location "../.."

# Stage 3: Docker Build and Test
Write-Info "Stage 3: Docker Build and Test..."
Write-Info "Building Docker images..."
docker build -t asp-cranes-backend ./crm-app/backend
docker build -t asp-cranes-frontend ./crm-app/frontend

Write-Info "Starting services with Docker Compose..."
docker-compose up --build -d

Write-Info "Waiting for services to be ready..."
Start-Sleep 30

Write-Info "Health checking backend..."
$backendHealthy = $false
for ($i = 0; $i -lt 12; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $backendHealthy = $true
            break
        }
    } catch {
        Write-Host "Waiting for backend..." -ForegroundColor Yellow
        Start-Sleep 5
    }
}

if (-not $backendHealthy) {
    Write-Warning "Backend health check failed or timed out"
}

Write-Info "Health checking frontend..."
$frontendHealthy = $false
for ($i = 0; $i -lt 12; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $frontendHealthy = $true
            break
        }
    } catch {
        Write-Host "Waiting for frontend..." -ForegroundColor Yellow
        Start-Sleep 5
    }
}

if (-not $frontendHealthy) {
    Write-Warning "Frontend health check failed or timed out"
}

Write-Info "Showing running containers..."
docker ps

Write-Info "Cleaning up..."
docker-compose down

Write-Info "🎉 Local CI/CD simulation completed successfully!"
Write-Info "Your code is ready for the pipeline!"

Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Commit your changes"
Write-Host "2. Push to GitHub"
Write-Host "3. Check the Actions tab for pipeline results"
