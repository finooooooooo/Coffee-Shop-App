from flask import Blueprint, request, jsonify
from extensions import db
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    user = User.query.filter_by(username=username).first()

    # Simple password check (in production use werkzeug.security.check_password_hash)
    if user and user.password == password:
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role
            }
        })

    return jsonify({'error': 'Invalid credentials'}), 401
    # Hardcoded credentials as requested
    if username == 'Admin' and password == 'admin':
        return jsonify({'token': 'admin-token', 'role': 'Admin', 'success': True})
    
    if username == 'Kasir' and password == 'kasir':
        return jsonify({'token': 'kasir-token', 'role': 'Kasir', 'success': True})

    return jsonify({'error': 'Invalid credentials', 'success': False}), 401
