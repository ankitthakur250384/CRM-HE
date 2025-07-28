# Comprehensive Database and API Verification Script for ASP Cranes CRM (PowerShell)
# Run this script on your deployed server to verify all connections and operations

Write-Host "🚀 ASP Cranes CRM - Database and API Verification Script" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "docker-compose.yml")) {
    Write-Host "❌ Error: docker-compose.yml not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Step 1: Checking Docker containers..." -ForegroundColor Blue
Write-Host ""

# Check container status
try {
    $containers = docker-compose ps --format json | ConvertFrom-Json
    $runningContainers = ($containers | Where-Object { $_.State -eq "running" }).Count
    $totalContainers = $containers.Count
    
    Write-Host "Running containers: $runningContainers / $totalContainers"
    
    if ($runningContainers -ne $totalContainers) {
        Write-Host "⚠️ Not all containers are running. Starting containers..." -ForegroundColor Yellow
        docker-compose up -d
        Start-Sleep 10
        Write-Host "Waiting for containers to be healthy..."
        Start-Sleep 30
    } else {
        Write-Host "✅ All containers are running" -ForegroundColor Green
    }
    
    # Show container status
    Write-Host ""
    Write-Host "Container status:"
    docker-compose ps
    
} catch {
    Write-Host "❌ Error checking containers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Step 2: Checking database tables and structure..." -ForegroundColor Blue
Write-Host ""

# Check if postgres container is running
try {
    $postgresStatus = docker-compose ps postgres | Select-String "Up"
    
    if ($postgresStatus) {
        Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
        
        # List all tables
        Write-Host ""
        Write-Host "Database tables:"
        docker exec asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "\dt"
        
        # Check table row counts
        Write-Host ""
        Write-Host "Table row counts:"
        $sqlQuery = @"
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows
        FROM pg_stat_user_tables 
        ORDER BY tablename;
"@
        docker exec asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c $sqlQuery
        
    } else {
        Write-Host "❌ PostgreSQL container is not running" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Step 3: Testing API endpoints..." -ForegroundColor Blue
Write-Host ""

# Check if backend is responding
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend API is responding" -ForegroundColor Green
        
        # Test API info endpoint
        Write-Host ""
        Write-Host "API Information:"
        try {
            $apiInfo = Invoke-RestMethod -Uri "http://localhost:3001/api" -Method Get -TimeoutSec 10
            $apiInfo | ConvertTo-Json -Depth 3
        } catch {
            Write-Host "Could not retrieve API info" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Testing specific endpoints:"
        
        # Test endpoints
        $endpoints = @(
            @{ Name = "Customers"; Uri = "http://localhost:3001/api/customers" },
            @{ Name = "Leads"; Uri = "http://localhost:3001/api/leads" },
            @{ Name = "Deals"; Uri = "http://localhost:3001/api/deals" },
            @{ Name = "Users"; Uri = "http://localhost:3001/api/users" },
            @{ Name = "Equipment"; Uri = "http://localhost:3001/api/equipment" }
        )
        
        foreach ($endpoint in $endpoints) {
            try {
                $response = Invoke-WebRequest -Uri $endpoint.Uri -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
                    Write-Host "✅ $($endpoint.Name) endpoint accessible (HTTP $($response.StatusCode))" -ForegroundColor Green
                } else {
                    Write-Host "❌ $($endpoint.Name) endpoint failed (HTTP $($response.StatusCode))" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ $($endpoint.Name) endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
    } else {
        Write-Host "❌ Backend API is not responding" -ForegroundColor Red
        Write-Host "Backend logs:"
        docker-compose logs --tail=20 backend
    }
} catch {
    Write-Host "❌ Backend API is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Step 4: Testing frontend..." -ForegroundColor Blue
Write-Host ""

# Check if frontend is responding
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend is not accessible (HTTP $($frontendResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Frontend logs:"
    docker-compose logs --tail=20 frontend
}

Write-Host ""
Write-Host "📋 Step 5: Configuration verification..." -ForegroundColor Blue
Write-Host ""

# Check environment variables
Write-Host "Backend environment configuration:"
try {
    $envVars = docker exec asp-cranes-structured-backend-1 printenv | Where-Object { $_ -match "DB_|NODE_|PORT|JWT_" }
    $envVars | Sort-Object
} catch {
    Write-Host "Could not retrieve environment variables" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Database connection configuration:"
try {
    $dbConfigQuery = @"
    SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version;
"@
    docker exec asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c $dbConfigQuery
} catch {
    Write-Host "Could not retrieve database configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 6: Performance and resource check..." -ForegroundColor Blue
Write-Host ""

# Check container resources
Write-Host "Container resource usage:"
try {
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
} catch {
    Write-Host "Could not retrieve container stats" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Disk usage:"
try {
    docker system df
} catch {
    Write-Host "Could not retrieve disk usage" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Verification completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary Report:" -ForegroundColor Blue
Write-Host "==================="

# Generate summary based on checks
Write-Host ""
Write-Host "🔗 Access URLs:" -ForegroundColor Blue
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend API: http://localhost:3001/api"
Write-Host "API Health: http://localhost:3001/api/health"
Write-Host ""

# Final recommendations
Write-Host "💡 Recommendations:" -ForegroundColor Blue
Write-Host "- If issues persist, check logs: docker-compose logs [service-name]"
Write-Host "- Verify all environment variables are set correctly"
Write-Host "- Ensure database migrations have run successfully"
Write-Host "- Check network connectivity between containers"
Write-Host ""

Write-Host "Script completed at: $(Get-Date)" -ForegroundColor Green

# Manual CRUD test function
function Test-ManualCRUD {
    Write-Host ""
    Write-Host "🧪 Manual CRUD Test Instructions:" -ForegroundColor Cyan
    Write-Host "================================="
    Write-Host ""
    Write-Host "1. Test Customer Creation:"
    Write-Host '   curl -X POST http://localhost:3001/api/customers -H "Content-Type: application/json" -d "{\"name\":\"Test Customer\",\"company_name\":\"Test Co\",\"contact_name\":\"John Doe\",\"email\":\"test@test.com\",\"phone\":\"+1-555-0123\",\"address\":\"123 Test St\"}"'
    Write-Host ""
    Write-Host "2. Test Customer List:"
    Write-Host "   curl http://localhost:3001/api/customers"
    Write-Host ""
    Write-Host "3. Test Lead Creation:"
    Write-Host '   curl -X POST http://localhost:3001/api/leads -H "Content-Type: application/json" -d "{\"title\":\"Test Lead\",\"company_name\":\"Test Lead Co\",\"contact_name\":\"Jane Smith\",\"email\":\"jane@test.com\",\"phone\":\"+1-555-0456\",\"equipment_type\":\"crane\",\"status\":\"new\"}"'
    Write-Host ""
    Write-Host "4. Test User Registration:"
    Write-Host '   curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin@aspcranes.com\",\"password\":\"admin123\",\"display_name\":\"Admin User\",\"role\":\"admin\"}"'
    Write-Host ""
    Write-Host "5. Test User Login:"
    Write-Host '   curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@aspcranes.com\",\"password\":\"admin123\"}"'
    Write-Host ""
}

# Ask if user wants to see manual test instructions
$showTests = Read-Host "Would you like to see manual CRUD test commands? (y/N)"
if ($showTests -eq "y" -or $showTests -eq "Y") {
    Test-ManualCRUD
}
