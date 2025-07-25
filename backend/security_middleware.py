import os
import logging
from functools import wraps
from flask import jsonify, request, g

class SecurityMiddleware:
    """Security middleware for hiding admin users and preventing console exposure"""
    
    @staticmethod
    def disable_console_logging():
        """Disable console logging in production"""
        if os.environ.get('FLASK_ENV') == 'production':
            # Disable werkzeug logging
            logging.getLogger('werkzeug').setLevel(logging.ERROR)
            # Disable SQLAlchemy logging
            logging.getLogger('sqlalchemy').setLevel(logging.ERROR)
            # Disable app logging
            logging.getLogger('app').setLevel(logging.ERROR)
    
    @staticmethod
    def sanitize_user_output(user_data, hide_admin=True):
        """Sanitize user data for output - hide sensitive fields and optionally admin users"""
        if not user_data:
            return {}
        
        # If it's a list of users
        if isinstance(user_data, list):
            sanitized_users = []
            for user in user_data:
                if hide_admin and user.get('role') == 'admin':
                    continue
                    
                safe_user = {
                    'id': str(user.get('id', ''))[:8] + '...',  # Mask ID
                    'email': SecurityMiddleware._mask_email(user.get('email', '')),
                    'name': user.get('name', ''),
                    'role': user.get('role', 'user') if not hide_admin else 'user',  # Hide admin role
                    'created_at': user.get('created_at', '').isoformat() if hasattr(user.get('created_at'), 'isoformat') else str(user.get('created_at', '')),
                    'scan_count': user.get('scan_count', 0)
                }
                sanitized_users.append(safe_user)
            return sanitized_users
        
        # Single user
        safe_user = {
            'id': str(user_data.get('id', ''))[:8] + '...',
            'email': SecurityMiddleware._mask_email(user_data.get('email', '')),
            'name': user_data.get('name', ''),
            'role': user_data.get('role', 'user') if not hide_admin else 'user'
        }
        return safe_user
    
    @staticmethod
    def _mask_email(email):
        """Mask email for security"""
        if '@' not in email:
            return '***@***.***'
        
        username, domain = email.split('@', 1)
        if len(username) <= 2:
            masked_username = '*' * len(username)
        else:
            masked_username = username[:2] + '*' * (len(username) - 2)
        
        domain_parts = domain.split('.')
        if len(domain_parts) >= 2:
            masked_domain = '*' * len(domain_parts[0]) + '.' + domain_parts[-1]
        else:
            masked_domain = '*' * len(domain)
        
        return f"{masked_username}@{masked_domain}"
    
    @staticmethod
    def require_admin(f):
        """Decorator to require admin access"""
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role != 'admin':
                return jsonify({'success': False, 'message': 'Admin access required'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    
    @staticmethod
    def add_security_headers(response):
        """Add security headers to response"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

# Initialize security
SecurityMiddleware.disable_console_logging()
