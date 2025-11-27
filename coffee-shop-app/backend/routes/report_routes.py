from flask import Blueprint, jsonify, request
from extensions import db
from models import Order, Product
from sqlalchemy import func, desc
from datetime import datetime, date

report_bp = Blueprint('report', __name__)

@report_bp.route('/dashboard', methods=['GET'])
def dashboard_stats():
    # Total Products
    total_products = Product.query.filter_by(is_active=True).count()

    # Low Stock (Only for Inventory Managed items)
    low_stock = Product.query.filter(
        Product.is_inventory_managed == True,
        Product.stock_quantity < 10,
        Product.is_active == True
    ).count()

    # Recent orders (last 5)
    recent_orders = Order.query.order_by(desc(Order.created_at)).limit(5).all()

    return jsonify({
        'total_products': total_products,
        'low_stock': low_stock,
        'recent_orders': [o.to_dict() for o in recent_orders]
    })

@report_bp.route('/transactions', methods=['GET'])
def transaction_history():
    """
    Returns transaction history with Date Filtering.
    Params: start_date, end_date (YYYY-MM-DD)
    """
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    query = Order.query

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            query = query.filter(Order.created_at >= start_date)
        except ValueError:
            pass # Ignore invalid date

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            # Add 1 day to include the end date fully (or set to 23:59:59)
            query = query.filter(Order.created_at < end_date.replace(hour=23, minute=59, second=59))
        except ValueError:
            pass

    # Show only Paid (completed) transactions? Or all including cancelled?
    # Usually reports show valid sales.
    # query = query.filter(Order.status == 'paid')

    orders = query.order_by(desc(Order.created_at)).limit(200).all()

    return jsonify([o.to_dict() for o in orders])
