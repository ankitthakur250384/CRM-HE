# ASP Cranes CRM - Production Deployment Guide

## Quick Deployment to https://www.avariq.in/lander

### Prerequisites
1. A server with Ubuntu/Debian Linux
2. Domain `avariq.in` pointing to your server's IP
3. SSH access to your server

### Step 1: Domain DNS Setup
Point your domain to your server:
```
A record: avariq.in → YOUR_SERVER_IP
A record: www.avariq.in → YOUR_SERVER_IP
```

### Step 2: Server Setup
SSH into your server and run:

```bash
# Download and run deployment script
wget https://raw.githubusercontent.com/VedantSinghThakur21/asp-cranes-structured/master/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

### Step 3: Configuration
The script will create `.env.prod` file. Edit it with your values:
```bash
nano .env.prod
```

### Step 4: Access Your Application
- **Main App**: https://www.avariq.in/lander
- **API**: https://www.avariq.in/api
- **Health Check**: https://www.avariq.in/health

## Manual Deployment (Alternative)

### 1. Clone Repository
```bash
sudo mkdir -p /opt/asp-cranes
cd /opt/asp-cranes
git clone https://github.com/VedantSinghThakur21/asp-cranes-structured.git .
```

### 2. Configure Environment
```bash
cp .env.prod.example .env.prod
nano .env.prod  # Edit with your values
```

### 3. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d avariq.in -d www.avariq.in
sudo mkdir -p /etc/nginx/ssl
sudo cp /etc/letsencrypt/live/avariq.in/fullchain.pem /etc/nginx/ssl/avariq.in.crt
sudo cp /etc/letsencrypt/live/avariq.in/privkey.pem /etc/nginx/ssl/avariq.in.key
```

### 4. Deploy with Docker
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring & Maintenance

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Update Application
```bash
git pull origin master
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Database
```bash
docker-compose -f docker-compose.prod.yml exec database pg_dump -U asp_user asp_cranes > backup.sql
```

### SSL Renewal (Automatic)
The deployment script sets up automatic SSL renewal via cron job.

## Troubleshooting

### Check Container Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Check Nginx Configuration
```bash
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Database Connection Issues
```bash
docker-compose -f docker-compose.prod.yml exec database psql -U asp_user -d asp_cranes
```

## Security Features
- ✅ HTTPS with SSL certificates
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration
- ✅ Security headers
- ✅ Database password protection
- ✅ JWT token authentication

## Performance Features
- ✅ Nginx reverse proxy
- ✅ Gzip compression
- ✅ Static file caching
- ✅ Database connection pooling

Your CRM will be available at: **https://www.avariq.in/lander**
