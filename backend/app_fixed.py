from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
import uuid
from functools import wraps
import json
import random

# Serve frontend from dist folder
app = Flask(__name__, static_folder='../dist', static_url_path='')

CORS(app, origins="*", supports_credentials=True)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ecg_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_EXPIRATION_DELTA'] = timedelta(days=30)

db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

class Scan(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
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

class CorrectionExample(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = db.Column(db.String(36), db.ForeignKey('scan.id'), nullable=False)
    corrected_prediction = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# JWT Token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Authentication endpoints
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
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
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA']
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
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

# Scan endpoints
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
        
        return jsonify({'success': True, 'message': 'Scan deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
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
                'scan_count': user_scans
            })
        
        return jsonify({'success': True, 'users': user_list}), 200
    except Exception as e:
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
        
        return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/backup', methods=['GET'])
@token_required
def get_backup_data(current_user):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        users = User.query.filter(User.email != current_user.email).all()
        
        backup_data = {
            'users': [],
            'histories': {}
        }
        
        for user in users:
            user_data = {
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'created_at': user.created_at.isoformat()
            }
            backup_data['users'].append(user_data)
            
            scans = Scan.query.filter_by(user_id=user.id).all()
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
            backup_data['histories'][user.email] = scan_list
        
        return jsonify({'success': True, 'backup': backup_data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Aeterna EvoHealth ECG Scanner API is running'}), 200

@app.after_request
def after_request(response):
    # Flask-CORS handles headers
    return response

# Serve React/Vite frontend for all non-API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Serve static files from dist folder
    file_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(file_path):
        # Set cache headers to avoid stale 304 issues
        response = send_from_directory(app.static_folder, path)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    # Serve index.html for SPA routing
    response = send_from_directory(app.static_folder, 'index.html')
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# In-memory store for reset codes (for demo purposes)
reset_codes = {}

def generate_reset_code():
    return str(random.randint(100000, 999999))

@app.route('/api/request-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email.lower()).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    code = generate_reset_code()
    reset_codes[email.lower()] = code
    # In production, send code via email. Here, return it in response.
    masked_email = email[:2] + '***' + email[email.find('@'):]
    return jsonify({
        'success': True,
        'message': 'Reset code sent.',
        'data': {
            'maskedEmail': masked_email,
            'userName': user.name,
            'code': code  # For demo only
        }
    }), 200

@app.route('/api/verify-reset', methods=['POST'])
def verify_reset_code():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    expected_code = reset_codes.get(email.lower())
    if expected_code and code == expected_code:
        return jsonify({'success': True, 'message': 'Code verified.'}), 200
    return jsonify({'success': False, 'message': 'Invalid code.'}), 400

@app.route('/api/finalize-reset', methods=['POST'])
def finalize_password_reset():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('newPassword')
    code = data.get('code')
    expected_code = reset_codes.get(email.lower())
    user = User.query.filter_by(email=email.lower()).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    if expected_code and code == expected_code:
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        reset_codes.pop(email.lower(), None)
        return jsonify({'success': True, 'message': 'Password reset successful.'}), 200
    return jsonify({'success': False, 'message': 'Invalid code.'}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Create default admin user if not exists
        admin_email = 'admin@ecg.app'
        admin_user = User.query.filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                name='Administrator',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin user created: admin@ecg.app / admin123")
    app.run(debug=True, host='0.0.0.0', port=5001)
