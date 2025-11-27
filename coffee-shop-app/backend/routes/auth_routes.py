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
    if user and user.password_hash == password:
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role.name
            }
        })

    return jsonify({'error': 'Invalid credentials'}), 401
