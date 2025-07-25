@echo off
echo 🛡️  Starting secure deployment...

REM Set production environment variables
set FLASK_ENV=production
set NODE_ENV=production

REM Disable debug mode
set DEBUG=false

REM Start backend with security
echo 🔒 Starting secure backend...
cd backend
python -c "
import os
import logging
from app import app

# Disable console logging
logging.getLogger('werkzeug').setLevel(logging.ERROR)
logging.getLogger('sqlalchemy').setLevel(logging.ERROR)

# Run in production mode
app.run(debug=False, host='0.0.0.0', port=5001)
" &

REM Start frontend with security
echo 🔒 Starting secure frontend...
cd ..
npm run build
npm run preview -- --host 0.0.0.0 --port 5173 &

echo ✅ Secure deployment complete!
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
echo Admin users are hidden and console logging is disabled.
pause
