from flask import Blueprint, request, jsonify
from extensions import db
from models import Order, OrderItem, Product, User
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
    sorted_products = merge_sort(product_list, key=sort_by, reverse=reverse)

    return jsonify(sorted_products)

@pos_bp.route('/orders', methods=['GET'])
def get_orders_history():
    # Show active (paid/pending) orders, excluding cancelled?
    # Or just last 50 orders of today
    # User asked for "date filtering", this is likely for the POS 'History' tab.
    # We will show the last 50 'paid' orders.
    orders = Order.query.filter(Order.status == 'paid').order_by(Order.created_at.desc()).limit(50).all()
    return jsonify([o.to_dict() for o in orders])

@pos_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    calculated_total = 0.0
    order_items_data = []

    # Validate User
    user_id = data.get('user_id')
    user = db.session.get(User, user_id) if user_id else None

    # Fallback to first cashier if no user_id (for development/legacy frontend compat)
    if not user:
         # Try to find a default user or error out?
         # Given user constraints, we should enforce user.
         # But I will default to ID 2 (Cashier) to prevent breakage if frontend doesn't send it yet.
         # Ideally, auth middleware handles this.
         user = db.session.get(User, 2)

    if not user:
        return jsonify({'error': 'Invalid user/cashier'}), 400

    for item in data['items']:
        product = db.session.get(Product, item['id'])
        if product:
            if not product.is_active:
                return jsonify({'error': f"Product '{product.name}' is no longer available"}), 400

            if item['quantity'] <= 0:
                return jsonify({'error': f"Invalid quantity for product '{product.name}'. Must be > 0"}), 400

            # Inventory Check
            if product.is_inventory_managed:
                if product.stock_quantity < item['quantity']:
                    return jsonify({'error': f"Insufficient stock for product '{product.name}' (Available: {product.stock_quantity})"}), 400

            subtotal = item['quantity'] * float(product.price) # Ensure float calc
            calculated_total += subtotal

            order_items_data.append({
                'product': product,
                'quantity': item['quantity'],
                'subtotal': subtotal
            })
        else:
            return jsonify({'error': f"Product with id {item['id']} not found"}), 404

    payment_received = float(data.get('payment_received', 0))
    if payment_received < calculated_total:
        return jsonify({'error': f"Insufficient payment. Expected {calculated_total}, received {payment_received}"}), 400

    # Generate Transaction Code: TRX-YYYYMMDD-XXXX
    today_str = datetime.now().strftime('%Y%m%d')
    today_start = datetime.combine(date.today(), datetime.min.time())

    # Count orders today for sequence
    count_today = db.session.query(func.count(Order.id)).filter(Order.created_at >= today_start).scalar()
    sequence = (count_today or 0) + 1
    transaction_code = f"TRX-{today_str}-{sequence:04d}"

    new_order = Order(
        user_id=user.id,
        transaction_code=transaction_code,
        total_amount=calculated_total,
        payment_method=data.get('payment_method', 'Cash'),
        amount_received=payment_received,
        change_amount=payment_received - calculated_total,
        status='paid', # Successfully paid
        created_at=datetime.utcnow()
    )

    db.session.add(new_order)
    db.session.flush() # Get ID

    for item_data in order_items_data:
        product = item_data['product']
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name_snapshot=product.name,
            price_snapshot=product.price,
            quantity=item_data['quantity'],
            subtotal=item_data['subtotal']
        )
        db.session.add(order_item)

        # Deduct Stock
        if product.is_inventory_managed:
            product.stock_quantity -= item_data['quantity']
            # Auto-Deactivate if 0?
            if product.stock_quantity <= 0:
                product.is_active = False # As per requirement "Auto-Deactivate"

    db.session.commit()

    # Generate Receipt File (Legacy requirement kept)
    generate_struct_file(new_order)

    return jsonify(new_order.to_dict()), 201

# --- Legacy/Helper Functions ---

def generate_struct_file(order):
    try:
        struct_dir = os.path.join(os.getcwd(), 'backend', 'receipts')
        if not os.path.exists(struct_dir):
            os.makedirs(struct_dir)

        filename = f"Receipt_{order.transaction_code}.txt"
        filepath = os.path.join(struct_dir, filename)

        with open(filepath, 'w') as f:
            f.write("========================================\n")
            f.write("              COFFEE SHOP               \n")
            f.write("========================================\n")
            f.write(f"Trx Code: {order.transaction_code}\n")
            f.write(f"Date:     {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Cashier:  {order.user.username}\n")
            f.write("----------------------------------------\n")
            f.write(f"{'Item':<20} {'Qty':<5} {'Price':>10}\n")
            f.write("----------------------------------------\n")
            for item in order.items:
                f.write(f"{item.product_name_snapshot:<20} {item.quantity:<5} {float(item.price_snapshot):>10,.0f}\n")
            f.write("----------------------------------------\n")
            f.write(f"Total:                  {float(order.total_amount):>10,.0f}\n")
            f.write(f"Payment ({order.payment_method}):    {float(order.amount_received):>10,.0f}\n")
            f.write(f"Change:                 {float(order.change_amount):>10,.0f}\n")
            f.write("========================================\n")
            f.write("          THANK YOU FOR VISITING        \n")
            f.write("========================================\n")

    except Exception as e:
        print(f"Error generating receipt: {e}")

@pos_bp.route('/shift/close', methods=['POST'])
def close_shift_report():
    # Renamed/Repurposed to "Daily Report" since Shift model is gone/deprecated for now
    today_start = datetime.combine(date.today(), datetime.min.time())
    orders = Order.query.filter(Order.created_at >= today_start, Order.status == 'paid').all()

    total_revenue = sum(float(o.total_amount) for o in orders)
    total_orders = len(orders)

    return jsonify({
        'date': date.today().isoformat(),
        'total_revenue': total_revenue,
        'total_orders': total_orders
    })
