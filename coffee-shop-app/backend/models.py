from datetime import datetime
from extensions import db

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {'id': self.id, 'name': self.name}

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    role = db.relationship('Role', backref=db.backref('users', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role.name,
            'role_id': self.role_id
        }

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'name': self.name}

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(15, 2), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

    is_inventory_managed = db.Column(db.Boolean, default=False)
    stock_quantity = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship('Category', backref=db.backref('products', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price),
            'category': self.category.name,
            'category_id': self.category_id,
            'image_url': self.image_url,
            'is_inventory_managed': self.is_inventory_managed,
            'stock_quantity': self.stock_quantity,
            'is_active': self.is_active
        }

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_code = db.Column(db.String(20), unique=True, nullable=False)

    total_amount = db.Column(db.Numeric(15, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    amount_received = db.Column(db.Numeric(15, 2), nullable=True)
    change_amount = db.Column(db.Numeric(15, 2), nullable=True)

    status = db.Column(db.Enum('pending', 'paid', 'cancelled', name='order_status'), default='pending')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('orders', lazy=True))
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_code': self.transaction_code,
            'total_amount': float(self.total_amount),
            'payment_method': self.payment_method,
            'amount_received': float(self.amount_received) if self.amount_received else 0,
            'change_amount': float(self.change_amount) if self.change_amount else 0,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'cashier': self.user.username,
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)

    product_name_snapshot = db.Column(db.String(100), nullable=False)
    price_snapshot = db.Column(db.Numeric(15, 2), nullable=False)
    cost_snapshot = db.Column(db.Numeric(15, 2), default=0)

    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Numeric(15, 2), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name_snapshot,
            'price': float(self.price_snapshot),
            'quantity': self.quantity,
            'subtotal': float(self.subtotal)
        }
