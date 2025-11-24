from flask import Flask
from config import Config
from extensions import db, cors

def create_app():
    """
    App Factory function.
    Initializes Flask, Database, and registers Blueprints.
    """
    app = Flask(__name__, static_folder='../frontend', static_url_path='/')
    app.config.from_object(Config)

    # Initialize Plugins
    db.init_app(app)
    cors.init_app(app)

    # Register Routes
    from routes.pos_routes import pos_bp
    from routes.auth_routes import auth_bp

    app.register_blueprint(pos_bp, url_prefix='/api/pos')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # Serve Frontend
    @app.route('/')
    def index():
        return app.send_static_file('index.html')

    # Create Tables & Seed Data if empty
    with app.app_context():
        db.create_all()
        seed_data()

    return app

def seed_data():
    """
    Populates the database with initial data if it's empty.
    """
    from models import User, Product, Category

    if User.query.first():
        return # Already seeded

    print("Seeding database...")

    # Users
    admin = User(username='admin', password='admin', role='admin')
    cashier = User(username='kasir', password='kasir', role='cashier')
    db.session.add_all([admin, cashier])

    # Categories
    cats = {
        'Main Course': Category(name='Main Course'),
        'Snacks': Category(name='Snacks'),
        'Classic Coffee': Category(name='Classic Coffee'),
        'Signature Coffee': Category(name='Signature Coffee')
    }
    for c in cats.values():
        db.session.add(c)

    db.session.commit() # Commit categories to get IDs

    # Products
    products = [
        Product(name='Nasi Goreng Seafood', price=25000, stock=100, category=cats['Main Course']),
        Product(name='French Fries', price=15000, stock=100, category=cats['Snacks']),
        Product(name='Espresso', price=20000, stock=100, category=cats['Classic Coffee']),
        Product(name='Red Velvet Milkshake', price=22000, stock=100, category=cats['Signature Coffee']),
        Product(name='Mac & Cheese', price=50000, stock=50, category=cats['Main Course']),
        Product(name='Almond Croissant', price=36000, stock=40, category=cats['Snacks'])
    ]
    db.session.add_all(products)
    db.session.commit()
    print("Database seeded!")

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
