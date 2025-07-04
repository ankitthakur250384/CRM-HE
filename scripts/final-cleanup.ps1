# Final cleanup script for ASP Cranes CRM project

Write-Host "Starting final cleanup process..." -ForegroundColor Green

# Define the project root
$projectRoot = Split-Path -Parent $PSScriptRoot

# 1. Remove all .bat files (except some essential ones if needed)
Write-Host "Removing .bat files..." -ForegroundColor Cyan
Get-ChildItem -Path $projectRoot -Filter "*.bat" -Recurse | ForEach-Object {
    Write-Host "Removing $($_.FullName)" -ForegroundColor Yellow
    Remove-Item $_.FullName -Force
}

# 2. Remove backup and temporary files
Write-Host "Removing backup and temporary files..." -ForegroundColor Cyan
$backupExtensions = @("*.bak", "*.backup", "*.new", "*.mock", "*.debug", "*.old")
foreach ($ext in $backupExtensions) {
    Get-ChildItem -Path $projectRoot -Filter $ext -Recurse | ForEach-Object {
        Write-Host "Removing $($_.FullName)" -ForegroundColor Yellow
        Remove-Item $_.FullName -Force
    }
}

# 3. Keep only the main .env file and remove others
Write-Host "Cleaning up .env files..." -ForegroundColor Cyan
# Keep the main .env file
$envFiles = @(".env.production", ".env.fixed", ".env.example")
foreach ($envFile in $envFiles) {
    $filePath = Join-Path -Path $projectRoot -ChildPath $envFile
    if (Test-Path $filePath) {
        Write-Host "Removing $filePath" -ForegroundColor Yellow
        Remove-Item $filePath -Force
    }
}

# 4. Clean up unnecessary script files
Write-Host "Cleaning up unnecessary script files..." -ForegroundColor Cyan
$scriptsToKeep = @(
    # Essential production scripts
    "fix-browser-deps.cjs", 
    "fix-pg-module.cjs",
    "check-frontend-imports.mjs",
    "start-server-improved.mjs",
    "migrate-config.cjs",
    "check-server-status.mjs"
)

$scriptsDir = Join-Path -Path $projectRoot -ChildPath "scripts"
Get-ChildItem -Path $scriptsDir -File | Where-Object { $scriptsToKeep -notcontains $_.Name } | ForEach-Object {
    Write-Host "Removing script: $($_.FullName)" -ForegroundColor Yellow
    Remove-Item $_.FullName -Force
}

Write-Host "Cleanup process completed successfully!" -ForegroundColor Green
