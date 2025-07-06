$testData = @{
    name = "Test Crane"
    category = "mobile_crane"
    manufacturingDate = "2018-09"
    registrationDate = "2019-03"
    maxLiftingCapacity = 25
    unladenWeight = 35
    baseRates = @{
        micro = 1500
        small = 2500
        monthly = 75000
        yearly = 850000
    }
    runningCostPerKm = 50
    runningCost = 1200
    description = "Test equipment"
    status = "available"
}

$headers = @{
    "Content-Type" = "application/json"
    "x-bypass-auth" = "development-only-123"
}

$body = $testData | ConvertTo-Json -Depth 3

Write-Host "Testing equipment creation with YYYY-MM date format..."
Write-Host "Data: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/equipment" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Success: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
