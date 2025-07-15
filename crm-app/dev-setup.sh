#!/bin/bash

# Development Setup Script
# This script sets up the development environment

echo "🚀 Setting up CRM Development Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env.development ]; then
    echo "📄 Creating .env.development file..."
    cp .env.example .env.development
    echo "⚠️  Please edit .env.development with your configuration"
fi

# Build and start development environment
echo "🏗️  Building development environment..."
docker-compose -f docker-compose.dev.yml build

echo "🔄 Starting development services..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Development environment is ready!"
    echo ""
    echo "📍 Services available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   Database: localhost:5432"
    echo ""
    echo "📝 To view logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
else
    echo "❌ Failed to start development environment"
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi
