from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
import uuid
from functools import wraps
import json

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://192.168.1.18:3000',
    'http://192.168.1.18:5173'
], supports_credentials=True)

# SQL Database configuration
shared_db_path = os.environ.get('SHARED_DB_PATH', 'shared_sql_data/ecg_shared.db')
os.makedirs(os.path.dirname(shared_db_path), exist_ok=True)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{shared_db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_EXPIRATION_DELTA'] = timedelta(days=30)

# Email configuration
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@ecgscanner.com')

mail = Mail(app)
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

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200

# Initialize database within application context
with app.app_context():
    db.create_all()
    
    # Create default admin user if no users exist
    if not User.query.first():
        admin_user = User(
            email='admin@ecg.app',
            name='Administrator',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin_user)
        db.session.commit()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
