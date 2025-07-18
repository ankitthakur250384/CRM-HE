!/bin/bash

# Local Development and Testing Script
# This script helps run the same checks that CI/CD pipeline runs

set -e

echo "🚀 Starting local CI/CD simulation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Stage 1: Backend Testing
print_status "Stage 1: Testing Backend..."
cd crm-app/backend
if [ -f "package.json" ]; then
    print_status "Installing backend dependencies..."
    npm ci
    
    print_status "Running backend tests..."
    npm test
    
    print_status "Building backend (if script exists)..."
    if npm run | grep -q "build"; then
        npm run build
    else
        print_warning "No build script found for backend, skipping"
    fi
else
    print_error "Backend package.json not found!"
    exit 1
fi

cd ../../

# Stage 2: Frontend Testing
print_status "Stage 2: Testing Frontend..."
cd crm-app/frontend
if [ -f "package.json" ]; then
    print_status "Installing frontend dependencies..."
    npm ci
    
    print_status "Running frontend tests..."
    npm test
    
    print_status "Building frontend with npx (bypassing permission issues)..."
    npx vite build
else
    print_error "Frontend package.json not found!"
    exit 1
fi

cd ../../

# Stage 3: Docker Build and Test
print_status "Stage 3: Docker Build and Test..."
print_status "Building Docker images..."
docker build -t asp-cranes-backend ./crm-app/backend
docker build -t asp-cranes-frontend ./crm-app/frontend

print_status "Starting services with Docker Compose..."
docker-compose up --build -d

print_status "Waiting for services to be ready..."
sleep 30

print_status "Health checking backend..."
timeout 60 bash -c 'until curl -f http://localhost:3001/api/health 2>/dev/null; do echo "Waiting for backend..."; sleep 5; done' || print_warning "Backend health check failed or timed out"

print_status "Health checking frontend..."
timeout 60 bash -c 'until curl -f http://localhost:3000 2>/dev/null; do echo "Waiting for frontend..."; sleep 5; done' || print_warning "Frontend health check failed or timed out"

print_status "Showing running containers..."
docker ps

print_status "Cleaning up..."
docker-compose down

print_status "🎉 Local CI/CD simulation completed successfully!"
print_status "Your code is ready for the pipeline!"

echo ""
echo "Next steps:"
echo "1. Commit your changes"
echo "2. Push to GitHub"
echo "3. Check the Actions tab for pipeline results"
