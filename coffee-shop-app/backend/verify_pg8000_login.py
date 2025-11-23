import os
import sys

# Ensure backend is in path
sys.path.append(os.path.join(os.getcwd(), 'coffee-shop-app/backend'))

from app import create_app
from extensions import db
from models import User
from flask import json

def verify():
    app = create_app()
    with app.app_context():
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

        # 1. Run Seed (Simulate manual seed)
        print("Seeding...")
        db.drop_all()
        db.create_all()

        admin = User(username="Admin", password="admin", role="admin")
        cashier = User(username="Kasir", password="kasir", role="cashier")
        db.session.add_all([admin, cashier])
        db.session.commit()
        print("Seeded users.")

        # 2. Verify User Exists
        user = User.query.filter_by(username="Admin").first()
        if user:
            print(f"Found user: {user.username}")
        else:
            print("ERROR: User 'Admin' not found after seeding!")
            return

        # 3. Test Login
        client = app.test_client()
        response = client.post('/api/auth/login', json={
            'username': 'Admin',
            'password': 'admin'
        })

        print(f"Login Status: {response.status_code}")
        print(f"Login Response: {response.json}")

        if response.status_code == 200:
            print("SUCCESS: Login working with pg8000")
        else:
            print("FAILURE: Login failed")

if __name__ == "__main__":
    verify()
