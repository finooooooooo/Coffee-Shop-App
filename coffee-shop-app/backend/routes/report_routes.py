from flask import Blueprint, jsonify, request
from extensions import db
from models import Order, Product, Shift
from sqlalchemy import func

report_bp = Blueprint('report', __name__)

@report_bp.route('/dashboard', methods=['GET'])
def dashboard_stats():
    # Total Sales Today
    today = func.date(func.now())
    # SQLite syntax might differ for date, but using python processing for simplicity if needed
    # or use standard SQL ALchemy filters

    total_products = Product.query.filter_by(is_active=True).count()
    low_stock = Product.query.filter(Product.stock < 10, Product.is_active==True).count()

    # Recent orders
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()

    return jsonify({
        'total_products': total_products,
        'low_stock': low_stock,
        'recent_orders': [o.to_dict() for o in recent_orders]
    })

@report_bp.route('/sales', methods=['GET'])
def sales_report():
    # Simple logic: get all shifts
    shifts = Shift.query.order_by(Shift.start_time.desc()).limit(10).all()
    return jsonify([s.to_dict() for s in shifts])
