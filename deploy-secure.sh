#!/bin/bash

# Secure deployment script for ECG Scanner App on Linux

echo "🛡️  Starting secure Linux deployment..."

# Set production environment variables
export FLASK_ENV=production
export NODE_ENV=production
export DEBUG=false

# Generate secure keys if not provided
if [ -z "$SECRET_KEY" ]; then
    export SECRET_KEY=$(openssl rand -hex 32)
    echo "🔑 Generated SECRET_KEY"
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    export JWT_SECRET_KEY=$(openssl rand -hex 32)
    echo "🔑 Generated JWT_SECRET_KEY"
fi

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
pip install -r requirements.txt
cd ..
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Start backend in background
echo "🔒 Starting secure backend..."
nohup python -c "
import os
import logging
from app import app

# Configure logging for production
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/backend.log'),
        logging.StreamHandler()
    ]
)

# Disable werkzeug logging
logging.getLogger('werkzeug').setLevel(logging.ERROR)

# Run app
app.run(debug=False, host='0.0.0.0', port=5001)
" > logs/backend.log 2>&1 &

BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start frontend in background
echo "🔒 Starting secure frontend..."
nohup npm run preview -- --host 0.0.0.0 --port 5173 > logs/frontend.log 2>&1 &

FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Save PIDs for later management
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo "✅ Secure deployment complete!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:5173"
echo "Logs: ./logs/"
echo "To stop: kill $(cat logs/backend.pid) && kill $(cat logs/frontend.pid)"
