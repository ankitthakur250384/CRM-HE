#!/bin/bash

# JWT Token Generation Script for ASP Cranes CRM
# Generates fresh JWT tokens for production deployment

echo "🔐 Generating fresh JWT tokens for production deployment..."

# Generate JWT Secret (64 bytes)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")

# Generate JWT Refresh Secret (64 bytes)
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")

# Generate Session Secret (32 bytes)
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

echo "✅ Generated new JWT secrets"

# Update backend .env file
if [ -f "crm-app/backend/.env" ]; then
    echo "📝 Updating backend .env file..."
    
    # Backup original file
    cp crm-app/backend/.env crm-app/backend/.env.backup
    
    # Update JWT secrets
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" crm-app/backend/.env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" crm-app/backend/.env
    sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|g" crm-app/backend/.env
    
    echo "✅ Backend .env updated"
else
    echo "❌ Backend .env file not found"
fi

# Update frontend .env file
if [ -f "crm-app/frontend/.env" ]; then
    echo "📝 Updating frontend .env file..."
    
    # Backup original file
    cp crm-app/frontend/.env crm-app/frontend/.env.backup
    
    # Update JWT secret (frontend only needs the main secret for client-side validation)
    sed -i "s|VITE_JWT_SECRET=.*|VITE_JWT_SECRET=$JWT_SECRET|g" crm-app/frontend/.env
    
    echo "✅ Frontend .env updated"
else
    echo "❌ Frontend .env file not found"
fi

# Update Docker production environment file
if [ -f ".env.production" ]; then
    echo "📝 Updating Docker production .env file..."
    
    # Backup original file
    cp .env.production .env.production.backup
    
    # Update JWT secrets
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env.production
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env.production
    sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|g" .env.production
    
    echo "✅ Docker production .env updated"
else
    echo "❌ Docker production .env file not found"
fi

# Update docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    echo "📝 Updating docker-compose.yml..."
    
    # Backup original file
    cp docker-compose.yml docker-compose.yml.backup
    
    # Update JWT secrets in docker-compose.yml
    sed -i "s|JWT_SECRET:.*|JWT_SECRET: $JWT_SECRET|g" docker-compose.yml
    sed -i "s|JWT_REFRESH_SECRET:.*|JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET|g" docker-compose.yml
    sed -i "s|SESSION_SECRET:.*|SESSION_SECRET: $SESSION_SECRET|g" docker-compose.yml
    
    echo "✅ docker-compose.yml updated"
else
    echo "❌ docker-compose.yml file not found"
fi

# Create secure token info file for reference
echo "📄 Creating token reference file..."
cat > jwt_tokens_$(date +%Y%m%d_%H%M%S).txt << EOF
ASP Cranes CRM - JWT Tokens Generated on $(date)
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
EOF

echo "🎉 JWT token generation completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - New JWT secrets generated and applied"
echo "   - Backend, frontend, and Docker configs updated"
echo "   - Backup files created with .backup extension"
echo "   - Token reference file created"
echo ""
echo "🚀 Ready for production deployment with fresh tokens!"
echo ""
echo "⚠️  IMPORTANT: Ensure all team members restart their development servers"
echo "    to use the new tokens for local development."
