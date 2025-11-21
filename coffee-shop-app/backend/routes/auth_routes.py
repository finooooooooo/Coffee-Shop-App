from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Hardcoded credentials as requested
    if username == 'Admin' and password == 'admin':
        return jsonify({'token': 'admin-token', 'role': 'Admin', 'success': True})
    
    if username == 'Kasir' and password == 'kasir':
        return jsonify({'token': 'kasir-token', 'role': 'Kasir', 'success': True})

    return jsonify({'error': 'Invalid credentials', 'success': False}), 401
