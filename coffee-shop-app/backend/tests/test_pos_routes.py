
import unittest
from app import create_app, db
from models import Product, Shift

class TestPOSRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            # Create a shift
            shift = Shift(start_cash=100.0)
            db.session.add(shift)
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_create_order_sufficient_stock(self):
        with self.app.app_context():
            product = Product(name='Coffee', price=5.0, stock=10)
            db.session.add(product)
            db.session.commit()
            product_id = product.id

        order_data = {
            'items': [{'id': product_id, 'quantity': 2}],
            'payment_method': 'Cash',
            'payment_received': 10.0
        }

        response = self.client.post('/api/pos/orders', json=order_data)
        self.assertEqual(response.status_code, 201)

        with self.app.app_context():
            product = db.session.get(Product, product_id)
            self.assertEqual(product.stock, 8)

    def test_create_order_insufficient_stock(self):
        with self.app.app_context():
            product = Product(name='Cake', price=5.0, stock=5)
            db.session.add(product)
            db.session.commit()
            product_id = product.id

        order_data = {
            'items': [{'id': product_id, 'quantity': 10}],
            'payment_method': 'Cash',
            'payment_received': 50.0
        }

        response = self.client.post('/api/pos/orders', json=order_data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Insufficient stock', response.json['error'])

        with self.app.app_context():
            product = db.session.get(Product, product_id)
            self.assertEqual(product.stock, 5)

if __name__ == '__main__':
    unittest.main()
