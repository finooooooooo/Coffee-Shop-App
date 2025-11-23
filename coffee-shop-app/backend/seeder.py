from extensions import db
from models import Category, Product, User

def seed_database():
    # Only seed if no users exist
    if User.query.first():
        print("Database already seeded.")
        return

    print("Seeding database...")

    # We do NOT drop all tables here, as this is auto-run on startup.
    # We only add missing data.

    # Users
    admin = User.query.filter_by(username="Admin").first()
    if not admin:
        admin = User(username="Admin", password="admin", role="admin")
        db.session.add(admin)

    cashier = User.query.filter_by(username="Kasir").first()
    if not cashier:
        cashier = User(username="Kasir", password="kasir", role="cashier")
        db.session.add(cashier)

    # Categories (English backend names, can be mapped to ID in frontend if needed)
    cats = {}
    cat_names = ["Signature Coffee", "Classic Coffee", "Non-Coffee", "Snacks", "Main Course", "Dessert"]

    for name in cat_names:
        cat = Category.query.filter_by(name=name).first()
        if not cat:
            cat = Category(name=name)
            db.session.add(cat)
        cats[name] = cat

    db.session.commit() # Commit to get IDs

    # Products
    # For products, we just check if any products exist. If not, we seed.
    if not Product.query.first():
        products = [
            # Signature
            Product(name="Kopi Gula Aren", price=22000, stock=100, category=cats["Signature Coffee"],
                    image_url="https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&h=200&fit=crop"),
            Product(name="Caramel Macchiato", price=28000, stock=80, category=cats["Signature Coffee"],
                    image_url="https://images.unsplash.com/photo-1485808191679-5f86510c7f5a?w=300&h=200&fit=crop"),

            # Classic
            Product(name="Espresso", price=15000, stock=50, category=cats["Classic Coffee"],
                    image_url="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300&h=200&fit=crop"),
            Product(name="Americano", price=18000, stock=50, category=cats["Classic Coffee"],
                    image_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop"),
            Product(name="Cappuccino", price=24000, stock=50, category=cats["Classic Coffee"],
                    image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop"),
            Product(name="Caffe Latte", price=24000, stock=50, category=cats["Classic Coffee"],
                    image_url="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&h=200&fit=crop"),

            # Non-Coffee
            Product(name="Matcha Latte", price=26000, stock=40, category=cats["Non-Coffee"],
                    image_url="https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=300&h=200&fit=crop"),
            Product(name="Chocolate", price=24000, stock=40, category=cats["Non-Coffee"],
                    image_url="https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop"),
            Product(name="Lemon Tea", price=18000, stock=50, category=cats["Non-Coffee"],
                    image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&h=200&fit=crop"),

            # Snacks
            Product(name="French Fries", price=20000, stock=30, category=cats["Snacks"],
                    image_url="https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&h=200&fit=crop"),
            Product(name="Onion Rings", price=22000, stock=20, category=cats["Snacks"],
                    image_url="https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&h=200&fit=crop"),
            Product(name="Croissant", price=22000, stock=15, category=cats["Snacks"],
                    image_url="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop"),

            # Main Course
            Product(name="Nasi Goreng", price=30000, stock=20, category=cats["Main Course"],
                    image_url="https://images.unsplash.com/photo-1603133872878-684f5714398e?w=300&h=200&fit=crop"),
            Product(name="Mie Goreng", price=28000, stock=20, category=cats["Main Course"],
                    image_url="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&h=200&fit=crop"),
            Product(name="Spaghetti Carbonara", price=35000, stock=15, category=cats["Main Course"],
                    image_url="https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&h=200&fit=crop"),

            # Dessert
            Product(name="Cheesecake", price=28000, stock=15, category=cats["Dessert"],
                    image_url="https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=300&h=200&fit=crop"),
            Product(name="Tiramisu", price=30000, stock=15, category=cats["Dessert"],
                    image_url="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop"),
            Product(name="Ice Cream Scoop", price=15000, stock=30, category=cats["Dessert"],
                    image_url="https://images.unsplash.com/photo-1560008581-09826d1de69e?w=300&h=200&fit=crop"),
        ]
        db.session.add_all(products)

    db.session.commit()
    print("Auto-seed complete.")
