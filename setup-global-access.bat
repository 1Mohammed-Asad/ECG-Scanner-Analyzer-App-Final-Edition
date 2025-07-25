@echo off
echo 🌍 Setting up GLOBAL access for your ECG Scanner...
echo.

:: Check if ngrok exists
if exist "ngrok.exe" (
    echo ✅ ngrok found - ready for global access
) else (
    echo 📥 Downloading ngrok...
    powershell -Command "Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip'"
    powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force"
    del ngrok.zip
)

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python from python.org
    pause
    exit /b
)

:: Install Python packages
echo 📦 Installing Python packages...
cd backend
pip install -r requirements.txt

:: Start the server
echo 🚀 Starting server...
start cmd /k "cd backend && python app_production.py"

:: Wait for server
timeout /t 3 /nobreak

:: Start ngrok for global access
echo 🌐 Starting global access...
echo.
echo =========================================
echo 🎯 YOUR APP IS NOW GLOBALLY ACCESSIBLE!
echo =========================================
echo.
echo ✅ Local server: http://localhost:5001
echo ✅ Network access: http://192.168.1.18:5001
echo.
echo 🌍 GLOBAL ACCESS:
echo    ngrok is starting...
echo    Copy the https:// URL from ngrok console
echo    Share this URL with anyone worldwide
echo.
echo 📱 Example: https://abc123.ngrok.io
echo    This URL works from any country!
echo.
echo 🔄 To get a new URL, restart this script
echo =========================================
ngrok http 5001
