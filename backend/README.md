# ECG Scanner Backend

A production-ready Flask backend for the ECG Scanner application with authentication, scan management, and admin features.

## Features

- **User Authentication**: JWT-based authentication with signup/login
- **Scan Management**: CRUD operations for ECG scans
- **Admin Panel**: User management for administrators
- **RESTful API**: Clean API design following REST principles
- **Production Ready**: Configured for deployment on major platforms

## Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run the application**
   ```bash
   python app.py
   ```
   The server will run on http://localhost:5001

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login

### Scans
- `GET /api/scans` - Get user's scans
- `POST /api/scans` - Create new scan
- `DELETE /api/scans/<scan_id>` - Delete scan

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `DELETE /api/admin/users/<user_id>` - Delete user (admin only)

### Health
- `GET /api/health` - Health check

## Environment Variables

- `SECRET_KEY`: JWT secret key (generate a strong random string)
- `DATABASE_URL`: PostgreSQL database URL for production
- `FLASK_ENV`: Set to 'production' for production

## Frontend Configuration

Update `services/apiService.ts` in the frontend:

```typescript
// Change this to your deployed backend URL
const API_BASE_URL = 'https://your-backend-url.com';
```

## Security Notes

1. Always use HTTPS in production
2. Use strong SECRET_KEY
3. Implement rate limiting for production
4. Use PostgreSQL instead of SQLite for production
5. Enable CORS only for your frontend domain
