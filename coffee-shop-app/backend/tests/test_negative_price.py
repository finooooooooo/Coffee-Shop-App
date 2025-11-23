import unittest
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'coffee-shop-app/backend'))

from app import create_app
from extensions import db
from models import Product

class TestNegativePrice(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_create_negative_price_product(self):
        response = self.client.post('/api/inventory/products', json={
            'name': 'Negative Price Coffee',
            'price': -5000,
            'stock': 10,
            'category_id': 1
        })
        # Currently it returns 201, but we want it to return 400
        if response.status_code == 400:
            print("Test passed: Negative price rejected")
        else:
            print(f"Test failed: Negative price accepted with status {response.status_code}")

        self.assertEqual(response.status_code, 400, "Should reject negative price")

    def test_update_negative_price_product(self):
        # First create a valid product
        p = Product(name='Test Product', price=10000, stock=10)
        db.session.add(p)
        db.session.commit()

        response = self.client.put(f'/api/inventory/products/{p.id}', json={
            'price': -1000
        })
        self.assertEqual(response.status_code, 400, "Should reject negative price on update")

if __name__ == '__main__':
    unittest.main()
