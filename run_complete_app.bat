@echo off
echo ========================================
echo ECG Scanner Complete Application Setup
echo ========================================
echo.

echo Starting Backend Server (Port 5001)...
start cmd /k "cd backend && python app.py"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server (Port 3000)...
start cmd /k "python serve_frontend.py"

echo.
echo ========================================
echo Application URLs:
echo Backend API: http://192.168.1.18:5001
echo Frontend:  http://192.168.1.18:3000
echo ========================================
echo.
echo Press any key to open in browser...
pause > nul

start http://192.168.1.18:3000
start http://192.168.1.18:5001/api/health
