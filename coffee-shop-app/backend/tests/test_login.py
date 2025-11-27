import unittest
from app import create_app
from extensions import db
from models import User, Role

class TestLogin(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            # Seeding is handled by app.py on create, but in memory might need manual trigger if logic differs
            # Our app.py calls seed_database() automatically.

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_admin_login(self):
        response = self.client.post('/api/auth/login', json={
            'username': 'Admin',
            'password': 'admin'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])
        self.assertEqual(response.json['user']['role'], 'admin')

    def test_cashier_login(self):
        response = self.client.post('/api/auth/login', json={
            'username': 'Kasir',
            'password': 'kasir'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['success'])
        self.assertEqual(response.json['user']['role'], 'cashier')

    def test_invalid_login(self):
        response = self.client.post('/api/auth/login', json={
            'username': 'Admin',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 401)
