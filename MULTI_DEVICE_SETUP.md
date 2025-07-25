# 📱 Multi-Device Setup Guide - ECG Scanner

## Problem Solved: Data Not Syncing Across Devices

The issue you're experiencing is because the app was using a local SQLite database. Now we've fixed this with a shared PostgreSQL database that all devices can access.

## 🚀 Quick Setup for Multi-Device Access

### Option 1: Docker Setup (Recommended)

#### Step 1: Start the Multi-Device Server
```bash
# Use the new multi-device configuration
docker-compose -f docker-compose-multi-device.yml up -d

# Or rename it to use as default
cp docker-compose-multi-device.yml docker-compose.yml
docker-compose up -d
```

#### Step 2: Find Your Server IP
```bash
# On Windows
ipconfig

# On Mac/Linux
ifconfig | grep inet
```

#### Step 3: Access from Any Device
- **Your Computer**: http://localhost:5001
- **Other devices on same network**: http://YOUR-IP:5001
- **Example**: http://192.168.1.100:5001

### Option 2: Manual Setup

#### Step 1: Install PostgreSQL
```bash
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt install postgresql postgresql-contrib
```

#### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ecgscanner;
CREATE USER ecguser WITH PASSWORD 'securepassword123';
GRANT ALL PRIVILEGES ON DATABASE ecgscanner TO ecguser;
```

#### Step 3: Update Environment
```bash
# Update .env file
DATABASE_URL=postgresql://ecguser:securepassword123@localhost:5432/ecgscanner
```

## 🔗 Network Configuration

### Find Your Computer's IP Address
```bash
# Windows Command Prompt
ipconfig

# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100

# Mac/Linux Terminal
ifconfig | grep inet
# Look for 192.168.x.x or 10.x.x.x
```

### Access URLs
- **Local Computer**: http://localhost:5001
- **Same Network Devices**: http://[YOUR-IP]:5001
- **Mobile Phone**: http://[YOUR-IP]:5001 (connected to same WiFi)

## 📱 Testing Multi-Device Access

### Test 1: Same Network Access
1. Start the server on your main computer
2. Open browser on another device
3. Go to: http://[YOUR-COMPUTER-IP]:5001/api/health
4. Should see: `{"status":"healthy"}`

### Test 2: Create Account on Device A
1. Register on Device A
2. Login on Device B with same credentials
3. Data should be accessible on both devices

### Test 3: Create Scan on Device A
1. Create a scan on Device A
2. Check if it appears on Device B
3. Should be immediately available

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Cannot Connect from Other Devices
**Solution**: Check firewall settings
```bash
# Windows
netsh advfirewall firewall add rule name="ECG Scanner" dir=in action=allow protocol=TCP localport=5001

# Mac
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/your/app
```

#### Issue 2: CORS Errors
**Solution**: The app now accepts connections from any device on your network

#### Issue 3: Database Connection Issues
**Solution**: Ensure PostgreSQL is running and accessible
```bash
# Check if PostgreSQL is running
docker ps

# Check database connection
docker-compose logs postgres
```

## 🌐 Production Deployment for Internet Access

### Using Cloud Services
1. **Railway.app**: Free PostgreSQL + deployment
2. **Render.com**: Free tier available
3. **Heroku**: Easy deployment with PostgreSQL

### Example Railway Setup
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway add --postgresql
railway deploy

# Get public URL
railway domain
```

## 📋 Complete Setup Commands

### Windows
```cmd
# 1. Start multi-device server
docker-compose -f docker-compose-multi-device.yml up -d

# 2. Find your IP
ipconfig

# 3. Access from other devices
# Use: http://[YOUR-IP]:5001
```

### Mac/Linux
```bash
# 1. Start multi-device server
docker-compose -f docker-compose-multi-device.yml up -d

# 2. Find your IP
ifconfig | grep inet

# 3. Access from other devices
# Use: http://[YOUR-IP]:5001
```

## ✅ Verification Steps

1. **Check server is running**: http://localhost:5001/api/health
2. **Check network access**: http://[YOUR-IP]:5001/api/health
3. **Test from phone**: Connect to same WiFi, open browser to http://[YOUR-IP]:5001
4. **Test data sync**: Create account on one device, login on another

## 🎯 Success Indicators
- ✅ All devices can access the same URL
- ✅ User accounts work across all devices
- ✅ Scans created on one device appear on others
- ✅ Data persists across device restarts

Your ECG Scanner app now supports **true multi-device synchronization** with a shared database!
