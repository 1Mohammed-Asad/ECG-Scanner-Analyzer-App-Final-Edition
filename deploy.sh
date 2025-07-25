#!/bin/bash

# ECG Scanner Production Deployment Script
# This script deploys the ECG Scanner app with email functionality

set -e

echo "🚀 Starting ECG Scanner Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs ssl backend

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp backend/.env.example .env
    print_warning "Please edit .env file with your actual configuration before proceeding!"
    echo ""
    echo "Required environment variables:"
    echo "  - MAIL_USERNAME (your email)"
    echo "  - MAIL_PASSWORD (your email password/app password)"
    echo "  - SECRET_KEY (random secure key)"
    echo "  - DB_PASSWORD (database password)"
    echo ""
    read -p "Press Enter after editing .env file, or Ctrl+C to exit..."
fi

# Build and start services
print_status "Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service health..."
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Services are running successfully!"
    
    # Test email functionality
    print_status "Testing email configuration..."
    BACKEND_URL="http://localhost:5001"
    
    # Test health endpoint
    if curl -f "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        print_status "✅ Backend is responding"
    else
        print_error "❌ Backend is not responding"
        docker-compose logs backend
        exit 1
    fi
    
    # Display access information
    echo ""
    print_status "🎉 Deployment Complete!"
    echo ""
    echo "Access your application:"
    echo "  Backend API: http://localhost:5001"
    echo "  Health Check: http://localhost:5001/api/health"
    echo ""
    echo "To test email functionality:"
    echo "  1. Open your frontend application"
    echo "  2. Try the 'Forgot Password' feature"
    echo "  3. Check your email for reset codes"
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f backend"
    echo ""
    echo "To stop services:"
    echo "  docker-compose down"
    
else
    print_error "❌ Services failed to start"
    docker-compose logs
    exit 1
fi
