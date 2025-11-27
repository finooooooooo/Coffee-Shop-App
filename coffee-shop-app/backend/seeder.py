from extensions import db
from models import Category, Product, User, Role

def seed_database():
    # Only seed if no roles exist (first run logic)
    if Role.query.first():
        print("Database already seeded (Roles exist).")
        return

    print("Seeding database with strict schema...")

    # 1. Roles
    admin_role = Role(name="admin")
    cashier_role = Role(name="cashier")
    db.session.add(admin_role)
    db.session.add(cashier_role)
    db.session.commit() # Commit to get IDs

    # 2. Users
    # Admin
    admin_user = User.query.filter_by(username="Admin").first()
    if not admin_user:
        admin_user = User(
            username="Admin",
            password_hash="admin", # In real app, hash this!
            role_id=admin_role.id,
            full_name="Administrator"
        )
        db.session.add(admin_user)

    # Cashier
    cashier_user = User.query.filter_by(username="Kasir").first()
    if not cashier_user:
        cashier_user = User(
            username="Kasir",
            password_hash="kasir", # In real app, hash this!
            role_id=cashier_role.id,
            full_name="Staff Kasir"
        )
        db.session.add(cashier_user)

    db.session.commit()

    # 3. Categories
    cats = {}
    cat_names = ["Signature Coffee", "Classic Coffee", "Non-Coffee", "Snacks", "Main Course", "Dessert"]

    for name in cat_names:
        cat = Category(name=name)
        db.session.add(cat)
        cats[name] = cat

    db.session.commit()

    # 4. Products
    # Logic: Food/Dessert -> Kitchen Managed (is_inventory_managed=False)
    # Drinks/Snacks -> Retail Managed (is_inventory_managed=True)

    products = []

    # Signature Coffee (Drink -> Stock Managed)
    products.append(Product(name="Kopi Gula Aren", price=22000, is_inventory_managed=True, stock_quantity=100, category=cats["Signature Coffee"], image_url="https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&h=200&fit=crop"))
    products.append(Product(name="Caramel Macchiato", price=28000, is_inventory_managed=True, stock_quantity=80, category=cats["Signature Coffee"], image_url="https://images.unsplash.com/photo-1485808191679-5f86510c7f5a?w=300&h=200&fit=crop"))

    # Classic Coffee (Drink -> Stock Managed)
    products.append(Product(name="Espresso", price=15000, is_inventory_managed=True, stock_quantity=50, category=cats["Classic Coffee"], image_url="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300&h=200&fit=crop"))
    products.append(Product(name="Americano", price=18000, is_inventory_managed=True, stock_quantity=50, category=cats["Classic Coffee"], image_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop"))
    products.append(Product(name="Cappuccino", price=24000, is_inventory_managed=True, stock_quantity=50, category=cats["Classic Coffee"], image_url="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop"))
    products.append(Product(name="Caffe Latte", price=24000, is_inventory_managed=True, stock_quantity=50, category=cats["Classic Coffee"], image_url="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&h=200&fit=crop"))

    # Non-Coffee (Drink -> Stock Managed)
    products.append(Product(name="Matcha Latte", price=26000, is_inventory_managed=True, stock_quantity=40, category=cats["Non-Coffee"], image_url="https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=300&h=200&fit=crop"))
    products.append(Product(name="Chocolate", price=24000, is_inventory_managed=True, stock_quantity=40, category=cats["Non-Coffee"], image_url="https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop"))
    products.append(Product(name="Lemon Tea", price=18000, is_inventory_managed=True, stock_quantity=50, category=cats["Non-Coffee"], image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&h=200&fit=crop"))

    # Snacks (Retail -> Stock Managed)
    products.append(Product(name="French Fries", price=20000, is_inventory_managed=True, stock_quantity=30, category=cats["Snacks"], image_url="https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&h=200&fit=crop"))
    products.append(Product(name="Onion Rings", price=22000, is_inventory_managed=True, stock_quantity=20, category=cats["Snacks"], image_url="https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&h=200&fit=crop"))
    products.append(Product(name="Croissant", price=22000, is_inventory_managed=True, stock_quantity=15, category=cats["Snacks"], image_url="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop"))

    # Main Course (Kitchen -> Manual Availability)
    products.append(Product(name="Nasi Goreng", price=30000, is_inventory_managed=False, category=cats["Main Course"], image_url="https://images.unsplash.com/photo-1603133872878-684f5714398e?w=300&h=200&fit=crop"))
    products.append(Product(name="Mie Goreng", price=28000, is_inventory_managed=False, category=cats["Main Course"], image_url="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&h=200&fit=crop"))
    products.append(Product(name="Spaghetti Carbonara", price=35000, is_inventory_managed=False, category=cats["Main Course"], image_url="https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&h=200&fit=crop"))

    # Dessert (Kitchen -> Manual Availability)
    products.append(Product(name="Cheesecake", price=28000, is_inventory_managed=False, category=cats["Dessert"], image_url="https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=300&h=200&fit=crop"))
    products.append(Product(name="Tiramisu", price=30000, is_inventory_managed=False, category=cats["Dessert"], image_url="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop"))
    products.append(Product(name="Ice Cream Scoop", price=15000, is_inventory_managed=False, category=cats["Dessert"], image_url="https://images.unsplash.com/photo-1560008581-09826d1de69e?w=300&h=200&fit=crop"))

    db.session.add_all(products)
    db.session.commit()
    print("Strict Schema Seed complete.")
