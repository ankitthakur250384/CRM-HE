# ASP Cranes CRM - Restructured

This is a fully restructured, containerized CRM application with clean separation between frontend and backend.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Development Setup

1. **Using Docker (Recommended)**
   ```bash
   # Start all services
   docker-compose -f docker-compose.dev.yml up -d
   
   # View logs
   docker-compose -f docker-compose.dev.yml logs -f
   
   # Stop services
   docker-compose -f docker-compose.dev.yml down
   ```

2. **Local Development**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm install
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm install
   npm run dev
   ```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

## 📁 Project Structure

```
crm-app/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
├── backend/                  # Express API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── lib/            # Database & utilities
│   │   ├── middleware/     # Express middleware
│   │   └── types/          # TypeScript types
│   └── package.json
├── database/                 # Database schema & config
│   └── schema.sql
├── nginx/                    # Nginx configuration
├── docker-compose.yml        # Production setup
├── docker-compose.dev.yml    # Development setup
└── README.md
```

## 🔧 Environment Configuration

Create environment files as needed:

- **Backend**: `backend/.env`
- **Production**: `.env.production`
- **Development**: `.env.development`

## 🐳 Docker Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Rebuild containers
docker-compose build --no-cache

# Stop and remove containers
docker-compose down -v
```

## 🔍 Troubleshooting

1. **Port conflicts**: Make sure ports 3000, 3001, and 5432 are available
2. **Database connection**: Ensure PostgreSQL is running and credentials are correct
3. **CORS issues**: Check that the frontend can reach the backend API
4. **Build errors**: Clear Docker cache and rebuild: `docker system prune -a`

## 📚 API Documentation

The API is available at `http://localhost:3001` with the following endpoints:

- `/api/auth` - Authentication
- `/api/deals` - Deal management
- `/api/leads` - Lead management
- `/api/customers` - Customer management
- `/api/quotations` - Quotation management
- `/api/equipment` - Equipment management

## 🛠️ Development

### Backend Development
```bash
cd backend
npm install
npm run dev  # Starts with nodemon
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server
```

## 🚀 Production Deployment

1. Set up environment variables in `.env.production`
2. Run `docker-compose up -d` for production deployment
3. Configure nginx for SSL and domain routing

## 🔐 Security Notes

- Change default database passwords
- Set strong JWT secrets
- Configure proper CORS origins
- Use environment variables for sensitive data
- Enable SSL in production

---

**Happy coding! 🎉**
