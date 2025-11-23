from flask import Blueprint, request, jsonify
from extensions import db
from models import Order, OrderItem, Product, Shift
from datetime import datetime, date
from sqlalchemy import func

pos_bp = Blueprint('pos', __name__)

@pos_bp.route('/orders', methods=['GET'])
def get_orders_history():
    # Simple history: Last 50 orders, descending
    orders = Order.query.order_by(Order.created_at.desc()).limit(50).all()
    return jsonify([o.to_dict() for o in orders])

@pos_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.json

    # Shift logic removed as requested
    shift_id = None

    # 1. Calculate actual total server-side
    calculated_total = 0.0
    order_items_data = []

    has_bar_items = False
    has_kitchen_items = False

    # Categories definitions
    bar_categories = ["Signature Coffee", "Classic Coffee", "Non-Coffee"]
    kitchen_categories = ["Snacks", "Main Course", "Dessert"]

    for item in data['items']:
        product = db.session.get(Product, item['id'])
        if product:
            # Check for negative or zero quantity
            if item['quantity'] <= 0:
                return jsonify({'error': f"Invalid quantity for product '{product.name}'. Must be > 0"}), 400

            # Check stock availability
            if product.stock < item['quantity']:
                return jsonify({'error': f"Insufficient stock for product '{product.name}'"}), 400

            subtotal = item['quantity'] * product.price
            calculated_total += subtotal

            # Check category for routing
            cat_name = product.category.name if product.category else ""
            if cat_name in bar_categories:
                has_bar_items = True
            elif cat_name in kitchen_categories:
                has_kitchen_items = True

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

    # 2. Determine Daily Order Number (Pxxx)
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    # Get max daily_order_number for orders created today
    max_order_num = db.session.query(func.max(Order.daily_order_number)).filter(Order.created_at >= today_start).scalar()
    new_daily_number = (max_order_num or 0) + 1

    # 3. Create order with calculated total & status
    new_order = Order(
        shift_id=shift_id,
        total_amount=calculated_total,  # Use calculated total
        payment_method=data.get('payment_method', 'Cash'),
        payment_received=payment_received,
        change_given=payment_received - calculated_total, # Recalculate change too
        customer_name=data.get('customer_name'),
        table_number=data.get('table_number'),
        daily_order_number=new_daily_number,
        kitchen_status='pending' if has_kitchen_items else 'none',
        bar_status='pending' if has_bar_items else 'none'
    )

    db.session.add(new_order)

    # 4. Add items and update stock
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
    return jsonify(new_order.to_dict()), 201

# --- New Routes for Kitchen & Bar ---

@pos_bp.route('/kitchen/orders', methods=['GET'])
def get_kitchen_orders():
    # Get orders where kitchen_status is NOT 'none' or 'completed'
    # We can also include 'completed' if we want to show history, but typically active orders only.
    # User asked for "preparing and complete", so let's show pending and preparing.
    orders = Order.query.filter(Order.kitchen_status.in_(['pending', 'preparing'])).order_by(Order.created_at).all()
    return jsonify([o.to_dict() for o in orders])

@pos_bp.route('/bar/orders', methods=['GET'])
def get_bar_orders():
    orders = Order.query.filter(Order.bar_status.in_(['pending', 'preparing'])).order_by(Order.created_at).all()
    return jsonify([o.to_dict() for o in orders])

@pos_bp.route('/orders/<int:order_id>/status', methods=['POST'])
def update_order_status(order_id):
    data = request.json
    role = data.get('role') # 'kitchen' or 'bar'
    status = data.get('status') # 'preparing' or 'completed'

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
    # Calculate revenue for "today" or "since last reset"
    # Since user asked for "reset", we can simulate a reset by querying orders
    # that haven't been "archived" or just use Today's logic.
    # Given the requirement: "laporan pendapatan setelah laporan history ke reset lagi"
    # Use simple logic: Calculate today's revenue.

    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    orders = Order.query.filter(Order.created_at >= today_start).all()

    total_revenue = sum(o.total_amount for o in orders)
    total_orders = len(orders)

    # We don't actually DELETE data (bad practice), but we return the summary.
    # The frontend can then "clear" its view.

    report = {
        'date': today.isoformat(),
        'total_revenue': total_revenue,
        'total_orders': total_orders
    }

    return jsonify(report)
