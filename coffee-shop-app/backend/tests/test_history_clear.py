import unittest
import json
from app import create_app, db
from models import Order, Product, Category

class TestHistoryClear(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            # Seed minimal data
            cat = Category(name='Test Cat')
            prod = Product(name='Test Prod', price=10000, stock=100, category=cat)
            db.session.add(cat)
            db.session.add(prod)
            db.session.commit()
            self.product_id = prod.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_history_clear_flow(self):
        # 1. Create an Order
        order_payload = {
            'items': [{'id': self.product_id, 'quantity': 1}],
            'payment_received': 10000,
            'customer_name': 'Jules'
        }
        res = self.client.post('/api/pos/orders', json=order_payload)
        self.assertEqual(res.status_code, 201)

        # 2. Check History (Should appear)
        res = self.client.get('/api/pos/orders')
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['customer_name'], 'Jules')

        # 3. Check Reports (Should NOT appear yet, based on logic? Wait, let me check report_routes)
        # report_routes: query.filter_by(is_cleared=True)
        res = self.client.get('/api/report/transactions')
        data = res.get_json()
        self.assertEqual(len(data), 0)

        # 4. Clear History
        res = self.client.post('/api/pos/history/clear')
        self.assertEqual(res.status_code, 200)
        self.assertIn('Successfully cleared', res.get_json()['message'])

        # 5. Check History (Should be empty now)
        res = self.client.get('/api/pos/orders')
        data = res.get_json()
        self.assertEqual(len(data), 0)

        # 6. Check Reports (Should appear now)
        res = self.client.get('/api/report/transactions')
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['customer_name'], 'Jules')

if __name__ == '__main__':
    unittest.main()
