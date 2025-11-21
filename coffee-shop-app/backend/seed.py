from app import create_app
from extensions import db
from models import Category, Product

app = create_app()

def seed():
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        print("Seeding data...")

        # Categories
        cat_coffee = Category(name="Coffee")
        cat_non_coffee = Category(name="Non-Coffee")
        cat_snack = Category(name="Snack")
        cat_main = Category(name="Main Course")
        cat_dessert = Category(name="Dessert")

        db.session.add_all([cat_coffee, cat_non_coffee, cat_snack, cat_main, cat_dessert])
        db.session.commit()

        # Products
        products = [
            # Coffee
            Product(name="Espresso", price=18000, stock=100, category=cat_coffee, image_url="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300&h=200&fit=crop"),
            Product(name="Americano", price=20000, stock=100, category=cat_coffee, image_url="https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=300&h=200&fit=crop"),
            Product(name="Cappuccino", price=25000, stock=50, category=cat_coffee, image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop"),
            Product(name="Latte", price=28000, stock=60, category=cat_coffee, image_url="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&h=200&fit=crop"),
            Product(name="Caramel Macchiato", price=32000, stock=40, category=cat_coffee, image_url="https://images.unsplash.com/photo-1485808191679-5f8c7c8606af?w=300&h=200&fit=crop"),
            Product(name="Mocha", price=30000, stock=40, category=cat_coffee, image_url="https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=300&h=200&fit=crop"),

            # Non-Coffee
            Product(name="Matcha Latte", price=28000, stock=50, category=cat_non_coffee, image_url="https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=300&h=200&fit=crop"),
            Product(name="Chocolate", price=25000, stock=60, category=cat_non_coffee, image_url="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300&h=200&fit=crop"),
            Product(name="Lemon Tea", price=18000, stock=80, category=cat_non_coffee, image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&h=200&fit=crop"),
            Product(name="Lychee Tea", price=22000, stock=70, category=cat_non_coffee, image_url="https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=200&fit=crop"),

            # Snack
            Product(name="French Fries", price=20000, stock=50, category=cat_snack, image_url="https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&h=200&fit=crop"),
            Product(name="Onion Rings", price=22000, stock=40, category=cat_snack, image_url="https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&h=200&fit=crop"),
            Product(name="Croissant", price=22000, stock=30, category=cat_snack, image_url="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop"),
            Product(name="Cheese Toast", price=25000, stock=25, category=cat_snack, image_url="https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&h=200&fit=crop"),

            # Main Course
            Product(name="Nasi Goreng Special", price=35000, stock=30, category=cat_main, image_url="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop"),
            Product(name="Mie Goreng Jawa", price=32000, stock=30, category=cat_main, image_url="https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop"),
            Product(name="Spaghetti Carbonara", price=45000, stock=20, category=cat_main, image_url="https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&h=200&fit=crop"),
            Product(name="Chicken Katsu Rice", price=38000, stock=25, category=cat_main, image_url="https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&h=200&fit=crop"),

            # Dessert
            Product(name="Cheesecake", price=30000, stock=15, category=cat_dessert, image_url="https://images.unsplash.com/photo-1524351199678-c41d621572e1?w=300&h=200&fit=crop"),
            Product(name="Chocolate Lava Cake", price=35000, stock=15, category=cat_dessert, image_url="https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop"),
            Product(name="Waffle Ice Cream", price=32000, stock=20, category=cat_dessert, image_url="https://images.unsplash.com/photo-1562516042-b9d94676926f?w=300&h=200&fit=crop"),
        ]

        db.session.add_all(products)
        db.session.commit()

        print("Seeding complete!")

if __name__ == '__main__':
    seed()
