@echo off
echo 🌐 Setting up global access for your ECG Scanner...
echo.

:: Option 1: Using ngrok (Immediate public URL)
echo 📡 Option 1: Using ngrok for instant public access...
start ngrok http 5001

:: Option 2: Railway deployment (Free cloud hosting)
echo 🚂 Option 2: Deploying to Railway (Free cloud hosting)...
echo Installing Railway CLI...
npm install -g @railway/cli

echo Logging into Railway...
railway login

echo Creating new Railway project...
railway init --name ecg-scanner

echo Adding PostgreSQL database...
railway add --postgresql

echo Deploying to cloud...
railway deploy

echo 🎯 Your app will be available at a public URL like:
echo    https://ecg-scanner-production.up.railway.app
echo.

:: Option 3: Render deployment
echo 🎨 Option 3: Deploying to Render (Alternative free hosting)...
echo Create account at render.com and deploy from GitHub

echo.
echo ✅ Choose your deployment method:
echo    1. Run ngrok.exe (already in your folder) for instant access
echo    2. Use Railway for permanent cloud hosting
echo    3. Use Render for alternative cloud hosting
echo.
pause
