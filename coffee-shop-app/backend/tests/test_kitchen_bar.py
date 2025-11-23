import unittest
from app import app, db
from models import Order, OrderItem, Product, Category
from datetime import datetime, date

class TestKitchenBar(unittest.TestCase):
    def setUp(self):
        # Configure app for testing with in-memory DB
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

        self.client = app.test_client()
        self.created_orders = []

        with app.app_context():
            # Create all tables for the in-memory DB
            db.create_all()

            # Check if categories already exist (from auto-seeding)
            self.cat_drink = Category.query.filter_by(name='Classic Coffee').first()
            if not self.cat_drink:
                self.cat_drink = Category(name='Classic Coffee')
                db.session.add(self.cat_drink)

            self.cat_food = Category.query.filter_by(name='Main Course').first()
            if not self.cat_food:
                self.cat_food = Category(name='Main Course')
                db.session.add(self.cat_food)

            db.session.commit()

            # Create distinct test products
            self.p1 = Product(name='TestCoffee_Unit', price=10000, stock=100, category_id=self.cat_drink.id, image_url='')
            self.p2 = Product(name='TestFood_Unit', price=20000, stock=100, category_id=self.cat_food.id, image_url='')

            db.session.add_all([self.p1, self.p2])
            db.session.commit()

            # Store IDs for use in tests
            self.p1_id = self.p1.id
            self.p2_id = self.p2.id

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_order_creation_sets_status(self):
        """Test that creating an order sets the correct initial kitchen/bar status based on items."""
        payload = {
            'total_amount': 30000,
            'payment_method': 'Cash',
            'payment_received': 50000,
            'items': [
                {'id': self.p1_id, 'quantity': 1}, # Drink -> Bar
                {'id': self.p2_id, 'quantity': 1}  # Food -> Kitchen
            ]
        }
        res = self.client.post('/api/pos/orders', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.created_orders.append(data['id'])

        self.assertTrue(data['order_id'].startswith('P'))

        with app.app_context():
            order = db.session.get(Order, data['id'])
            self.assertEqual(order.bar_status, 'pending')
            self.assertEqual(order.kitchen_status, 'pending')
            # Check DB column directly
            self.assertIsNotNone(order.daily_order_number)

    def test_order_split_logic(self):
        """Test ordering only food sets bar_status to 'none'."""
        payload = {
            'total_amount': 20000,
            'payment_method': 'Cash',
            'payment_received': 20000,
            'items': [
                {'id': self.p2_id, 'quantity': 1} # Food only
            ]
        }
        res = self.client.post('/api/pos/orders', json=payload)
        data = res.get_json()
        self.created_orders.append(data['id'])

        with app.app_context():
            order = db.session.get(Order, data['id'])
            self.assertEqual(order.kitchen_status, 'pending')
            self.assertEqual(order.bar_status, 'none')

    def test_status_update(self):
        """Test updating status via endpoint."""
        # Create order
        payload = {
            'total_amount': 10000,
            'payment_method': 'Cash',
            'payment_received': 10000,
            'items': [{'id': self.p1_id, 'quantity': 1}]
        }
        res_create = self.client.post('/api/pos/orders', json=payload)
        order_id = res_create.get_json()['id']
        self.created_orders.append(order_id)

        # Update Bar Status
        res_update = self.client.post(f'/api/pos/orders/{order_id}/status', json={
            'role': 'bar',
            'status': 'preparing'
        })
        self.assertEqual(res_update.status_code, 200)

        with app.app_context():
            order = db.session.get(Order, order_id)
            self.assertEqual(order.bar_status, 'preparing')

if __name__ == '__main__':
    unittest.main()
