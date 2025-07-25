import os
from datetime import timedelta

class MongoConfig:
    """Configuration for shared MongoDB database across devices"""
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
    
    # MongoDB Database configuration
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    mongo_db = os.environ.get('MONGO_DATABASE', 'ecg_shared_db')
    
    # Flask configuration
    MONGO_URI = mongo_uri
    MONGO_DATABASE = mongo_db
    
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
