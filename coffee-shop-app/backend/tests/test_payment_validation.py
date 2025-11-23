import unittest
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'coffee-shop-app/backend'))

from app import create_app
from extensions import db
from models import Product, Shift

class TestInsufficientPayment(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Open a shift
        self.shift = Shift(start_cash=1000)
        db.session.add(self.shift)

        # Add a product
        self.product = Product(name='Test Product', price=10000, stock=10)
        db.session.add(self.product)
        db.session.commit()

    def tearDown(self):
        self.app_context.pop()

    def test_insufficient_payment(self):
        # Order total will be 10000. Payment is 5000.
        response = self.client.post('/api/pos/orders', json={
            'items': [
                {'id': self.product.id, 'quantity': 1}
            ],
            'payment_received': 5000,
            'payment_method': 'Cash'
        })

        # Currently it likely returns 201, but we want 400
        if response.status_code == 400:
            print("Test passed: Insufficient payment rejected")
        else:
            print(f"Test failed: Insufficient payment accepted with status {response.status_code}")

        self.assertEqual(response.status_code, 400, "Should reject insufficient payment")

if __name__ == '__main__':
    unittest.main()
