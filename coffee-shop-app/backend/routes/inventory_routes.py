from flask import Blueprint, request, jsonify
from extensions import db
from models import Product, Category

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/products', methods=['GET'])
def get_products():
    products = Product.query.filter_by(is_active=True).all()
    return jsonify([p.to_dict() for p in products])

@inventory_bp.route('/products', methods=['POST'])
def add_product():
    data = request.json

    if data['price'] < 0:
        return jsonify({'error': 'Price cannot be negative'}), 400

    new_product = Product(
        name=data['name'],
        price=data['price'],
        stock=data.get('stock', 0),
        category_id=data.get('category_id'),
        image_url=data.get('image_url')
    )
    db.session.add(new_product)
    db.session.commit()
    return jsonify(new_product.to_dict()), 201

@inventory_bp.route('/products/<int:id>', methods=['PUT'])
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.json

    if 'price' in data and data['price'] < 0:
        return jsonify({'error': 'Price cannot be negative'}), 400

    product.name = data.get('name', product.name)
    product.price = data.get('price', product.price)
    product.stock = data.get('stock', product.stock)
    product.category_id = data.get('category_id', product.category_id)
    product.image_url = data.get('image_url', product.image_url)
    db.session.commit()
    return jsonify(product.to_dict())

@inventory_bp.route('/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = Product.query.get_or_404(id)
    product.is_active = False # Soft delete
    db.session.commit()
    return jsonify({'message': 'Product deleted'})

@inventory_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])
