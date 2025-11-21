from app import create_app
from extensions import db
from models import Category, Product

app = create_app()

def seed():
    with app.app_context():
        print(f"DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        print("Seeding data...")

        # Categories
        cat_drinks = Category(name="Minuman")
        cat_food = Category(name="Makanan")
        cat_dessert = Category(name="Dessert")

        db.session.add_all([cat_drinks, cat_food, cat_dessert])

        # Products
        products = [
            Product(name="Espresso", price=18000, stock=100, category=cat_drinks, image_url="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300&h=200&fit=crop"),
            Product(name="Cappuccino", price=25000, stock=50, category=cat_drinks, image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop"),
            Product(name="Iced Latte", price=28000, stock=60, category=cat_drinks, image_url="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&h=200&fit=crop"),
            Product(name="Croissant", price=22000, stock=30, category=cat_food, image_url="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop"),
            Product(name="Sandwich", price=35000, stock=20, category=cat_food, image_url="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop"),
            Product(name="Cheesecake", price=30000, stock=15, category=cat_dessert, image_url="https://images.unsplash.com/photo-1524351199678-c41d621572e1?w=300&h=200&fit=crop"),
        ]

        db.session.add_all(products)
        db.session.commit()

        print("Seeding complete!")

if __name__ == '__main__':
    seed()
