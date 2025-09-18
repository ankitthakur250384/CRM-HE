# ASP Cranes CRM

Enterprise CRM system for ASP Cranes with quotation management and template system.

## 🚀 Quick Start

### Deploy with Docker:
```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
asp-cranes-structured/
├── docker-compose.yml       # Container configuration
├── crm-app/
│   ├── frontend/            # React frontend application
│   ├── backend/             # Node.js API server
│   └── database/            # Database schema and migrations
└── nginx/                   # Reverse proxy configuration
```

## 🔧 Configuration

The application runs on:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Nginx: http://localhost:80

## 📊 Features

- Customer Management
- Lead Tracking
- Quotation System
- Equipment Management
- Enhanced Template System
- Dashboard & Analytics

## ️ Management Commands

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

## 🔧 Support

- **CrewAI Dashboard**: https://app.crewai.com
- **Documentation**: https://docs.crewai.com
- **Your Workspace**: https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com

---

**Ready to deploy? Run `./setup-crewai.bat` to go live with CrewAI cloud AI agents!** 🚀
