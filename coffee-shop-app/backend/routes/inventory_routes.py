from flask import Blueprint, request, jsonify
from extensions import db
from models import Product, Category

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/products', methods=['GET'])
def get_products():
    # Only return Active products
    # Optionally accept query param to show all for admin?
    # For now, adhering to existing logic: filter_by(is_active=True)
    products = Product.query.filter_by(is_active=True).all()
    return jsonify([p.to_dict() for p in products])

@inventory_bp.route('/products', methods=['POST'])
def add_product():
    data = request.json

    if float(data.get('price', 0)) < 0:
        return jsonify({'error': 'Price cannot be negative'}), 400

    # Strictly enforce category_id
    cat_id = data.get('category_id')
    if not cat_id:
        # Try to resolve by name if provided (legacy compat) or fail
        cat_name = data.get('category')
        if cat_name:
            cat = Category.query.filter_by(name=cat_name).first()
            if cat:
                cat_id = cat.id

    if not cat_id:
        return jsonify({'error': 'Category ID is required'}), 400

    new_product = Product(
        name=data['name'],
        price=data['price'],
        category_id=cat_id,
        image_url=data.get('image_url'),

        is_inventory_managed=data.get('is_inventory_managed', False),
        stock_quantity=data.get('stock_quantity', 0),
        is_active=True
    )
    db.session.add(new_product)
    db.session.commit()
    return jsonify(new_product.to_dict()), 201

@inventory_bp.route('/products/<int:id>', methods=['PUT'])
def update_product(id):
    product = db.session.get(Product, id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.json

    if 'price' in data and float(data['price']) < 0:
        return jsonify({'error': 'Price cannot be negative'}), 400

    product.name = data.get('name', product.name)
    product.price = data.get('price', product.price)

    if 'category_id' in data:
        product.category_id = data['category_id']
    elif 'category' in data: # name fallback
         cat = Category.query.filter_by(name=data['category']).first()
         if cat: product.category_id = cat.id

    product.image_url = data.get('image_url', product.image_url)

    # Inventory Updates
    if 'is_inventory_managed' in data:
        product.is_inventory_managed = data['is_inventory_managed']

    if 'stock_quantity' in data:
        product.stock_quantity = data['stock_quantity']

        # Auto-activate if stock added?
        if product.is_inventory_managed and product.stock_quantity > 0:
            product.is_active = True

    # Manual Active Toggle (Mainly for Kitchen items)
    if 'is_active' in data:
        product.is_active = data['is_active']

    db.session.commit()
    return jsonify(product.to_dict())

@inventory_bp.route('/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = db.session.get(Product, id)
    if not product:
         return jsonify({'error': 'Product not found'}), 404

    product.is_active = False # Soft delete
    db.session.commit()
    return jsonify({'message': 'Product deactivated'})

@inventory_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])
