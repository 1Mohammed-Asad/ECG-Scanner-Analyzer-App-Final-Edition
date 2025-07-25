import os
from datetime import timedelta

class SharedConfig:
    """Configuration for shared SQLite database across devices"""
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
    
    # Shared SQLite database - accessible from any device on the same network
    # Use a shared folder path that all devices can access
    db_path = os.environ.get('SHARED_DB_PATH', 'shared_data/ecg_shared.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_EXPIRATION_DELTA = timedelta(days=30)
    
    # Security settings
    DEBUG = False
    TESTING = False
    
    # Security headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
    
    # Admin user hiding
    HIDE_ADMIN_USERS = True
    
    # Console logging
    DISABLE_CONSOLE_LOGGING = True
