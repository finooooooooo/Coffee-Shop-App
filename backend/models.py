from datetime import datetime
from extensions import db

class User(db.Model):
    """
    Represents a system user (Admin or Cashier).
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    # In a real app, ALWAYS hash passwords. For this demo/learning, plain text is used.
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'admin' or 'cashier'

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'role': self.role}

class Category(db.Model):
    """
    Product categories (e.g., Makanan Berat, Minuman Dingin).
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name}

class Product(db.Model):
    """
    Represents an item on the menu.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    # Foreign Key linking to Category
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'stock': self.stock,
            'category': self.category.name if self.category else None,
            'image_url': self.image_url
        }

class Order(db.Model):
    """
    Represents a completed transaction.
    """
    id = db.Column(db.Integer, primary_key=True)
    # Daily running number for IDs like P-001
    daily_order_number = db.Column(db.Integer, default=0)

    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), default='Cash')
    payment_received = db.Column(db.Float, default=0.0)
    change_given = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    customer_name = db.Column(db.String(100), nullable=True)

    # Relationship to items
    items = db.relationship('OrderItem', backref='order', lazy=True)

    def to_dict(self):
        # Format the ID as P-XXX
        formatted_id = f"P-{self.daily_order_number:03d}" if self.daily_order_number else f"P-{self.id:03d}"
        return {
            'id': self.id,
            'order_id': formatted_id,
            'total_amount': self.total_amount,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    """
    Individual items within an order (Snapshot of data).
    """
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)

    # We store the name and price at the time of sale, in case they change later.
    product_name = db.Column(db.String(100), nullable=False)
    price_at_sale = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'product_name': self.product_name,
            'price': self.price_at_sale,
            'quantity': self.quantity,
            'subtotal': self.subtotal
        }
