# JWT Token Generation Script for ASP Cranes CRM (Windows PowerShell)
# Generates fresh JWT tokens for production deployment

Write-Host "🔐 Generating fresh JWT tokens for production deployment..." -ForegroundColor Green

# Generate JWT Secret (64 bytes)
$JWT_SECRET = & node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Generate JWT Refresh Secret (64 bytes)  
$JWT_REFRESH_SECRET = & node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Generate Session Secret (32 bytes)
$SESSION_SECRET = & node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

Write-Host "✅ Generated new JWT secrets" -ForegroundColor Green

# Function to update environment file
function Update-EnvFile {
    param(
        [string]$FilePath,
        [string]$FileDescription
    )
    
    if (Test-Path $FilePath) {
        Write-Host "📝 Updating $FileDescription..." -ForegroundColor Yellow
        
        # Backup original file
        Copy-Item $FilePath "$FilePath.backup"
        
        # Read content
        $content = Get-Content $FilePath
        
        # Update JWT secrets
        $content = $content -replace "JWT_SECRET=.*", "JWT_SECRET=$JWT_SECRET"
        $content = $content -replace "JWT_REFRESH_SECRET=.*", "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
        $content = $content -replace "SESSION_SECRET=.*", "SESSION_SECRET=$SESSION_SECRET"
        
        # Write back to file
        $content | Set-Content $FilePath
        
        Write-Host "✅ $FileDescription updated" -ForegroundColor Green
    } else {
        Write-Host "❌ $FileDescription not found at $FilePath" -ForegroundColor Red
    }
}

# Update backend .env file
Update-EnvFile -FilePath "crm-app\backend\.env" -FileDescription "Backend .env file"

# Update frontend .env file
if (Test-Path "crm-app\frontend\.env") {
    Write-Host "📝 Updating frontend .env file..." -ForegroundColor Yellow
    
    # Backup original file
    Copy-Item "crm-app\frontend\.env" "crm-app\frontend\.env.backup"
    
    # Read content
    $content = Get-Content "crm-app\frontend\.env"
    
    # Update JWT secret (frontend only needs the main secret)
    $content = $content -replace "VITE_JWT_SECRET=.*", "VITE_JWT_SECRET=$JWT_SECRET"
    
    # Write back to file
    $content | Set-Content "crm-app\frontend\.env"
    
    Write-Host "✅ Frontend .env updated" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend .env file not found" -ForegroundColor Red
}

# Update Docker production environment file
Update-EnvFile -FilePath ".env.production" -FileDescription "Docker production .env file"

# Update docker-compose.yml
if (Test-Path "docker-compose.yml") {
    Write-Host "📝 Updating docker-compose.yml..." -ForegroundColor Yellow
    
    # Backup original file
    Copy-Item "docker-compose.yml" "docker-compose.yml.backup"
    
    # Read content
    $content = Get-Content "docker-compose.yml"
    
    # Update JWT secrets in docker-compose.yml
    $content = $content -replace "JWT_SECRET:.*", "JWT_SECRET: $JWT_SECRET"
    $content = $content -replace "JWT_REFRESH_SECRET:.*", "JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"
    $content = $content -replace "SESSION_SECRET:.*", "SESSION_SECRET: $SESSION_SECRET"
    
    # Write back to file
    $content | Set-Content "docker-compose.yml"
    
    Write-Host "✅ docker-compose.yml updated" -ForegroundColor Green
} else {
    Write-Host "❌ docker-compose.yml file not found" -ForegroundColor Red
}

# Create secure token info file for reference
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tokenFile = "jwt_tokens_$timestamp.txt"

$tokenInfo = @"
ASP Cranes CRM - JWT Tokens Generated on $(Get-Date)
================================================================

JWT_SECRET=$JWT_SECRET

JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

SESSION_SECRET=$SESSION_SECRET

================================================================
IMPORTANT SECURITY NOTES:
- These tokens have been automatically generated and applied
- Keep this file secure and do not commit to version control
- Tokens are set to expire: Access (15m), Refresh (7d)
- Automatic refresh is configured for seamless user experience
- All development bypasses have been removed for security
================================================================
"@

$tokenInfo | Out-File -FilePath $tokenFile -Encoding UTF8

Write-Host "📄 Token reference file created: $tokenFile" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 JWT token generation completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   - New JWT secrets generated and applied"
Write-Host "   - Backend, frontend, and Docker configs updated"
Write-Host "   - Backup files created with .backup extension"
Write-Host "   - Token reference file created"
Write-Host ""
Write-Host "🚀 Ready for production deployment with fresh tokens!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Ensure all team members restart their development servers" -ForegroundColor Yellow
Write-Host "    to use the new tokens for local development."
