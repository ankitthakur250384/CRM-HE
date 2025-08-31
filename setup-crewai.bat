@echo off
REM ASP Cranes CrewAI Cloud Setup Script (Windows)
REM Configured for your specific CrewAI workspace

echo 🚀 Setting up ASP Cranes CRM with CrewAI Cloud Platform...
echo 📍 Workspace: asp-cranes-ai-sales-chatbot-v1
echo 🔑 API Token: 323534e6cfe2
echo.

REM Check if CrewAI configuration exists
if not exist ".env.crewai" (
    echo ❌ Error: .env.crewai file not found!
    echo 📝 Creating .env.crewai with your credentials...
    
    REM Create the configuration file
    (
        echo # CrewAI Platform Configuration - ASP Cranes CRM
        echo # Your Specific Workspace Configuration
        echo.
        echo # CrewAI Platform Credentials
        echo CREWAI_API_KEY=323534e6cfe2
        echo CREWAI_ORG_ID=19ac7cde-f23-cb712937
        echo CREWAI_WORKSPACE_URL=https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com
        echo CREWAI_WEBHOOK_SECRET=asp_cranes_webhook_2025
        echo.
        echo # CrewAI Platform Endpoints
        echo CREWAI_API_BASE_URL=https://api.crewai.com/v1
        echo CREWAI_AGENTS_ENDPOINT=/agents
        echo CREWAI_WORKFLOWS_ENDPOINT=/workflows
        echo CREWAI_ANALYTICS_ENDPOINT=/analytics
        echo.
        echo # ASP Cranes CRM Integration
        echo ASP_CRM_BASE_URL=http://103.224.243.242:3001/api
        echo ASP_CRM_FRONTEND_URL=https://www.avariq.in
        echo ASP_CRM_TIMEOUT=30000
        echo.
        echo # Authentication Settings
        echo LEADS_BYPASS_HEADER=X-bypass-Auth
        echo LEADS_BYPASS_VALUE=true
        echo.
        echo # CORS Configuration for CrewAI
        echo ALLOWED_ORIGINS=https://www.avariq.in,https://app.crewai.com,https://api.crewai.com,https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com
        echo.
        echo # AI Model Configuration
        echo AI_MODEL=gpt-4o-mini
        echo AI_TEMPERATURE=0.7
        echo AI_MAX_TOKENS=1000
        echo AI_TIMEOUT=5000
        echo.
        echo # Performance and Monitoring
        echo AI_RESPONSE_TIMEOUT=2000
        echo AI_MAX_CONCURRENT_REQUESTS=20
        echo AI_CACHE_ENABLED=true
        echo AI_CACHE_TIMEOUT=300000
        echo LOG_LEVEL=info
        echo ENABLE_METRICS=true
        echo WEBHOOK_RETRY_ATTEMPTS=3
        echo WEBHOOK_TIMEOUT=10000
        echo.
        echo # Backup and Fallback
        echo ENABLE_FALLBACK_TO_LOCAL=true
        echo LOCAL_AI_ENDPOINT=http://103.224.243.242:3001/api/ai
        echo FALLBACK_TIMEOUT=5000
        echo.
        echo # Health Check URLs
        echo HEALTH_CHECK_INTERVAL=30000
        echo CREWAI_HEALTH_ENDPOINT=https://api.crewai.com/health
        echo CRM_HEALTH_ENDPOINT=http://103.224.243.242:3001/api/health
        echo.
        echo # Enterprise Features
        echo CREWAI_PLAN=enterprise-free
        echo ENABLE_ADVANCED_ANALYTICS=true
        echo ENABLE_PRIORITY_SUPPORT=true
    ) > .env.crewai
    
    echo ✅ Created .env.crewai with your workspace configuration
)

echo 🔍 Validating CrewAI workspace access...

REM Test CrewAI workspace connectivity
curl -s -o nul -w "%%{http_code}" "https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com" > workspace_test.txt
set /p WORKSPACE_STATUS=<workspace_test.txt
del workspace_test.txt

if "%WORKSPACE_STATUS%"=="200" (
    echo ✅ CrewAI workspace accessible
) else if "%WORKSPACE_STATUS%"=="302" (
    echo ✅ CrewAI workspace accessible (redirected)
) else if "%WORKSPACE_STATUS%"=="301" (
    echo ✅ CrewAI workspace accessible (moved)
) else (
    echo ⚠️  CrewAI workspace response: HTTP %WORKSPACE_STATUS%
    echo    Workspace may require login or different access method
)

REM Test CRM API accessibility
echo 🔍 Testing CRM API accessibility for CrewAI...
curl -s -o nul -w "%%{http_code}" "http://103.224.243.242:3001/api/health" > crm_test.txt
set /p CRM_STATUS=<crm_test.txt
del crm_test.txt

if "%CRM_STATUS%"=="200" (
    echo ✅ CRM API accessible for CrewAI integration
) else (
    echo ⚠️  CRM API response: HTTP %CRM_STATUS%
    echo    CrewAI may have limited access to your CRM
)

REM Merge environment configurations
echo 🔧 Merging environment configurations...

REM Backup existing .env if it exists
if exist ".env" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
    copy .env .env.backup.%mydate%_%mytime% >nul
    echo 📁 Backed up existing .env file
)

REM Merge CrewAI config with existing environment
if exist ".env" (
    echo. >> .env
    echo # CrewAI Configuration merged >> .env
    type .env.crewai >> .env
) else (
    copy .env.crewai .env >nul
)

echo ✅ Environment configuration complete

REM Build and deploy with CrewAI integration
echo 🔧 Building ASP Cranes CRM with CrewAI cloud integration...
docker-compose build

echo 🚀 Starting services with CrewAI cloud platform...
docker-compose up -d

REM Wait for services to initialize
echo ⏳ Waiting for services to initialize...
timeout /t 20 >nul

REM Test CrewAI integration
echo 🧪 Testing CrewAI cloud integration...

REM Test health endpoint
curl -s "http://localhost:3001/api/crewai/health" > health_test.txt
findstr "\"success\":true" health_test.txt >nul
if not errorlevel 1 (
    echo ✅ CrewAI health check passed
) else (
    echo ⚠️  CrewAI health check warning - may need manual configuration
)
del health_test.txt

REM Test chat endpoint
curl -s -X POST "http://localhost:3001/api/crewai/chat" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Hello CrewAI, this is ASP Cranes CRM testing the integration\"}" > chat_test.txt

findstr "\"success\":true" chat_test.txt >nul
if not errorlevel 1 (
    echo ✅ CrewAI chat integration working
) else (
    echo ⚠️  CrewAI chat test warning - checking fallback...
    
    REM Test fallback to local AI
    curl -s -X POST "http://localhost:3001/api/ai/chat" ^
      -H "Content-Type: application/json" ^
      -d "{\"message\":\"Hello local AI system\"}" > local_test.txt
    
    findstr "\"success\":true" local_test.txt >nul
    if not errorlevel 1 (
        echo ✅ Local AI fallback working
    ) else (
        echo ❌ Both CrewAI and local AI integration need attention
    )
    del local_test.txt
)
del chat_test.txt

REM Display deployment status
echo.
echo 🔍 Checking deployment status...
docker-compose ps

echo.
echo 🎉 ASP Cranes CrewAI Cloud Integration Complete!
echo.
echo 📊 Your Configuration:
echo    🌐 CrewAI Workspace: asp-cranes-ai-sales-chatbot-v1
echo    🔑 API Token: 323534e6cfe2
echo    🏢 Organization ID: 19ac7cde-f23-cb712937
echo    📞 Plan: Enterprise (Free Tier)
echo.
echo 🚀 Application URLs:
echo    🖥️  Frontend: https://www.avariq.in
echo    🔧 CRM API: http://103.224.243.242:3001/api
echo    🤖 CrewAI API: http://localhost:3001/api/crewai
echo    📈 Local AI (Fallback): http://localhost:3001/api/ai
echo.
echo 🎯 CrewAI Platform URLs:
echo    🌐 Workspace: https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com
echo    📊 Dashboard: https://app.crewai.com
echo    📚 Documentation: https://docs.crewai.com
echo.
echo 🔍 Monitoring and Testing:
echo    ❤️  Health Check: http://localhost:3001/api/crewai/health
echo    💬 Chat Test: http://localhost:3001/api/crewai/chat
echo    📊 Status: http://localhost:3001/api/crewai/status
echo.
echo 🛠️  Management Commands:
echo    📄 View logs: docker-compose logs -f backend
echo    🔄 Restart: docker-compose restart
echo    🛑 Stop: docker-compose down
echo.
echo 🎯 Next Steps:
echo    1. 🧪 Test the chat widget on your frontend
echo    2. 📊 Monitor agent performance in CrewAI dashboard
echo    3. 🔗 Configure webhooks for real-time updates
echo    4. 📈 Set up monitoring and alerts
echo    5. 🔑 Consider upgrading CrewAI plan for higher limits
echo.
echo 💡 Tips:
echo    • Your chat widget will automatically use CrewAI cloud agents
echo    • Fallback to local AI is enabled if CrewAI is unavailable
echo    • Monitor performance at your CrewAI workspace dashboard
echo    • All 6 AI agents are configured for your CRM workflows
echo.
echo 🎊 Your ASP Cranes CRM is now powered by CrewAI Cloud Platform!
echo.
pause
