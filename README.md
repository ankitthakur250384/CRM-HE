# ASP Cranes CRM - CrewAI Cloud Edition

Enterprise CRM system powered by CrewAI's cloud AI platform with 6 specialized agents for sales automation.

## 🚀 Quick Start

### Deploy with CrewAI Cloud Platform:
```bash
# Windows
./setup-crewai.bat

# Linux/Mac
./setup-crewai.sh
```

## 📁 Project Structure

```
asp-cranes-structured/
├── .env.crewai              # CrewAI cloud configuration
├── setup-crewai.bat         # Windows deployment script  
├── setup-crewai.sh          # Linux/Mac deployment script
├── docker-compose.yml       # Main container configuration
├── DEPLOYMENT.md            # Deployment documentation
├── DEPLOYMENT_READY.md      # Quick deployment guide
├── crm-app/
│   ├── frontend/            # React frontend application
│   ├── backend/             # Node.js API server with AI integration
│   └── database/            # Database schema and migrations
└── nginx/                   # Reverse proxy configuration
```

## 🤖 AI Agents (CrewAI Cloud)

1. **Master Coordinator** - Central orchestration
2. **Lead Qualification Agent** - Smart lead scoring  
3. **Deal Management Agent** - Pipeline optimization
4. **Quotation Specialist** - Automated pricing
5. **Company Intelligence Agent** - Business research
6. **NLP Sales Assistant** - Customer conversations

## 🔑 Configuration

Your CrewAI credentials are configured in `.env.crewai`:
- **API Token**: `323534e6cfe2`
- **Organization**: `19ac7cde-f23-cb712937`
- **Workspace**: `asp-cranes-ai-sales-chatbot-v1`

## 🌐 Access URLs (After Deployment)

- **Frontend**: https://www.avariq.in
- **CrewAI API**: http://localhost:3001/api/crewai
- **Health Check**: http://localhost:3001/api/crewai/health
- **Status Dashboard**: http://localhost:3001/api/crewai/status

## 🛠️ Management Commands

```bash
# View logs
docker-compose logs -f backend

# Restart services  
docker-compose restart

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## 📊 Features

✅ **Enterprise AI Chat** - Real-time customer support  
✅ **Lead Automation** - Intelligent lead scoring and routing  
✅ **Quote Generation** - Automated pricing and proposals  
✅ **Deal Pipeline** - AI-powered sales optimization  
✅ **Company Research** - Automated business intelligence  
✅ **Performance Analytics** - Real-time agent monitoring  

## 🔧 Support

- **CrewAI Dashboard**: https://app.crewai.com
- **Documentation**: https://docs.crewai.com
- **Your Workspace**: https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com

---

**Ready to deploy? Run `./setup-crewai.bat` to go live with CrewAI cloud AI agents!** 🚀
