# Quotation API Integration Test PowerShell Script

Write-Host "========================================"
Write-Host "Quotation API Integration Test"
Write-Host "========================================"
Write-Host ""

# Check if the server is already running
$serverRunning = $false
try {
    $connections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "API server is already running on port 3001"
        $serverRunning = $true
    }
} catch {
    # Port check failed, assume server is not running
}

if (-not $serverRunning) {
    Write-Host "Starting API server in a new window..."
    Start-Process powershell -ArgumentList "-Command node src/server.mjs"
    
    Write-Host "Waiting 5 seconds for server to start..."
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Testing login with admin credentials..."
node scripts/test-login.mjs

Write-Host ""
Write-Host "Press any key to continue with the quotation API test..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Running quotation API test..."
node scripts/test-quotation-api.mjs

Write-Host ""
Write-Host "Test completed."
Write-Host "Check the output above for results."
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
