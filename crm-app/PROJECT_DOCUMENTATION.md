# CRM Application - Complete Setup Guide

## 🚀 Project Overview

This is a modern, containerized CRM (Customer Relationship Management) application built with:

- **Frontend**: React.js with TypeScript, Vite, and Tailwind CSS
- **Backend**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with complete schema
- **Containerization**: Docker and Docker Compose
- **CI/CD**: GitHub Actions for automated deployment
- **Production Ready**: Nginx reverse proxy, SSL support, monitoring

## 📁 Project Structure

```
crm-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   ├── Dockerfile
│   └── Dockerfile.dev
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── controllers/    # Business logic controllers
│   │   ├── models/         # Database models
│   │   ├── services/       # Business services
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   ├── package.json
│   ├── Dockerfile
│   └── Dockerfile.dev
├── database/                 # Database configuration
│   ├── schema.sql          # Database schema
│   └── README.md
├── nginx/                    # Nginx configuration
│   └── nginx.conf
├── .github/workflows/        # GitHub Actions CI/CD
│   └── ci-cd.yml
├── docker-compose.yml        # Production deployment
├── docker-compose.dev.yml    # Development environment
├── .env.example             # Environment variables template
├── .env.development         # Development environment
├── .env.production          # Production environment
├── dev-setup.sh            # Development setup script (Linux/Mac)
├── dev-setup.ps1           # Development setup script (Windows)
├── deploy.sh               # Production deployment script
├── health-check.sh         # Health monitoring script
└── README.md
```

## 🛠️ Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crm-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

3. **Start development environment**
   
   **Linux/Mac:**
   ```bash
   chmod +x dev-setup.sh
   ./dev-setup.sh
   ```
   
   **Windows:**
   ```powershell
   .\dev-setup.ps1
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Manual Development Setup

1. **Start with Docker Compose**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Or run services individually**
   
   **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## 🚀 Production Deployment

### Automated Deployment (Recommended)

1. **Set up GitHub repository secrets**
   - `DOCKER_USERNAME` - Docker Hub username
   - `DOCKER_PASSWORD` - Docker Hub password
   - `PRODUCTION_HOST` - Production server IP/domain
   - `PRODUCTION_USER` - SSH username
   - `PRODUCTION_SSH_KEY` - SSH private key
   - `PRODUCTION_PORT` - SSH port (default: 22)

2. **Push to main branch**
   ```bash
   git push origin main
   ```
   
   GitHub Actions will automatically:
   - Run tests
   - Build Docker images
   - Deploy to production server

### Manual Deployment

1. **Prepare production server**
   ```bash
   # Copy deployment script to server
   scp deploy.sh user@your-server:/tmp/
   
   # Run deployment script
   ssh user@your-server
   chmod +x /tmp/deploy.sh
   /tmp/deploy.sh
   ```

2. **Configure environment**
   ```bash
   # Edit production environment variables
   nano .env.production
   ```

3. **Deploy application**
   ```bash
   docker-compose up -d
   ```

## 📊 Monitoring and Maintenance

### Health Checks

Run health checks manually:
```bash
chmod +x health-check.sh
./health-check.sh
```

Set up automated health checks (cron job):
```bash
# Add to crontab
crontab -e

# Add this line for checks every 5 minutes
*/5 * * * * /opt/crm-app/health-check.sh
```

### Log Management

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

**Log rotation is automatically configured** in the deployment script.

### Database Backup

**Create backup:**
```bash
docker-compose exec postgres pg_dump -U postgres asp_crm > backup.sql
```

**Restore backup:**
```bash
docker-compose exec -T postgres psql -U postgres asp_crm < backup.sql
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `3001` |
| `DB_HOST` | Database host | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `vedant21` |
| `DB_NAME` | Database name | `asp_crm` |
| `JWT_SECRET` | JWT secret key | Required |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

### Database Schema

The database schema is automatically initialized when the PostgreSQL container starts. The schema includes:

- Users and authentication
- Customers and contacts
- Deals and opportunities
- Activities and tasks
- Equipment and inventory
- Quotations and proposals

## 🔒 Security

### Production Security Checklist

- [ ] Change default database passwords
- [ ] Set strong JWT secret
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up backup encryption
- [ ] Monitor security logs

### Environment Security

- Never commit `.env` files to version control
- Use different secrets for different environments
- Rotate secrets regularly
- Use environment-specific configurations

## 🧪 Testing

### Running Tests

**Backend tests:**
```bash
cd backend
npm test
```

**Frontend tests:**
```bash
cd frontend
npm test
```

**Integration tests:**
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Test Coverage

Generate test coverage reports:
```bash
npm run test:coverage
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   - Check if ports 3000, 3001, 5432 are already in use
   - Change ports in docker-compose files if needed

2. **Database connection issues**
   - Verify database credentials in environment variables
   - Check if PostgreSQL container is running
   - Verify network connectivity between containers

3. **Build failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild containers: `docker-compose build --no-cache`

4. **Permission issues**
   - Ensure proper file permissions on Unix systems
   - Check Docker daemon permissions

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=debug
docker-compose up -d
```

### Performance Optimization

1. **Database optimization**
   - Add database indexes
   - Optimize queries
   - Configure connection pooling

2. **Frontend optimization**
   - Enable code splitting
   - Optimize bundle size
   - Configure caching

3. **Container optimization**
   - Use multi-stage builds
   - Optimize image sizes
   - Configure resource limits

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Happy coding! 🚀**
