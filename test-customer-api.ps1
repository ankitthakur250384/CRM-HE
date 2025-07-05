# Test Customer API with PowerShell
Write-Host "Testing Customer API endpoints..." -ForegroundColor Green

# Test 1: Debug endpoint (no auth required)
Write-Host "`nTesting debug endpoint..." -ForegroundColor Yellow
try {
    $debugResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/customers/debug" -Method GET
    Write-Host "✅ Debug endpoint: $($debugResponse.StatusCode)" -ForegroundColor Green
    $debugContent = $debugResponse.Content | ConvertFrom-Json
    Write-Host "   Message: $($debugContent.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Debug endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login to get token
Write-Host "`nTesting authentication..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@aspcranes.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login: $($loginResponse.StatusCode)" -ForegroundColor Green
    $loginContent = $loginResponse.Content | ConvertFrom-Json
    $token = $loginContent.token
    Write-Host "   Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Cyan
    
    # Test 3: Get customers with auth
    Write-Host "`nTesting customer endpoint with auth..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $customersResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/customers" -Method GET -Headers $headers
    Write-Host "✅ Customers endpoint: $($customersResponse.StatusCode)" -ForegroundColor Green
    $customersContent = $customersResponse.Content | ConvertFrom-Json
    Write-Host "   Found $($customersContent.Count) customers" -ForegroundColor Cyan
    
    if ($customersContent.Count -gt 0) {
        $firstCustomer = $customersContent[0]
        Write-Host "   First customer: $($firstCustomer.name) ($($firstCustomer.email))" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ Authentication/Customers test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n🎉 Customer API test completed!" -ForegroundColor Green
