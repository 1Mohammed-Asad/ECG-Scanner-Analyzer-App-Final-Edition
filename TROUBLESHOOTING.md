# 🔧 Network Access Troubleshooting Guide

## Common Issues Preventing Multi-Device Access

### Issue 1: Firewall Blocking
**Problem**: Windows Firewall is blocking port 5001
**Solution**:
```cmd
# Windows - Run as Administrator
netsh advfirewall firewall add rule name="ECG Scanner" dir=in action=allow protocol=TCP localport=5001
```

### Issue 2: Wrong IP Address
**Problem**: Using wrong IP address
**Solution**:
```cmd
# Find correct IP
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

### Issue 3: Docker Not Binding to All Interfaces
**Problem**: Docker only binding to localhost
**Solution**: Use 0.0.0.0 binding

### Issue 4: Network Type
**Problem**: Public vs Private network settings
**Solution**: Change network to Private in Windows settings

## 🔍 Quick Diagnostic Steps

### Step 1: Check Server Binding
```bash
# Check if server is listening on all interfaces
netstat -an | findstr :5001
# Should show: 0.0.0.0:5001
```

### Step 2: Test from Same Device
```bash
# Test localhost
curl http://localhost:5001/api/health

# Test your IP
curl http://[YOUR-IP]:5001/api/health
```

### Step 3: Test from Another Device
```bash
# From phone or another computer
curl http://[YOUR-IP]:5001/api/health
```

## 🚀 Immediate Fix Commands

### Windows Firewall Fix
```cmd
# Run these commands as Administrator
netsh advfirewall firewall add rule name="ECG Scanner HTTP" dir=in action=allow protocol=TCP localport=5001
netsh advfirewall firewall add rule name="ECG Scanner HTTPS" dir=in action=allow protocol=TCP localport=443
```

### Alternative: Use ngrok (Easiest Solution)
```bash
# Download ngrok.exe (already in your folder)
ngrok http 5001
# This gives you a public URL like: https://abc123.ngrok.io
```

### Network Discovery Fix
```cmd
# Enable network discovery
netsh advfirewall firewall set rule group="Network Discovery" new enable=Yes
```

## 📱 Phone Access Issues

### Common Phone Problems:
1. **Different WiFi network** - Ensure phone is on same WiFi
2. **Mobile data interference** - Turn off mobile data
3. **Browser cache** - Clear browser cache or use incognito mode

### Phone Testing Steps:
1. **Check WiFi**: Phone must be on same WiFi as computer
2. **Test IP**: Open browser and go to `http://[YOUR-COMPUTER-IP]:5001`
3. **Test with curl**: If you have termux or similar app

## 🔧 Complete Network Setup

### Updated Docker Configuration
```yaml
# Use this configuration for maximum compatibility
ports:
  - "0.0.0.0:5001:5001"  # Binds to all interfaces
```

### Windows Network Settings
1. **Network Type**: Set to "Private" not "Public"
2. **Firewall**: Allow Docker and Python through firewall
3. **Antivirus**: Check if antivirus is blocking connections

## 🎯 Quick Test Commands

### Test 1: Check Server Reachability
```bash
# From your computer
telnet [YOUR-IP] 5001
# Should connect successfully
```

### Test 2: Test from Phone
1. **Find your IP**: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. **Test URL**: `http://[YOUR-IP]:5001/api/health`
3. **Expected**: `{"status":"healthy"}`

## 🚀 One-Command Fix

### Use ngrok for Instant Public Access
```bash
# This is the easiest solution
ngrok http 5001
# Copy the https:// URL provided
```

### Manual Network Fix
```cmd
# Windows - Run as Administrator
netsh advfirewall firewall add rule name="ECG Scanner" dir=in action=allow protocol=TCP localport=5001
netsh advfirewall firewall add rule name="ECG Scanner Out" dir=out action=allow protocol=TCP localport=5001
```

## 📋 Complete Troubleshooting Checklist

- [ ] Computer and phone on same WiFi
- [ ] Windows Firewall allows port 5001
- [ ] Docker binding to 0.0.0.0:5001
- [ ] Using correct IP address
- [ ] Network set to "Private" in Windows
- [ ] No antivirus blocking connections
- [ ] Test with ngrok if all else fails

## 🎯 Success Indicators
- ✅ Can access from computer: http://localhost:5001
- ✅ Can access from computer: http://[YOUR-IP]:5001
- ✅ Can access from phone: http://[YOUR-IP]:5001
- ✅ All devices show: `{"status":"healthy"}` at /api/health
