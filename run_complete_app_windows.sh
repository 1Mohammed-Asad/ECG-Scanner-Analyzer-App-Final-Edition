#!/bin/bash
# Windows Git Bash compatible script

echo "========================================"
echo "ECG Scanner Complete Application Setup"
echo "========================================"
echo ""

# Start backend in background
echo "Starting Backend Server (Port 5001)..."
start cmd /k "cd backend && python app.py"

# Wait for backend to start
sleep 3

# Start frontend in background
echo "Starting Frontend Server (Port 3000)..."
start cmd /k "python serve_frontend.py"

echo ""
echo "========================================"
echo "Application URLs:"
echo "Frontend:  http://192.168.1.18:3000"
echo "Backend:   http://192.168.1.18:5001"
echo "========================================"
echo ""
echo "Both servers are now running!"
echo "Press Ctrl+C in this terminal to stop the script"
echo "Close the terminal windows to stop the servers"
echo ""
