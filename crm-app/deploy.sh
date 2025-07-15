#!/bin/bash

# Production Deployment Script
# This script deploys the CRM application to a production server

set -e

echo "🚀 Starting production deployment..."

# Configuration
REPO_URL="https://github.com/yourusername/crm-app.git"
DEPLOY_PATH="/opt/crm-app"
BACKUP_PATH="/opt/crm-app-backup"
DOMAIN="yourdomain.com"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and log back in."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

# Create backup if deployment exists
if [ -d "$DEPLOY_PATH" ]; then
    echo "📦 Creating backup..."
    sudo rm -rf $BACKUP_PATH
    sudo cp -r $DEPLOY_PATH $BACKUP_PATH
    echo "✅ Backup created at $BACKUP_PATH"
fi

# Clone or update repository
if [ -d "$DEPLOY_PATH" ]; then
    echo "🔄 Updating existing deployment..."
    cd $DEPLOY_PATH
    git pull origin main
else
    echo "📥 Cloning repository..."
    sudo git clone $REPO_URL $DEPLOY_PATH
    cd $DEPLOY_PATH
fi

# Set proper permissions
sudo chown -R $USER:$USER $DEPLOY_PATH

# Copy production environment file
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it with your production configuration."
    exit 1
fi

cp .env.production .env

# Build and deploy
echo "🏗️  Building production images..."
docker-compose -f docker-compose.yml build

echo "🔄 Stopping existing containers..."
docker-compose down

echo "🚀 Starting production deployment..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    # Rollback
    echo "🔄 Rolling back to previous version..."
    docker-compose down
    if [ -d "$BACKUP_PATH" ]; then
        sudo rm -rf $DEPLOY_PATH
        sudo mv $BACKUP_PATH $DEPLOY_PATH
        cd $DEPLOY_PATH
        docker-compose up -d
    fi
    exit 1
fi

# Setup SSL certificate with Let's Encrypt (optional)
if command -v certbot &> /dev/null; then
    echo "🔐 Setting up SSL certificate..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Setup log rotation
echo "📊 Setting up log rotation..."
sudo tee /etc/logrotate.d/crm-app > /dev/null <<EOF
/opt/crm-app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        docker-compose -f $DEPLOY_PATH/docker-compose.yml restart nginx
    endscript
}
EOF

# Setup automatic updates (cron job)
echo "🔄 Setting up automatic updates..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd $DEPLOY_PATH && git pull origin main && docker-compose pull && docker-compose up -d") | crontab -

echo "✅ Production deployment completed successfully!"
echo ""
echo "📍 Services available at:"
echo "   Frontend: https://$DOMAIN"
echo "   Backend API: https://$DOMAIN/api"
echo ""
echo "📝 To view logs: docker-compose -f $DEPLOY_PATH/docker-compose.yml logs -f"
echo "🛑 To stop: docker-compose -f $DEPLOY_PATH/docker-compose.yml down"
echo "🔄 Automatic updates are scheduled for 2 AM daily"
