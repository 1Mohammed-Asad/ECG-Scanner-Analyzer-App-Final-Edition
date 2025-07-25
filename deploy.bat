@echo off
REM ECG Scanner Production Deployment Script for Windows
REM This script deploys the ECG Scanner app with email functionality

echo 🚀 Starting ECG Scanner Production Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Desktop.
    pause
    exit /b 1
)

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "ssl" mkdir ssl
if not exist "backend" mkdir backend

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from template...
    copy backend\.env.example .env
    echo [WARNING] Please edit .env file with your actual configuration before proceeding!
    echo.
    echo Required environment variables:
    echo   - MAIL_USERNAME (your email)
    echo   - MAIL_PASSWORD (your email password/app password)
    echo   - SECRET_KEY (random secure key)
    echo   - DB_PASSWORD (database password)
    echo.
    pause
)

REM Build and start services
echo [INFO] Building and starting services...
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo [INFO] Checking service health...
docker-compose ps | findstr "Up" >nul
if %errorlevel% == 0 (
    echo [INFO] ✅ Services are running successfully!
    
    REM Test health endpoint
    echo [INFO] Testing backend health...
    curl -f http://localhost:5001/api/health >nul 2>&1
    if %errorlevel% == 0 (
        echo [INFO] ✅ Backend is responding
    ) else (
        echo [ERROR] ❌ Backend is not responding
        docker-compose logs backend
        pause
        exit /b 1
    )
    
    echo.
    echo [INFO] 🎉 Deployment Complete!
    echo.
    echo Access your application:
    echo   Backend API: http://localhost:5001
    echo   Health Check: http://localhost:5001/api/health
    echo.
    echo To test email functionality:
    echo   1. Open your frontend application
    echo   2. Try the 'Forgot Password' feature
    echo   3. Check your email for reset codes
    echo.
    echo To view logs:
    echo   docker-compose logs -f backend
    echo.
    echo To stop services:
    echo   docker-compose down
    echo.
    pause
    
) else (
    echo [ERROR] ❌ Services failed to start
    docker-compose logs
    pause
    exit /b 1
)
