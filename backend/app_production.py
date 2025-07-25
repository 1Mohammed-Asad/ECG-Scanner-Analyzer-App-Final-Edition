#!/usr/bin/env python3
"""
Production-ready ECG Scanner Backend Application
Optimized for real-world deployment with email functionality
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
import uuid
import secrets
import logging
from functools import wraps
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
    handlers=[
        logging.FileHandler('ecg_app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Production CORS configuration for multi-device access
CORS(app, 
     origins=[
         "http://localhost:5173",
         "http://127.0.0.1:5173",
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         "http://0.0.0.0:5173",
         "http://0.0.0.0:3000",
         "http://*:5173",
         "http://*:3000"
     ],
     supports_credentials=True)

# Production Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ecg_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_EXPIRATION_DELTA'] = timedelta(days=int(os.environ.get('JWT_EXPIRATION_DELTA', 30)))

# Production Email Configuration
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@ecgscanner.com')

# Initialize extensions
db = SQLAlchemy(app)
mail = Mail(app)

# Models
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)

class Scan(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False, index=True)
    patient_name = db.Column(db.String(100), nullable=False)
    patient_age = db.Column(db.Integer)
    patient_gender = db.Column(db.String(10))
    file_name = db.Column(db.String(255))
    file_url = db.Column(db.String(500))
    prediction = db.Column(db.String(100))
    confidence = db.Column(db.Float)
    analysis_details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PasswordReset(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False, index=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    reset_code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# JWT Token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing!'}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired!'}), 401
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return jsonify({'success': False, 'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Helper functions
def mask_email(email):
    """Mask email for security display"""
    if '@' not in email:
        return email
    username, domain = email.split('@')
    masked_username = username[:2] + '*' * (len(username) - 3) + username[-1] if len(username) > 3 else '*' * len(username)
    return f"{masked_username}@{domain}"

def generate_reset_code():
    """Generate secure 6-digit reset code"""
    return str(secrets.randbelow(900000) + 100000)

def send_reset_email(email, reset_code, user_name):
    """Send password reset email"""
    try:
        subject = "Password Reset - ECG Scanner App"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Password Reset Request</h2>
                <p>Hello {user_name},</p>
                <p>We received a request to reset your password for your ECG Scanner account.</p>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Your Reset Code:</h3>
                    <div style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 2px;">
                        {reset_code}
                    </div>
                </div>
                <p>This code will expire in 15 minutes for security reasons.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                    This is an automated message from ECG Scanner App. Please do not reply to this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        msg = Message(
            subject=subject,
            recipients=[email],
            html=body
        )
        
        mail.send(msg)
        logger.info(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send reset email: {str(e)}")
        return False

# Authentication endpoints
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Validate email format
    if '@' not in email or '.' not in email.split('@')[1]:
        return jsonify({'success': False, 'message': 'Invalid email format'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=email.lower()).first():
        return jsonify({'success': False, 'message': 'User already exists'}), 400
    
    # Create new user
    hashed_password = generate_password_hash(password)
    new_user = User(
        email=email.lower(),
        name=name,
        password_hash=hashed_password,
        role='user'
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': new_user.id,
            'exp': datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA']
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        logger.info(f"New user registered: {email}")
        return jsonify({
            'success': True,
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'name': new_user.name,
                'role': new_user.role
            },
            'token': token
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Signup error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create user'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({'success': False, 'message': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=email.lower()).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA']
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    logger.info(f"User logged in: {email}")
    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role
        },
        'token': token
    }), 200

# Password Reset Endpoints
@app.route('/api/request-reset', methods=['POST'])
def request_password_reset():
    """Request password reset - sends email with reset code"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    # Find user
    user = User.query.filter_by(email=email.lower()).first()
    if not user:
        # Don't reveal if user exists or not
        return jsonify({'success': True, 'message': 'If the email exists, a reset code has been sent'}), 200
    
    # Check for existing active reset codes
    existing_reset = PasswordReset.query.filter_by(
        email=email.lower(),
        used=False
    ).filter(PasswordReset.expires_at > datetime.utcnow()).first()
    
    if existing_reset:
        # Return existing masked email
        return jsonify({
            'success': True,
            'message': 'Reset code already sent',
            'data': {
                'maskedEmail': mask_email(email),
                'userName': user.name
            }
        }), 200
    
    # Generate new reset code
    reset_code = generate_reset_code()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Store reset code
    password_reset = PasswordReset(
        user_id=user.id,
        email=email.lower(),
        reset_code=reset_code,
        expires_at=expires_at
    )
    
    try:
        db.session.add(password_reset)
        db.session.commit()
        
        # Send email
        if send_reset_email(email, reset_code, user.name):
            return jsonify({
                'success': True,
                'message': 'Reset code sent successfully',
                'data': {
                    'maskedEmail': mask_email(email),
                    'userName': user.name
                }
            }), 200
        else:
            db.session.delete(password_reset)
            db.session.commit()
            return jsonify({'success': False, 'message': 'Failed to send reset email'}), 500
            
    except Exception as e:
        db.session.rollback()
        logger.error(f"Password reset request error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to process reset request'}), 500

@app.route('/api/verify-reset', methods=['POST'])
def verify_reset_code():
    """Verify password reset code"""
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    
    if not all([email, code]):
        return jsonify({'success': False, 'message': 'Email and code are required'}), 400
    
    # Find reset code
    reset_entry = PasswordReset.query.filter_by(
        email=email.lower(),
        reset_code=code,
        used=False
    ).filter(PasswordReset.expires_at > datetime.utcnow()).first()
    
    if not reset_entry:
        return jsonify({'success': False, 'message': 'Invalid or expired reset code'}), 400
    
    return jsonify({'success': True, 'message': 'Reset code verified successfully'}), 200

@app.route('/api/finalize-reset', methods=['POST'])
def finalize_password_reset():
    """Complete password reset with new password"""
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('newPassword')
    code = data.get('code')
    
    if not all([email, new_password, code]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    # Validate password strength
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    # Find and validate reset code
    reset_entry = PasswordReset.query.filter_by(
        email=email.lower(),
        reset_code=code,
        used=False
    ).filter(PasswordReset.expires_at > datetime.utcnow()).first()
    
    if not reset_entry:
        return jsonify({'success': False, 'message': 'Invalid or expired reset code'}), 400
    
    # Find user
    user = User.query.filter_by(email=email.lower()).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    try:
        # Update password
        user.password_hash = generate_password_hash(new_password)
        
        # Mark reset code as used
        reset_entry.used = True
        
        # Clean up old reset codes for this user
        PasswordReset.query.filter_by(
            email=email.lower(),
            used=False
        ).update({'used': True})
        
        db.session.commit()
        
        logger.info(f"Password reset completed for {email}")
        return jsonify({'success': True, 'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Password reset finalization error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to reset password'}), 500

# Scan endpoints (existing functionality)
@app.route('/api/scans', methods=['GET'])
@token_required
def get_user_scans(current_user):
    try:
        scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all()
        
        scan_list = []
        for scan in scans:
            scan_list.append({
                'id': scan.id,
                'patient_name': scan.patient_name,
                'patient_age': scan.patient_age,
                'patient_gender': scan.patient_gender,
                'file_name': scan.file_name,
                'file_url': scan.file_url,
                'prediction': scan.prediction,
                'confidence': scan.confidence,
                'analysis_details': json.loads(scan.analysis_details) if scan.analysis_details else None,
                'created_at': scan.created_at.isoformat(),
                'updated_at': scan.updated_at.isoformat()
            })
        
        return jsonify({'success': True, 'scans': scan_list}), 200
    except Exception as e:
        logger.error(f"Get scans error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/scans', methods=['POST'])
@token_required
def create_scan(current_user):
    data = request.get_json()
    
    try:
        new_scan = Scan(
            user_id=current_user.id,
            patient_name=data.get('patient_name'),
            patient_age=data.get('patient_age'),
            patient_gender=data.get('patient_gender'),
            file_name=data.get('file_name'),
            file_url=data.get('file_url'),
            prediction=data.get('prediction'),
            confidence=data.get('confidence'),
            analysis_details=json.dumps(data.get('analysis_details', {}))
        )
        
        db.session.add(new_scan)
        db.session.commit()
        
        logger.info(f"New scan created by user {current_user.email}")
        return jsonify({
            'success': True,
            'scan': {
                'id': new_scan.id,
                'patient_name': new_scan.patient_name,
                'patient_age': new_scan.patient_age,
                'patient_gender': new_scan.patient_gender,
                'file_name': new_scan.file_name,
                'file_url': new_scan.file_url,
                'prediction': new_scan.prediction,
                'confidence': new_scan.confidence,
                'analysis_details': json.loads(new_scan.analysis_details) if new_scan.analysis_details else None,
                'created_at': new_scan.created_at.isoformat(),
                'updated_at': new_scan.updated_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create scan error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/scans/<scan_id>', methods=['DELETE'])
@token_required
def delete_scan(current_user, scan_id):
    try:
        scan = Scan.query.filter_by(id=scan_id, user_id=current_user.id).first()
        
        if not scan:
            return jsonify({'success': False, 'message': 'Scan not found'}), 404
        
        db.session.delete(scan)
        db.session.commit()
        
        logger.info(f"Scan deleted by user {current_user.email}")
        return jsonify({'success': True, 'message': 'Scan deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete scan error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Admin endpoints
@app.route('/api/admin/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        users = User.query.filter(User.email != current_user.email).all()
        
        user_list = []
        for user in users:
            user_scans = Scan.query.filter_by(user_id=user.id).count()
            user_list.append({
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'scan_count': user_scans
            })
        
        return jsonify({'success': True, 'users': user_list}), 200
    except Exception as e:
        logger.error(f"Get users error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        user = User.query.filter_by(id=user_id).first()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Delete all user's scans
        Scan.query.filter_by(user_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        
        logger.info(f"User deleted by admin {current_user.email}: {user.email}")
        return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete user error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Admin bulk operations
@app.route('/api/admin/clear-all-history', methods=['DELETE'])
@token_required
def clear_all_history(current_user):
    """Clear all scan history for all users (Admin only)"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        # Count total scans
        total_scans = Scan.query.count()
        
        # Delete all scans
        Scan.query.delete()
        db.session.commit()
        
        logger.info(f"All scan history cleared by admin {current_user.email}. Deleted {total_scans} scans.")
        return jsonify({
            'success': True, 
            'message': f'All scan history cleared successfully. Deleted {total_scans} scans.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Clear all history error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/users/<user_id>/history', methods=['DELETE'])
@token_required
def clear_user_history(current_user, user_id):
    """Clear specific user's scan history (Admin only)"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        # Find user
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Count user's scans
        user_scans = Scan.query.filter_by(user_id=user_id).count()
        
        # Delete user's scans
        Scan.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        logger.info(f"User history cleared by admin {current_user.email}. User: {user.email}, Deleted: {user_scans} scans.")
        return jsonify({
            'success': True, 
            'message': f'User history cleared successfully. Deleted {user_scans} scans.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Clear user history error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# AI Model Learning from Corrections
class AIModelFeedback(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = db.Column(db.String(36), db.ForeignKey('scan.id'), nullable=False)
    original_prediction = db.Column(db.String(100), nullable=False)
    corrected_prediction = db.Column(db.String(100), nullable=False)
    confidence_change = db.Column(db.Float)
    feedback_type = db.Column(db.String(20), nullable=False)  # 'correction', 'confirmation'
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/scans/<scan_id>/feedback', methods=['POST'])
@token_required
def submit_ai_feedback(current_user, scan_id):
    """Submit feedback for AI model learning"""
    data = request.get_json()
    
    corrected_prediction = data.get('corrected_prediction')
    notes = data.get('notes', '')
    feedback_type = data.get('feedback_type', 'correction')
    
    if not corrected_prediction:
        return jsonify({'success': False, 'message': 'Corrected prediction is required'}), 400
    
    try:
        # Find scan
        scan = Scan.query.filter_by(id=scan_id).first()
        if not scan:
            return jsonify({'success': False, 'message': 'Scan not found'}), 404
        
        # Calculate confidence change
        original_confidence = scan.confidence or 0.0
        new_confidence = data.get('new_confidence', original_confidence)
        confidence_change = new_confidence - original_confidence
        
        # Store feedback for AI learning
        feedback = AIModelFeedback(
            scan_id=scan_id,
            original_prediction=scan.prediction,
            corrected_prediction=corrected_prediction,
            confidence_change=confidence_change,
            feedback_type=feedback_type,
            user_id=current_user.id,
            notes=notes
        )
        
        # Update scan with corrected data
        scan.prediction = corrected_prediction
        scan.confidence = new_confidence
        if 'analysis_details' in data:
            scan.analysis_details = json.dumps(data['analysis_details'])
        
        db.session.add(feedback)
        db.session.commit()
        
        logger.info(f"AI feedback submitted by {current_user.email} for scan {scan_id}")
        
        # Calculate learning metrics
        total_feedback = AIModelFeedback.query.count()
        correction_rate = AIModelFeedback.query.filter_by(feedback_type='correction').count()
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully',
            'data': {
                'total_feedback': total_feedback,
                'correction_rate': correction_rate,
                'scan_updated': True
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"AI feedback submission error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/ai-feedback', methods=['GET'])
@token_required
def get_ai_feedback(current_user):
    """Get AI model feedback data for analysis (Admin only)"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        # Get feedback statistics
        total_feedback = AIModelFeedback.query.count()
        corrections = AIModelFeedback.query.filter_by(feedback_type='correction').count()
        confirmations = AIModelFeedback.query.filter_by(feedback_type='confirmation').count()
        
        # Get recent feedback
        recent_feedback = AIModelFeedback.query.order_by(
            AIModelFeedback.created_at.desc()
        ).limit(50).all()
        
        feedback_list = []
        for fb in recent_feedback:
            feedback_list.append({
                'id': fb.id,
                'scan_id': fb.scan_id,
                'original_prediction': fb.original_prediction,
                'corrected_prediction': fb.corrected_prediction,
                'confidence_change': fb.confidence_change,
                'feedback_type': fb.feedback_type,
                'user_id': fb.user_id,
                'notes': fb.notes,
                'created_at': fb.created_at.isoformat()
            })
        
        # Calculate accuracy improvements
        accuracy_data = {}
        if total_feedback > 0:
            correction_rate = (corrections / total_feedback) * 100
            accuracy_data['correction_rate'] = round(correction_rate, 2)
            accuracy_data['improvement_potential'] = round(100 - correction_rate, 2)
        
        return jsonify({
            'success': True,
            'data': {
                'total_feedback': total_feedback,
                'corrections': corrections,
                'confirmations': confirmations,
                'accuracy_data': accuracy_data,
                'recent_feedback': feedback_list
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get AI feedback error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/ai-model-stats', methods=['GET'])
@token_required
def get_ai_model_stats(current_user):
    """Get AI model performance statistics (Admin only)"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        # Get prediction accuracy stats
        total_scans = Scan.query.count()
        feedback_scans = AIModelFeedback.query.distinct(AIModelFeedback.scan_id).count()
        
        # Get most common corrections
        corrections = db.session.query(
            AIModelFeedback.original_prediction,
            AIModelFeedback.corrected_prediction,
            db.func.count(AIModelFeedback.id).label('count')
        ).filter_by(
            feedback_type='correction'
        ).group_by(
            AIModelFeedback.original_prediction,
            AIModelFeedback.corrected_prediction
        ).order_by(
            db.desc('count')
        ).limit(10).all()
        
        correction_patterns = []
        for corr in corrections:
            correction_patterns.append({
                'original': corr.original_prediction,
                'corrected': corr.corrected_prediction,
                'count': corr.count
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_scans': total_scans,
                'scans_with_feedback': feedback_scans,
                'feedback_rate': round((feedback_scans / max(total_scans, 1)) * 100, 2),
                'correction_patterns': correction_patterns
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get AI model stats error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

# Initialize database
with app.app_context():
    try:
        db.create_all()
        
        # Create default admin user if no users exist
        if not User.query.first():
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@ecgscanner.com')
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            
            admin_user = User(
                email=admin_email,
                name='Administrator',
                password_hash=generate_password_hash(admin_password),
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            logger.info(f"Default admin user created: {admin_email}")
            
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"Starting ECG Scanner Backend on {host}:{port}")
    app.run(host=host, port=port, debug=False)
