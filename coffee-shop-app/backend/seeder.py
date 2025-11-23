from extensions import db
from models import Category, Product, User
from product_data import products_data

def seed_database():
    # Only seed if no users exist
    if User.query.first():
        print("Database already seeded. Checking for missing products...")
        # Optional: We could update products here if we wanted to enforce image updates on restart
        # For now, let's keep it simple: if users exist, assume initialized.
        # But user wants to easily update images, so let's allow updating products if they exist.
        pass

    print("Seeding/Updating database...")

    # Users
    admin = User.query.filter_by(username="Admin").first()
    if not admin:
        admin = User(username="Admin", password="admin", role="admin")
        db.session.add(admin)

    cashier = User.query.filter_by(username="Kasir").first()
    if not cashier:
        cashier = User(username="Kasir", password="kasir", role="cashier")
        db.session.add(cashier)

    # Categories
    cats = {}

    for cat_name in products_data.keys():
        cat = Category.query.filter_by(name=cat_name).first()
        if not cat:
            cat = Category(name=cat_name)
            db.session.add(cat)
        cats[cat_name] = cat

    db.session.commit() # Commit to get IDs

    # Products
    for cat_name, items in products_data.items():
        category = cats[cat_name]
        for item in items:
            product = Product.query.filter_by(name=item['name']).first()
            if product:
                # Update existing product (allows easy image updates)
                product.image_url = item['image_url']
                # We could update price/stock too if desired, but maybe user changed them.
                # Let's update image_url specifically as requested.
            else:
                # Create new
                product = Product(
                    name=item['name'],
                    price=item['price'],
                    stock=item['stock'],
                    category=category,
                    image_url=item['image_url']
                )
                db.session.add(product)

    db.session.commit()
    print("Auto-seed/Update complete.")
