#!/bin/bash

# Production deployment script for ASP Cranes CRM
# Run this script on your production server

set -e

echo "🚀 Starting ASP Cranes CRM Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="avariq.in"
APP_DIR="/opt/asp-cranes"
BACKUP_DIR="/opt/backups/asp-cranes"
REPO_URL="https://github.com/VedantSinghThakur21/asp-cranes-structured.git"

# Create directories
echo -e "${YELLOW}📁 Creating application directories...${NC}"
sudo mkdir -p $APP_DIR
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p /etc/nginx/ssl

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}📥 Updating repository...${NC}"
    cd $APP_DIR
    git pull origin master
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    sudo git clone $REPO_URL $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    cd $APP_DIR
fi

# Setup environment variables
echo -e "${YELLOW}⚙️ Setting up environment variables...${NC}"
if [ ! -f .env.prod ]; then
    cp .env.prod.example .env.prod
    echo -e "${RED}⚠️ Please edit .env.prod with your actual values${NC}"
    echo -e "${YELLOW}Opening .env.prod for editing...${NC}"
    nano .env.prod
fi

# SSL Certificate Setup (using Let's Encrypt)
echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
if [ ! -f "/etc/nginx/ssl/$DOMAIN.crt" ]; then
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Get SSL certificate
    sudo certbot certonly --standalone --preferred-challenges http -d $DOMAIN -d www.$DOMAIN
    
    # Copy certificates to nginx directory
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/$DOMAIN.crt
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/$DOMAIN.key
fi

# Install Docker and Docker Compose if not present
echo -e "${YELLOW}🐳 Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Backup existing data
echo -e "${YELLOW}💾 Creating backup...${NC}"
if [ "$(docker ps -aq)" ]; then
    docker-compose -f docker-compose.prod.yml exec -T database pg_dump -U asp_user asp_cranes > $BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).sql
fi

# Stop existing containers
echo -e "${YELLOW}⏹️ Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Build and start production containers
echo -e "${YELLOW}🏗️ Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Health check
echo -e "${YELLOW}🏥 Performing health check...${NC}"
if curl -f https://www.$DOMAIN/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. Checking logs...${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Setup automatic SSL renewal
echo -e "${YELLOW}🔄 Setting up SSL auto-renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker-compose -f $APP_DIR/docker-compose.prod.yml restart nginx") | crontab -

# Setup log rotation
echo -e "${YELLOW}📋 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/asp-cranes > /dev/null <<EOF
$APP_DIR/nginx/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    postrotate
        docker-compose -f $APP_DIR/docker-compose.prod.yml restart nginx
    endscript
}
EOF

# Final status
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now available at: https://www.$DOMAIN/lander${NC}"
echo -e "${YELLOW}📊 Monitor logs with: docker-compose -f $APP_DIR/docker-compose.prod.yml logs -f${NC}"
echo -e "${YELLOW}🔄 Update with: cd $APP_DIR && git pull && docker-compose -f docker-compose.prod.yml up -d --build${NC}"

# Show running containers
echo -e "${YELLOW}📋 Current container status:${NC}"
docker-compose -f docker-compose.prod.yml ps
