@echo off
echo ==============================================
echo ASP Cranes CRM - CrewAI Cloud Platform Setup
echo ==============================================
echo.

echo 🚀 Setting up production environment with CrewAI Cloud Platform...
echo.

:: Copy CrewAI configuration to backend
echo 📋 Copying CrewAI configuration...
copy ".env.crewai" "crm-app\backend\.env.crewai"
if %errorlevel% neq 0 (
    echo ❌ Failed to copy CrewAI configuration
    echo Please ensure .env.crewai exists in the root directory
    pause
    exit /b 1
)

:: Build and start the containers
echo 🐳 Building and starting Docker containers...
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start containers
    pause
    exit /b 1
)

echo.
echo ✅ CrewAI Cloud Platform integration deployed successfully!
echo.
echo 🌐 Application URLs:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:3001
echo   - AI Chat: http://localhost:3000 (chat widget)
echo.
echo 🤖 CrewAI Agents Available:
echo   - Master Agent: Orchestrates all AI operations
echo   - Lead Agent: Processes and qualifies leads
echo   - Deal Agent: Manages deal workflows
echo   - Quotation Agent: Generates pricing and quotes
echo   - Company Intelligence: Researches prospects
echo   - NLP Sales Assistant: Handles customer chat
echo.
echo 📊 API Endpoints:
echo   - Chat: POST http://localhost:3001/api/ai/chat
echo   - CrewAI Health: GET http://localhost:3001/api/crewai/health
echo   - System Status: GET http://localhost:3001/api/ai/status
echo.
echo 🔧 To stop the system: docker-compose down
echo 📝 To view logs: docker-compose logs -f
echo.
pause
