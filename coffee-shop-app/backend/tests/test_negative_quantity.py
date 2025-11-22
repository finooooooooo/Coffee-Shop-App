
import unittest
from app import create_app, db
from models import Product, Shift

class TestNegativeQuantity(unittest.TestCase):
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

    def test_create_order_negative_quantity(self):
        with self.app.app_context():
            product = Product(name='Coffee', price=10.0, stock=100)
            db.session.add(product)
            db.session.commit()
            product_id = product.id

        order_data = {
            'items': [{'id': product_id, 'quantity': -5}],
            'payment_method': 'Cash',
            'payment_received': 0.0 # If total becomes negative, this might work
        }

        # This should fail with 400, but currently it will likely succeed (201)
        response = self.client.post('/api/pos/orders', json=order_data)

        self.assertEqual(response.status_code, 400, "Should reject negative quantity")
        self.assertIn('Invalid quantity', response.json.get('error', ''), "Error message should mention invalid quantity")

if __name__ == '__main__':
    unittest.main()
