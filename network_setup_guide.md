# Network Setup Guide for ECG Scanner Backend

## Current Status
✅ Your computer IP: 192.168.1.18  
✅ Backend configured for port 5001  
✅ All dependencies installed  

## Steps to Make http://192.168.1.18:5001 Work

### 1. Start the Backend Server
Double-click `start_server.bat` or run:
```
cd backend
python app.py
```

### 2. Configure Windows Firewall (Run as Administrator)
Open Command Prompt as Administrator and run:
```
netsh advfirewall firewall add rule name="ECG Scanner API" dir=in action=allow protocol=TCP localport=5001
```

### 3. Test the Connection
- **Local test**: http://localhost:5001/api/health
- **Network test**: http://192.168.1.18:5001/api/health

### 4. Expected Response
You should see:
```json
{"status":"healthy","timestamp":"2024-XX-XXTXX:XX:XX.XXXXXX"}
```

### 5. Troubleshooting
- If connection refused: Check if server is running
- If timeout: Check Windows Firewall
- If 192.168.1.18 unreachable: Ensure devices are on same Wi-Fi network

## Quick Start Commands
1. **Start server**: `start_server.bat`
2. **Test API**: Open browser to http://192.168.1.18:5001/api/health
3. **View all endpoints**: http://192.168.1.18:5001/api/health
