# 🚀 Production Deployment Guide - ECG Scanner App

## 📧 Email Configuration for Real-World Deployment

### 1. Gmail SMTP Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Generate App Password:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "ECG Scanner App"
   - Copy the 16-character app password

#### Step 2: Configure Environment Variables
```bash
# Create .env file in backend directory
cp backend/.env.example backend/.env

# Edit .env with your actual values
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_DEFAULT_SENDER=ECG Scanner <your-email@gmail.com>
```

### 2. Alternative Email Providers

#### Outlook/Office365
```bash
MAIL_SERVER=smtp.office365.com
MAIL_PORT=587
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
```

#### Zoho Mail
```bash
MAIL_SERVER=smtp.zoho.com
MAIL_PORT=587
MAIL_USERNAME=your-email@yourdomain.com
MAIL_PASSWORD=your-password
```

#### SendGrid (Recommended for Scale)
```bash
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_DEFAULT_SENDER=ECG Scanner <noreply@yourdomain.com>
```

## 🌐 Production Deployment Options

### Option 1: Railway.app (Easiest)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway add
railway deploy

# Set environment variables
railway variables set MAIL_USERNAME=your-email@gmail.com
railway variables set MAIL_PASSWORD=your-app-password
railway variables set SECRET_KEY=your-secret-key
```

### Option 2: Heroku
```bash
# Install Heroku CLI
npm i -g heroku

# Create Procfile
echo "web: python app_production.py" > backend/Procfile

# Deploy
cd backend
heroku create your-ecg-scanner-backend
git add .
git commit -m "Deploy with email functionality"
git push heroku main

# Set config vars
heroku config:set MAIL_USERNAME=your-email@gmail.com
heroku config:set MAIL_PASSWORD=your-app-password
```

### Option 3: DigitalOcean Droplet
```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Install dependencies
apt update && apt upgrade -y
apt install python3-pip python3-venv nginx supervisor

# Setup application
cd /var/www/
git clone your-repo-url
cd ecg-scanner-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your production values

# Setup Gunicorn
pip install gunicorn
```

### Option 4: AWS EC2
```bash
# Launch EC2 instance (Ubuntu 20.04)
# Security Group: Allow ports 22, 80, 443, 5001

# Connect and setup
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker (Recommended)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Create Dockerfile
cat > Dockerfile << EOF
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "app_production.py"]
EOF

# Build and run
docker build -t ecg-scanner-backend .
docker run -d -p 5001:5001 --env-file .env ecg-scanner-backend
```

## 🔧 Production Environment Variables

Create `backend/.env` with these production values:

```bash
# Core Configuration
SECRET_KEY=your-super-secret-key-here
FLASK_ENV=production
FLASK_DEBUG=false

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://username:password@localhost/ecgscanner

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-production-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_DEFAULT_SENDER=ECG Scanner <noreply@yourdomain.com>

# Application Settings
JWT_EXPIRATION_DELTA=30
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Admin Setup
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password

# Server Configuration
PORT=5001
HOST=0.0.0.0
```

## 🐳 Docker Deployment (Recommended)

### Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/api/health || exit 1

# Run application
CMD ["python", "app_production.py"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/ecgscanner
      - MAIL_USERNAME=${MAIL_USERNAME}
      - MAIL_PASSWORD=${MAIL_PASSWORD}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: ecgscanner
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong SECRET_KEY
- [ ] Use environment variables for sensitive data
- [ ] Enable rate limiting
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Use production-grade database (PostgreSQL)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 📊 Monitoring & Logs

### Setup Logging
```bash
# Create log directory
mkdir -p /var/log/ecg-scanner

# Setup log rotation
cat > /etc/logrotate.d/ecg-scanner << EOF
/var/log/ecg-scanner/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 appuser appuser
}
EOF
```

### Health Monitoring
```bash
# Add health check endpoint
curl -f http://localhost:5001/api/health
```

## 🚀 Quick Start Commands

```bash
# 1. Clone and setup
git clone your-repo-url
cd ecg-scanner-backend

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 3. Install dependencies
cd backend
pip install -r requirements.txt

# 4. Run production server
python app_production.py
```

## 📞 Support

For deployment issues:
1. Check application logs: `tail -f ecg_app.log`
2. Verify email configuration: Test with a simple email
3. Check database connectivity
4. Ensure all environment variables are set

Your ECG Scanner app is now ready for real-world production deployment with full email functionality for password reset verification codes!
