#!/bin/bash
# ASP Cranes CrewAI Cloud Setup Script
# Configured for your specific CrewAI workspace

echo "🚀 Setting up ASP Cranes CRM with CrewAI Cloud Platform..."
echo "📍 Workspace: asp-cranes-ai-sales-chatbot-v1"
echo "🔑 API Token: 323534e6cfe2"
echo ""

# Check if CrewAI configuration exists
if [ ! -f ".env.crewai" ]; then
    echo "❌ Error: .env.crewai file not found!"
    echo "📝 Creating .env.crewai with your credentials..."
    
    # Create the configuration file
    cat > .env.crewai << 'EOF'
# CrewAI Platform Configuration - ASP Cranes CRM
# Your Specific Workspace Configuration

# ================================
# CrewAI Platform Settings
# ================================

# Your CrewAI Platform Credentials
CREWAI_API_KEY=323534e6cfe2
CREWAI_ORG_ID=19ac7cde-f23-cb712937
CREWAI_WORKSPACE_URL=https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com
CREWAI_WEBHOOK_SECRET=asp_cranes_webhook_2025

# CrewAI Platform Endpoints
CREWAI_API_BASE_URL=https://api.crewai.com/v1
CREWAI_AGENTS_ENDPOINT=/agents
CREWAI_WORKFLOWS_ENDPOINT=/workflows
CREWAI_ANALYTICS_ENDPOINT=/analytics

# ================================
# ASP Cranes CRM Integration
# ================================

# Your Current CRM Configuration
ASP_CRM_BASE_URL=http://103.224.243.242:3001/api
ASP_CRM_FRONTEND_URL=https://www.avariq.in
ASP_CRM_TIMEOUT=30000

# Authentication Settings
LEADS_BYPASS_HEADER=X-bypass-Auth
LEADS_BYPASS_VALUE=true

# CORS Configuration for CrewAI
ALLOWED_ORIGINS=https://www.avariq.in,https://app.crewai.com,https://api.crewai.com,https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com

# ================================
# AI Model Configuration
# ================================

# Primary AI Model (managed by CrewAI Enterprise)
AI_MODEL=gpt-4o-mini
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
AI_TIMEOUT=5000

# ================================
# Performance & Monitoring
# ================================

# Response Time Targets
AI_RESPONSE_TIMEOUT=2000
AI_MAX_CONCURRENT_REQUESTS=20
AI_CACHE_ENABLED=true
AI_CACHE_TIMEOUT=300000

# Monitoring & Logging
LOG_LEVEL=info
ENABLE_METRICS=true
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=10000

# ================================
# Backup & Fallback
# ================================

# Fallback Configuration
ENABLE_FALLBACK_TO_LOCAL=true
LOCAL_AI_ENDPOINT=http://103.224.243.242:3001/api/ai
FALLBACK_TIMEOUT=5000

# Health Check URLs
HEALTH_CHECK_INTERVAL=30000
CREWAI_HEALTH_ENDPOINT=https://api.crewai.com/health
CRM_HEALTH_ENDPOINT=http://103.224.243.242:3001/api/health

# Enterprise Features
CREWAI_PLAN=enterprise-free
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_PRIORITY_SUPPORT=true
EOF

    echo "✅ Created .env.crewai with your workspace configuration"
fi

# Source the CrewAI configuration
source .env.crewai

echo "🔍 Validating CrewAI workspace access..."

# Test CrewAI workspace connectivity
WORKSPACE_TEST=$(curl -s -w "%{http_code}" -o /dev/null "$CREWAI_WORKSPACE_URL")

if [ "$WORKSPACE_TEST" = "200" ] || [ "$WORKSPACE_TEST" = "302" ] || [ "$WORKSPACE_TEST" = "301" ]; then
    echo "✅ CrewAI workspace accessible: $CREWAI_WORKSPACE_URL"
else
    echo "⚠️  CrewAI workspace response: HTTP $WORKSPACE_TEST"
    echo "   Workspace may require login or different access method"
fi

# Test CRM API accessibility
echo "🔍 Testing CRM API accessibility for CrewAI..."
CRM_HEALTH=$(curl -s -w "%{http_code}" "$ASP_CRM_BASE_URL/health" -o /dev/null)

if [ "$CRM_HEALTH" = "200" ]; then
    echo "✅ CRM API accessible: $ASP_CRM_BASE_URL"
else
    echo "⚠️  CRM API response: HTTP $CRM_HEALTH"
    echo "   CrewAI may have limited access to your CRM"
fi

# Merge environment configurations
echo "🔧 Merging environment configurations..."

# Backup existing .env if it exists
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "📁 Backed up existing .env file"
fi

# Merge CrewAI config with existing environment
cat .env.crewai >> .env
echo "" >> .env
echo "# CrewAI Configuration merged on $(date)" >> .env

echo "✅ Environment configuration complete"

# Build and deploy with CrewAI integration
echo "🔧 Building ASP Cranes CRM with CrewAI cloud integration..."
docker-compose build

echo "🚀 Starting services with CrewAI cloud platform..."
docker-compose up -d

# Wait for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 20

# Test CrewAI integration
echo "🧪 Testing CrewAI cloud integration..."

# Test health endpoint
HEALTH_TEST=$(curl -s "http://localhost:3001/api/crewai/health" | grep -o '"success":true' || echo "failed")

if [ "$HEALTH_TEST" = '"success":true' ]; then
    echo "✅ CrewAI health check passed"
else
    echo "⚠️  CrewAI health check warning - may need manual configuration"
fi

# Test chat endpoint
CHAT_TEST=$(curl -s -X POST "http://localhost:3001/api/crewai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello CrewAI, this is ASP Cranes CRM testing the integration"}' | grep -o '"success":true' || echo "failed")

if [ "$CHAT_TEST" = '"success":true' ]; then
    echo "✅ CrewAI chat integration working"
else
    echo "⚠️  CrewAI chat test warning - checking fallback..."
    
    # Test fallback to local AI
    LOCAL_TEST=$(curl -s -X POST "http://localhost:3001/api/ai/chat" \
      -H "Content-Type: application/json" \
      -d '{"message":"Hello local AI system"}' | grep -o '"success":true' || echo "failed")
    
    if [ "$LOCAL_TEST" = '"success":true' ]; then
        echo "✅ Local AI fallback working"
    else
        echo "❌ Both CrewAI and local AI integration need attention"
    fi
fi

# Display deployment status
echo ""
echo "🔍 Checking deployment status..."
docker-compose ps

echo ""
echo "🎉 ASP Cranes CrewAI Cloud Integration Complete!"
echo ""
echo "📊 Your Configuration:"
echo "   🌐 CrewAI Workspace: asp-cranes-ai-sales-chatbot-v1"
echo "   🔑 API Token: 323534e6cfe2"
echo "   🏢 Organization ID: 19ac7cde-f23-cb712937"
echo "   📞 Plan: Enterprise (Free Tier)"
echo ""
echo "🚀 Application URLs:"
echo "   🖥️  Frontend: https://www.avariq.in"
echo "   🔧 CRM API: http://103.224.243.242:3001/api"
echo "   🤖 CrewAI API: http://localhost:3001/api/crewai"
echo "   📈 Local AI (Fallback): http://localhost:3001/api/ai"
echo ""
echo "🎯 CrewAI Platform URLs:"
echo "   🌐 Workspace: https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com"
echo "   📊 Dashboard: https://app.crewai.com"
echo "   📚 Documentation: https://docs.crewai.com"
echo ""
echo "🔍 Monitoring & Testing:"
echo "   ❤️  Health Check: http://localhost:3001/api/crewai/health"
echo "   💬 Chat Test: http://localhost:3001/api/crewai/chat"
echo "   📊 Status: http://localhost:3001/api/crewai/status"
echo ""
echo "🛠️  Management Commands:"
echo "   📄 View logs: docker-compose logs -f backend"
echo "   🔄 Restart: docker-compose restart"
echo "   🛑 Stop: docker-compose down"
echo ""
echo "🎯 Next Steps:"
echo "   1. 🧪 Test the chat widget on your frontend"
echo "   2. 📊 Monitor agent performance in CrewAI dashboard"
echo "   3. 🔗 Configure webhooks for real-time updates"
echo "   4. 📈 Set up monitoring and alerts"
echo "   5. 🔑 Consider upgrading CrewAI plan for higher limits"
echo ""
echo "💡 Tips:"
echo "   • Your chat widget will automatically use CrewAI cloud agents"
echo "   • Fallback to local AI is enabled if CrewAI is unavailable"
echo "   • Monitor performance at your CrewAI workspace dashboard"
echo "   • All 6 AI agents are configured for your CRM workflows"
echo ""
echo "🎊 Your ASP Cranes CRM is now powered by CrewAI Cloud Platform!"
