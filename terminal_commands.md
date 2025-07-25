# Terminal Commands for Complete Application Setup

## 🚀 **Quick Start Commands**

### **Method 1: Manual Terminal Commands (Recommended)**

**Step 1: Start Backend Server**
```bash
cd backend
python app.py
```

**Step 2: In a NEW terminal window, start Frontend Server**
```bash
python serve_frontend.py
```

### **Method 2: Using Windows Command Prompt**

**Step 1: Start Backend**
```cmd
cd backend && python app.py
```

**Step 2: In a NEW Command Prompt, start Frontend**
```cmd
python serve_frontend.py
```

### **Method 3: Using Git Bash (Windows)**

**Step 1: Start Backend**
```bash
cd backend && python app.py &
```

**Step 2: Start Frontend**
```bash
python serve_frontend.py &
```

## 📍 **Working URLs After Starting**
- **Frontend**: http://192.168.1.18:3000
- **Backend API**: http://192.168.1.18:5001
- **API Health**: http://192.168.1.18:5001/api/health

## 🛠️ **Alternative: Single Command (Windows)**
If you're using Windows Command Prompt, you can use:
```cmd
start cmd /k "cd backend && python app.py"
start cmd /k "python serve_frontend.py"
```

## ✅ **Verification Steps**
1. Open http://192.168.1.18:3000 in your browser (frontend)
2. Open http://192.168.1.18:5001/api/health in your browser (backend health check)
3. Both should respond successfully

## 🎯 **Quick Test**
Once both servers are running, test with:
```bash
curl http://192.168.1.18:5001/api/health
```

The complete application is now ready to use!
