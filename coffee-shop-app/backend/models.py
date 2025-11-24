from datetime import datetime
from extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False) # In production use hashing!
    role = db.Column(db.String(20), nullable=False) # 'admin' or 'cashier'

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'role': self.role}

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name}

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'stock': self.stock,
            'category': self.category.name if self.category else None,
            'category_id': self.category_id,
            'image_url': self.image_url,
            'is_active': self.is_active
        }

class Shift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    start_cash = db.Column(db.Float, default=0.0)
    end_cash = db.Column(db.Float, nullable=True)
    total_sales = db.Column(db.Float, default=0.0)
    is_open = db.Column(db.Boolean, default=True)
    orders = db.relationship('Order', backref='shift', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'start_cash': self.start_cash,
            'end_cash': self.end_cash,
            'total_sales': self.total_sales,
            'is_open': self.is_open
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shift_id = db.Column(db.Integer, db.ForeignKey('shift.id'), nullable=True)
    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), default='Cash')
    payment_received = db.Column(db.Float, default=0.0)
    change_given = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    customer_name = db.Column(db.String(100), nullable=True)
    table_number = db.Column(db.String(20), nullable=True)

    # New fields for Kitchen/Bar tracking
    kitchen_status = db.Column(db.String(20), default='pending')  # pending, preparing, completed, none
    bar_status = db.Column(db.String(20), default='pending')      # pending, preparing, completed, none

    # Daily order sequence (P001, etc.)
    daily_order_number = db.Column(db.Integer, default=0)

    # Workflow status
    is_cleared = db.Column(db.Boolean, default=False) # If True, moves from History to Reports

    items = db.relationship('OrderItem', backref='order', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': f"P-{self.daily_order_number:03d}" if self.daily_order_number else f"P-{self.id:03d}",
            'total_amount': self.total_amount,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat(),
            'customer_name': self.customer_name,
            'table_number': self.table_number,
            'kitchen_status': self.kitchen_status,
            'bar_status': self.bar_status,
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False) # Snapshot of name
    price_at_sale = db.Column(db.Float, nullable=False) # Snapshot of price
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'product_id': self.product_id,
            'product_name': self.product_name,
            'price': self.price_at_sale,
            'quantity': self.quantity,
            'subtotal': self.subtotal
        }
