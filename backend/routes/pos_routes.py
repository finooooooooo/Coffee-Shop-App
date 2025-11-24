from flask import Blueprint, request, jsonify
from extensions import db
from models import Order, OrderItem, Product
from datetime import datetime, date
from sqlalchemy import func
import os
from utils.sorter import merge_sort

# Create a Blueprint (a modular group of routes)
pos_bp = Blueprint('pos', __name__)

# --- UTILITY: RECEIPT GENERATOR ---
def generate_struct_file(order):
    """
    Generates a physical text file receipt for the order.
    File is saved to 'backend/Struct/' folder.
    """
    try:
        # Define path
        struct_dir = os.path.join(os.getcwd(), 'backend', 'Struct')
        if not os.path.exists(struct_dir):
            os.makedirs(struct_dir)

        # Generate Filename: Struct_P-XXX_Timestamp.txt
        order_id_str = f"P-{order.daily_order_number:03d}"
        filename = f"Struct_{order_id_str}_{int(datetime.now().timestamp())}.txt"
        filepath = os.path.join(struct_dir, filename)

        # Write Content
        with open(filepath, 'w') as f:
            f.write("========================================\n")
            f.write("              COFFEE SHOP               \n")
            f.write("========================================\n")
            f.write(f"Order ID: {order_id_str}\n")
            f.write(f"Date:     {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("----------------------------------------\n")
            f.write(f"{'Item':<20} {'Qty':<5} {'Price':>10}\n")
            f.write("----------------------------------------\n")
            for item in order.items:
                f.write(f"{item.product_name:<20} {item.quantity:<5} {item.price_at_sale:>10,.0f}\n")
            f.write("----------------------------------------\n")
            f.write(f"Total:                  {order.total_amount:>10,.0f}\n")
            f.write(f"Payment ({order.payment_method}):    {order.payment_received:>10,.0f}\n")
            f.write(f"Change:                 {order.change_given:>10,.0f}\n")
            f.write("========================================\n")
            f.write("          THANK YOU FOR VISITING        \n")
            f.write("========================================\n")

        print(f"Receipt generated: {filepath}")
    except Exception as e:
        print(f"Error generating struct file: {e}")

# --- ROUTES ---

@pos_bp.route('/products', methods=['GET'])
def get_products():
    """
    Fetch products and apply Merge Sort.
    Query params: sort_by (name/price), order (asc/desc)
    """
    sort_by = request.args.get('sort_by', 'name')
    order = request.args.get('order', 'asc')
    reverse = (order == 'desc')

    # 1. Fetch from DB
    products = Product.query.filter_by(is_active=True).all()
    product_list = [p.to_dict() for p in products]

    # 2. Apply Custom Sorting Algorithm
    sorted_products = merge_sort(product_list, key=sort_by, reverse=reverse)

    return jsonify(sorted_products)

@pos_bp.route('/orders', methods=['POST'])
def create_order():
    """
    Create a new order, calculate totals, update stock, and generate receipt.
    """
    data = request.json
    calculated_total = 0.0
    order_items_objs = []

    # 1. Validate Items & Stock
    for item in data['items']:
        product = db.session.get(Product, item['id'])
        if not product:
             return jsonify({'error': f"Product {item['id']} not found"}), 404

        if product.stock < item['quantity']:
             return jsonify({'error': f"Insufficient stock for {product.name}"}), 400

        subtotal = item['quantity'] * product.price
        calculated_total += subtotal

        # Prepare item object (but don't add to session yet)
        order_items_objs.append({
            'product': product,
            'quantity': item['quantity'],
            'subtotal': subtotal
        })

    # 2. Validate Payment
    payment_received = float(data.get('payment_received', 0))
    if payment_received < calculated_total:
        return jsonify({'error': 'Insufficient payment'}), 400

    # 3. Generate Daily Order ID (P-XXX)
    today_start = datetime.combine(date.today(), datetime.min.time())
    max_order = db.session.query(func.max(Order.daily_order_number))\
        .filter(Order.created_at >= today_start).scalar()
    new_number = (max_order or 0) + 1

    # 4. Create Order
    new_order = Order(
        daily_order_number=new_number,
        total_amount=calculated_total,
        payment_method=data.get('payment_method', 'Cash'),
        payment_received=payment_received,
        change_given=payment_received - calculated_total,
        customer_name=data.get('customer_name', 'Walk-in')
    )
    db.session.add(new_order)

    # 5. Add Items & Deduct Stock
    for obj in order_items_objs:
        p = obj['product']
        oi = OrderItem(
            order=new_order,
            product_id=p.id,
            product_name=p.name,
            price_at_sale=p.price,
            quantity=obj['quantity'],
            subtotal=obj['subtotal']
        )
        db.session.add(oi)
        p.stock -= obj['quantity'] # Deduct stock

    db.session.commit()

    # 6. Generate Receipt File
    generate_struct_file(new_order)

    return jsonify(new_order.to_dict()), 201
