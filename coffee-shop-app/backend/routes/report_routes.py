from flask import Blueprint, jsonify, request
from extensions import db
from models import Order, OrderItem, Product, Shift
from sqlalchemy import func, desc

report_bp = Blueprint('report', __name__)

@report_bp.route('/dashboard', methods=['GET'])
def dashboard_stats():
    # Total Sales Today
    total_products = Product.query.filter_by(is_active=True).count()
    low_stock = Product.query.filter(Product.stock < 10, Product.is_active==True).count()

    # Recent orders (last 5)
    recent_orders = Order.query.order_by(desc(Order.created_at)).limit(5).all()

    return jsonify({
        'total_products': total_products,
        'low_stock': low_stock,
        'recent_orders': [o.to_dict() for o in recent_orders]
    })

@report_bp.route('/transactions', methods=['GET'])
def transaction_history():
    # Get all orders, ordered by date
    orders = Order.query.order_by(desc(Order.created_at)).limit(100).all() # Limit 100 for performance
    return jsonify([o.to_dict() for o in orders])

@report_bp.route('/sales', methods=['GET'])
def sales_report():
    shifts = Shift.query.order_by(desc(Shift.start_time)).limit(10).all()
    return jsonify([s.to_dict() for s in shifts])
