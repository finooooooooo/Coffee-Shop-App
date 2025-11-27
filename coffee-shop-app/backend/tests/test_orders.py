import unittest
from app import create_app
from extensions import db
from models import Product, Category, User, Role

class TestOrders(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            # Ensure we have a product and a user
            self.category = Category.query.first()
            if not self.category:
                 self.category = Category(name='Test Cat')
                 db.session.add(self.category)

            self.product = Product(
                name='Test Product',
                price=10000,
                category_id=self.category.id,
                is_inventory_managed=True,
                stock_quantity=10,
                is_active=True
            )
            db.session.add(self.product)

            # Need a user for user_id
            self.user = User.query.first()
            if not self.user:
                 role = Role(name='cashier')
                 db.session.add(role)
                 self.user = User(username='test_user', password_hash='pass', role_id=role.id)
                 db.session.add(self.user)

            db.session.commit()
            self.product_id = self.product.id
            self.user_id = self.user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_create_order_success(self):
        response = self.client.post('/api/pos/orders', json={
            'user_id': self.user_id,
            'items': [{'id': self.product_id, 'quantity': 1}],
            'payment_received': 10000,
            'payment_method': 'Cash'
        })
        self.assertEqual(response.status_code, 201)
        data = response.json
        self.assertEqual(data['status'], 'paid')
        self.assertTrue(data['transaction_code'].startswith('TRX-'))

    def test_insufficient_stock(self):
        response = self.client.post('/api/pos/orders', json={
            'user_id': self.user_id,
            'items': [{'id': self.product_id, 'quantity': 100}],
            'payment_received': 1000000,
            'payment_method': 'Cash'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('Insufficient stock', response.json['error'])

    def test_insufficient_payment(self):
        response = self.client.post('/api/pos/orders', json={
            'user_id': self.user_id,
            'items': [{'id': self.product_id, 'quantity': 1}],
            'payment_received': 5000, # Less than 10000
            'payment_method': 'Cash'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('Insufficient payment', response.json['error'])
