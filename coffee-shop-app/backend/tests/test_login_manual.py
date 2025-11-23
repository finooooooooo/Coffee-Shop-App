import unittest
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'coffee-shop-app/backend'))

from app import create_app
from extensions import db
from models import User

class TestLogin(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Seed users for testing
        self.admin = User(username="Admin", password="admin", role="admin")
        self.cashier = User(username="Kasir", password="kasir", role="cashier")
        db.session.add_all([self.admin, self.cashier])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_admin_login(self):
        response = self.client.post('/api/auth/login', json={
            'username': 'Admin',
            'password': 'admin'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])
        self.assertEqual(response.json['user']['username'], 'Admin')
        self.assertEqual(response.json['user']['role'], 'admin')

    def test_cashier_login(self):
        response = self.client.post('/api/auth/login', json={
            'username': 'Kasir',
            'password': 'kasir'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])
        self.assertEqual(response.json['user']['username'], 'Kasir')
        self.assertEqual(response.json['user']['role'], 'cashier')

    def test_invalid_login(self):
        response = self.client.post('/api/auth/login', json={
            'username': 'Admin',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main()
