#!/bin/bash

echo "========================================"
echo "ECG Scanner Complete Application Setup"
echo "========================================"
echo ""

# Function to start backend
start_backend() {
    echo "Starting Backend Server (Port 5001)..."
    cd backend
    python app.py &
    BACKEND_PID=$!
    cd ..
    echo "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "Starting Frontend Server (Port 3000)..."
    python serve_frontend.py &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start both servers
start_backend
sleep 3
start_frontend

echo ""
echo "========================================"
echo "Application URLs:"
echo "Frontend:  http://192.168.1.18:3000"
echo "Backend:   http://192.168.1.18:5001"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Keep script running
wait
