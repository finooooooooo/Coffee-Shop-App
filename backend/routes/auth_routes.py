from flask import Blueprint, request, jsonify
from extensions import db
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Simple check (In production, use hash verification)
    user = User.query.filter_by(username=username).first()

    if user and user.password == password:
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        })
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
