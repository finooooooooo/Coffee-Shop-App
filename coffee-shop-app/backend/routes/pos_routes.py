from flask import Blueprint, request, jsonify
from extensions import db
from models import Order, OrderItem, Product, Shift
from datetime import datetime, date
from sqlalchemy import func
import os
from utils.sorter import merge_sort

pos_bp = Blueprint('pos', __name__)

@pos_bp.route('/products/sorted', methods=['GET'])
def get_products_sorted():
    """
    Fetches all active products and sorts them using the custom Merge Sort algorithm.
    Query Params:
      - sort_by: 'price' or 'name' (default: 'name')
      - order: 'asc' or 'desc' (default: 'asc')
    """
    sort_by = request.args.get('sort_by', 'name')
    order = request.args.get('order', 'asc')
    reverse = (order == 'desc')

    products = Product.query.filter_by(is_active=True).all()
    product_list = [p.to_dict() for p in products]

    # Use the custom Merge Sort algorithm
    # Note: 'price' is float, 'name' is string. Both are comparable in Python.
    sorted_products = merge_sort(product_list, key=sort_by, reverse=reverse)

    return jsonify(sorted_products)

@pos_bp.route('/orders', methods=['GET'])
def get_orders_history():
    # Simple history: Last 50 orders, descending
    orders = Order.query.order_by(Order.created_at.desc()).limit(50).all()
    return jsonify([o.to_dict() for o in orders])

def generate_struct_file(order):
    """
    Generates a receipt text file in the backend/Struct directory.
    Format: Struct_P-XXX_Timestamp.txt
    """
    try:
        struct_dir = os.path.join(os.getcwd(), 'backend', 'Struct') # Assumes running from root
        if not os.path.exists(struct_dir):
            os.makedirs(struct_dir)

        order_id_str = f"P-{order.daily_order_number:03d}"
        filename = f"Struct_{order_id_str}_{int(datetime.now().timestamp())}.txt"
        filepath = os.path.join(struct_dir, filename)

        with open(filepath, 'w') as f:
            f.write("========================================\n")
            f.write("              COFFEE SHOP               \n")
            f.write("========================================\n")
            f.write(f"Order ID: {order_id_str}\n")
            f.write(f"Date:     {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Customer: {order.customer_name or 'Walk-in'}\n")
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

        print(f"Struct generated: {filepath}")
    except Exception as e:
        print(f"Error generating struct file: {e}")

@pos_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    shift_id = None
    calculated_total = 0.0
    order_items_data = []

    # Kitchen/Bar logic removed, simplified statuses to 'none'

    for item in data['items']:
        product = db.session.get(Product, item['id'])
        if product:
            if not product.is_active:
                return jsonify({'error': f"Product '{product.name}' is no longer available"}), 400
            if item['quantity'] <= 0:
                return jsonify({'error': f"Invalid quantity for product '{product.name}'. Must be > 0"}), 400
            if product.stock < item['quantity']:
                return jsonify({'error': f"Insufficient stock for product '{product.name}'"}), 400

            subtotal = item['quantity'] * product.price
            calculated_total += subtotal

            order_items_data.append({
                'product': product,
                'quantity': item['quantity'],
                'subtotal': subtotal
            })
        else:
            return jsonify({'error': f"Product with id {item['id']} not found"}), 404

    payment_received = data.get('payment_received', 0)
    if payment_received < calculated_total:
        return jsonify({'error': f"Insufficient payment. Expected {calculated_total}, received {payment_received}"}), 400

    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    max_order_num = db.session.query(func.max(Order.daily_order_number)).filter(Order.created_at >= today_start).scalar()
    new_daily_number = (max_order_num or 0) + 1

    new_order = Order(
        shift_id=shift_id,
        total_amount=calculated_total,
        payment_method=data.get('payment_method', 'Cash'),
        payment_received=payment_received,
        change_given=payment_received - calculated_total,
        customer_name=data.get('customer_name'),
        table_number=data.get('table_number'),
        daily_order_number=new_daily_number,
        kitchen_status='none', # Kitchen display removed
        bar_status='none'      # Bar display removed
    )

    db.session.add(new_order)

    for item_data in order_items_data:
        product = item_data['product']
        order_item = OrderItem(
            order=new_order,
            product_id=product.id,
            product_name=product.name,
            price_at_sale=product.price,
            quantity=item_data['quantity'],
            subtotal=item_data['subtotal']
        )
        db.session.add(order_item)
        product.stock -= item_data['quantity']

    db.session.commit()

    # Generate the physical struct file
    generate_struct_file(new_order)

    return jsonify(new_order.to_dict()), 201

@pos_bp.route('/orders/<int:order_id>/status', methods=['POST'])
def update_order_status(order_id):
    data = request.json
    role = data.get('role')
    status = data.get('status')

    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if role == 'kitchen':
        order.kitchen_status = status
    elif role == 'bar':
        order.bar_status = status
    else:
        return jsonify({'error': 'Invalid role'}), 400

    db.session.commit()
    return jsonify(order.to_dict())

@pos_bp.route('/shift/close', methods=['POST'])
def close_shift_report():
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    orders = Order.query.filter(Order.created_at >= today_start).all()
    total_revenue = sum(o.total_amount for o in orders)
    total_orders = len(orders)
    report = {
        'date': today.isoformat(),
        'total_revenue': total_revenue,
        'total_orders': total_orders
    }
    return jsonify(report)
