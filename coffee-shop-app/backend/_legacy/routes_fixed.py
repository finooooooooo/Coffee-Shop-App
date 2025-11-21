from flask import Flask, request, jsonify
from flask_cors import CORS
from models_fixed import Menu, Transaksi, Pesanan, Laporan
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Routes untuk Menu
@app.route('/api/menu', methods=['GET'])
def get_all_menu():
    menu = Menu()
    return jsonify(menu.get_all_menu())

@app.route('/api/menu/<int:id_menu>', methods=['GET'])
def get_menu_by_id(id_menu):
    menu = Menu()
    return jsonify(menu.get_menu_by_id(id_menu))

# Routes untuk Transaksi
@app.route('/api/transaksi', methods=['POST'])
def create_transaksi():
    data = request.json
    transaksi = Transaksi()

    id_transaksi = transaksi.create_transaksi(
        data['id_pelanggan'],
        data['total_bayar'],
        data['metode_pembayaran']
    )

    # Tambah detail transaksi
    for item in data['items']:
        transaksi.add_detail_transaksi(
            id_transaksi,
            item['id_menu'],
            item['jumlah'],
            item['subtotal']
        )

        # Update stok menu
        menu = Menu()
        menu.update_stok(item['id_menu'], item['jumlah'])

        # Buat pesanan untuk kitchen/bar
        menu_data = menu.get_menu_by_id(item['id_menu'])
        tujuan = 'Kitchen' if menu_data[0]['kategori'] == 'Makanan' else 'Bar'

        pesanan = Pesanan()
        pesanan.create_pesanan(
            id_transaksi,
            item['id_menu'],
            item['jumlah'],
            tujuan
        )

    return jsonify({"success": True, "id_transaksi": id_transaksi})

@app.route('/api/transaksi/<start_date>/<end_date>', methods=['GET'])
def get_transaksi_by_date_range(start_date, end_date):
    transaksi = Transaksi()
    return jsonify(transaksi.get_transaksi_by_date_range(start_date, end_date))

# Routes untuk Pesanan (KDS)
@app.route('/api/pesanan/<tujuan>', methods=['GET'])
def get_pending_orders(tujuan):
    pesanan = Pesanan()
    return jsonify(pesanan.get_pending_orders(tujuan))

@app.route('/api/pesanan/<int:id_pesanan>', methods=['PUT'])
def update_status_pesanan(id_pesanan):
    data = request.json
    pesanan = Pesanan()
    pesanan.update_status_pesanan(id_pesanan, data['status'])
    return jsonify({"success": True})

# Routes untuk History Pesanan
@app.route('/api/history', methods=['GET'])
def get_order_history():
    transaksi = Transaksi()
    # Get recent transactions (last 50)
    history = transaksi.get_transaksi_by_date_range(
        (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
        datetime.now().strftime("%Y-%m-%d")
    )
    return jsonify(history[:50])  # Return last 50 orders

# Routes untuk Laporan
@app.route('/api/laporan/harian/<tanggal>', methods=['POST'])
def generate_laporan_harian(tanggal):
    laporan = Laporan()
    id_laporan = laporan.generate_harian(tanggal)
    return jsonify({"success": True, "id_laporan": id_laporan})
