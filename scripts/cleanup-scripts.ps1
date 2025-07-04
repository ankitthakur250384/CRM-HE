# Script to clean up unnecessary scripts from the scripts directory

$scriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptsToKeep = Get-Content "$scriptsDir\keep-scripts.txt"

# Also keep this script and keep-scripts.txt
$scriptsToKeep += "cleanup-scripts.ps1"
$scriptsToKeep += "keep-scripts.txt"
$scriptsToKeep += "node_modules"
$scriptsToKeep += "package.json"
$scriptsToKeep += "tsconfig.json"

Write-Host "Starting script cleanup process..." -ForegroundColor Green
Write-Host "Scripts to keep:" -ForegroundColor Cyan
foreach ($script in $scriptsToKeep) {
    Write-Host "  - $script" -ForegroundColor Yellow
}

# Get all files in the scripts directory
$allScripts = Get-ChildItem -Path $scriptsDir -File | Select-Object -ExpandProperty Name

# Remove scripts that are not in the keep list
foreach ($script in $allScripts) {
    if ($scriptsToKeep -notcontains $script) {
        Write-Host "Removing script: $script" -ForegroundColor Red
        Remove-Item -Path (Join-Path -Path $scriptsDir -ChildPath $script) -Force
    }
}

Write-Host "Script cleanup completed successfully!" -ForegroundColor Green
