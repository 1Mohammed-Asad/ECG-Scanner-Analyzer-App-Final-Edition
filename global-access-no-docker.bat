@echo off
echo 🌍 Setting up global access without Docker...
echo.

:: Step 1: Install Python packages
echo 📦 Installing Python packages...
cd backend
pip install -r requirements.txt

:: Step 2: Start local server
echo 🚀 Starting local server...
start cmd /k "cd backend && python app_production.py"

:: Step 3: Wait for server to start
timeout /t 5 /nobreak

:: Step 4: Start ngrok for global access
echo 🌐 Starting global access...
echo.
echo ✅ Local server running at http://localhost:5001
echo ✅ Network access at http://192.168.1.18:5001
echo.
echo 🎯 Starting ngrok for global access...
echo.
echo 📱 Your app will be available at a public URL
echo    Copy the https:// URL from ngrok console
echo    Share this URL with anyone worldwide
echo.
ngrok http 5001
