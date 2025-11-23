from flask import Blueprint, request, jsonify
from extensions import db
from models import Order, OrderItem, Product, Shift
from datetime import datetime

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

    # 2. Create order with calculated total
    new_order = Order(
        shift_id=shift_id,
        total_amount=calculated_total,  # Use calculated total
        payment_method=data.get('payment_method', 'Cash'),
        payment_received=payment_received,
        change_given=payment_received - calculated_total, # Recalculate change too
        customer_name=data.get('customer_name'),
        table_number=data.get('table_number')
    )

    db.session.add(new_order)

    # 3. Add items and update stock
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

    # Shift sales tracking removed

    db.session.commit()
    return jsonify(new_order.to_dict()), 201
