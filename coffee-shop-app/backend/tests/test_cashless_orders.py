
import unittest
from app import create_app, db
from models import Product, Shift, Order

class TestCashlessOrders(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            # Create a shift
            shift = Shift(start_cash=100.0, is_open=True)
            db.session.add(shift)

            # Create a product
            product = Product(name='Matcha Latte', price=28000.0, stock=10)
            db.session.add(product)
            db.session.commit()
            self.product_id = product.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_create_qris_order(self):
        # Simulate a QRIS order payload
        order_data = {
            'items': [{'id': self.product_id, 'quantity': 2}],
            'payment_method': 'QRIS',
            'payment_received': 56000.0, # Exact amount
            'customer_name': 'Test User'
        }

        response = self.client.post('/api/pos/orders', json=order_data)
        self.assertEqual(response.status_code, 201)

        data = response.json
        self.assertEqual(data['payment_method'], 'QRIS')
        self.assertEqual(data['total_amount'], 56000.0)

        # Verify DB
        with self.app.app_context():
            order = Order.query.get(data['id'])
            self.assertIsNotNone(order)
            self.assertEqual(order.payment_method, 'QRIS')
            self.assertEqual(order.items[0].quantity, 2)

            # Check stock reduction
            prod = db.session.get(Product, self.product_id)
            self.assertEqual(prod.stock, 8)

    def test_create_cash_order(self):
         # Simulate a Cash order payload with change
        order_data = {
            'items': [{'id': self.product_id, 'quantity': 1}],
            'payment_method': 'Cash',
            'payment_received': 30000.0,
            'customer_name': 'Test Cash'
        }

        response = self.client.post('/api/pos/orders', json=order_data)
        self.assertEqual(response.status_code, 201)

        data = response.json
        self.assertEqual(data['payment_method'], 'Cash')
        self.assertEqual(data['total_amount'], 28000.0)

        # Backend doesn't explicitly return change_given in to_dict but calculates it internally
        # We can check the DB
        with self.app.app_context():
            order = Order.query.get(data['id'])
            self.assertEqual(order.change_given, 2000.0)

if __name__ == '__main__':
    unittest.main()
