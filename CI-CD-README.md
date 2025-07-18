# CI/CD Pipeline Documentation

## Overview
This repository includes a bulletproof CI/CD pipeline that handles all common issues and provides comprehensive testing, building, and deployment automation.

## Pipeline Features

### ✅ Issues Fixed
- **Vite Permission Denied**: Uses `npx vite build` instead of direct binary execution
- **Missing Scripts**: Handles missing test/build scripts gracefully
- **Docker Build Issues**: Uses Docker Buildx for reliable builds
- **Health Check Failures**: Implements proper health checks with timeouts
- **Dependency Caching**: Uses npm cache for faster builds
- **Security Scanning**: Includes Trivy vulnerability scanning

### 🏗️ Pipeline Stages

1. **Backend Testing**
   - Installs dependencies with `npm ci`
   - Runs tests with PostgreSQL service
   - Builds backend if build script exists
   - Uses dependency caching for speed

2. **Frontend Testing**
   - Installs dependencies with `npm ci`
   - Runs tests (placeholder for now)
   - Builds frontend using `npx vite build` (bypasses permission issues)
   - Uses dependency caching for speed

3. **Docker Build & Test**
   - Builds both backend and frontend Docker images
   - Starts services with Docker Compose
   - Performs health checks with proper timeouts
   - Shows logs for debugging
   - Cleans up resources

4. **Security Scanning**
   - Runs Trivy vulnerability scanner
   - Uploads results to GitHub Security tab
   - Scans for dependencies and filesystem vulnerabilities

5. **Deployment**
   - Runs only on master/main branch
   - Requires all previous stages to pass
   - Uses production environment protection

## Local Testing

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Running Tests Locally
```bash
# Backend tests
cd crm-app/backend
npm install
npm test

# Frontend tests
cd crm-app/frontend
npm install
npm test

# Build frontend (using npx to avoid permission issues)
npx vite build
```

### Docker Testing
```bash
# Build and start all services
docker-compose up --build

# Health check
curl http://localhost:3001/api/health
curl http://localhost:3000

# Cleanup
docker-compose down
```

## Environment Variables

### Required for Production
- `NODE_ENV=production`
- `PORT=3001` (backend)
- `VITE_API_URL=http://backend:3001/api` (frontend)

### Optional
- Database connection strings
- JWT secrets
- API keys

## Troubleshooting

### Common Issues

1. **"vite: Permission denied"**
   - Solution: Use `npx vite build` instead of `npm run build`
   - Fixed in pipeline by using npx directly

2. **"Missing script: build"**
   - Solution: Pipeline checks if script exists before running
   - Gracefully handles missing scripts

3. **Docker build fails**
   - Solution: Uses Docker Buildx for better compatibility
   - Includes proper error handling and logging

4. **Health checks timeout**
   - Solution: Implements proper wait strategies
   - Uses curl with timeouts and retries

### Debugging Pipeline Failures

1. Check the "Actions" tab in GitHub
2. Look for specific job failures
3. Check container logs in the pipeline output
4. Verify Dockerfile syntax and dependencies

## Best Practices

1. **Always use `npm ci`** instead of `npm install` in CI/CD
2. **Cache dependencies** to speed up builds
3. **Use health checks** for service readiness
4. **Implement proper timeouts** for external services
5. **Clean up resources** after tests
6. **Scan for vulnerabilities** regularly

## Pipeline Configuration

The pipeline is configured in `.github/workflows/ci-cd.yml` and includes:

- Parallel job execution for faster builds
- Comprehensive error handling
- Proper resource cleanup
- Security scanning
- Environment-specific deployments

## Contributing

When contributing:
1. Ensure all tests pass locally
2. Update documentation if needed
3. Follow the existing code style
4. Add tests for new features

## Support

If you encounter issues with the CI/CD pipeline:
1. Check this documentation first
2. Look at recent pipeline runs for similar issues
3. Check Docker and npm logs
4. Contact the development team
