import os
from datetime import timedelta

class ProductionConfig:
    """Production configuration for multi-device sync"""
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
    
    # PostgreSQL Database configuration for shared access across all devices
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    # Use PostgreSQL for shared database access instead of local SQLite
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or 'postgresql://postgres:password@localhost:5432/ecg_shared_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
    
    # JWT Configuration
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
