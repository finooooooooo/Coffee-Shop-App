from database import Database
from datetime import datetime, timedelta
import json

class Menu:
    def __init__(self):
        self.db = Database()

    def get_all_menu(self):
        query = "SELECT ID_Menu as id_menu, Nama_Menu as nama_menu, Kategori as kategori, Harga as harga, Stok as stok, Gambar as gambar, Status_Aktif as status_aktif FROM Menu WHERE Status_Aktif = TRUE"
        result = self.db.execute_query(query)
        # Convert Decimal to float for JSON serialization
        for item in result:
            if 'harga' in item:
                item['harga'] = float(item['harga'])
        return result

    def get_menu_by_id(self, id_menu):
        query = "SELECT ID_Menu as id_menu, Nama_Menu as nama_menu, Kategori as kategori, Harga as harga, Stok as stok, Gambar as gambar, Status_Aktif as status_aktif FROM Menu WHERE ID_Menu = %s"
        result = self.db.execute_query(query, (id_menu,))
        if result:
            result[0]['harga'] = float(result[0]['harga'])
        return result

    def update_stok(self, id_menu, jumlah):
        query = "UPDATE Menu SET Stok = Stok - %s WHERE ID_Menu = %s"
        self.db.execute_query(query, (jumlah, id_menu))

class Transaksi:
    def __init__(self):
        self.db = Database()

    def create_transaksi(self, id_pelanggan, total_bayar, metode_pembayaran):
        query = """
        INSERT INTO Transaksi (ID_Pelanggan, Total_Bayar, Metode_Pembayaran)
        VALUES (%s, %s, %s) RETURNING ID_Transaksi
        """
        result = self.db.execute_query(query, (id_pelanggan, total_bayar, metode_pembayaran))
        return result[0]['id_transaksi']

    def add_detail_transaksi(self, id_transaksi, id_menu, jumlah, subtotal):
        query = """
        INSERT INTO Detail_Transaksi (ID_Transaksi, ID_Menu, Jumlah, Subtotal)
        VALUES (%s, %s, %s, %s)
        """
        self.db.execute_query(query, (id_transaksi, id_menu, jumlah, subtotal))

    def get_transaksi_by_date_range(self, start_date, end_date):
        query = """
        SELECT T.*, P.Nama_Pelanggan
        FROM Transaksi T
        LEFT JOIN Pelanggan P ON T.ID_Pelanggan = P.ID_Pelanggan
        WHERE T.Tanggal_Transaksi BETWEEN %s AND %s
        ORDER BY T.Tanggal_Transaksi DESC
        """
        result = self.db.execute_query(query, (start_date, end_date))
        # Convert Decimal to float
        for item in result:
            item['total_bayar'] = float(item['total_bayar'])
        return result

class Pesanan:
    def __init__(self):
        self.db = Database()

    def create_pesanan(self, id_transaksi, id_menu, jumlah, tujuan):
        query = """
        INSERT INTO Pesanan (ID_Transaksi, ID_Menu, Jumlah, Tujuan)
        VALUES (%s, %s, %s, %s)
        """
        self.db.execute_query(query, (id_transaksi, id_menu, jumlah, tujuan))

    def get_pending_orders(self, tujuan):
        query = """
        SELECT P.*, M.Nama_Menu
        FROM Pesanan P
        JOIN Menu M ON P.ID_Menu = M.ID_Menu
        WHERE P.Status_Pesanan = 'Menunggu' AND P.Tujuan = %s
        ORDER BY P.Waktu_Pesanan
        """
        return self.db.execute_query(query, (tujuan,))

    def update_status_pesanan(self, id_pesanan, status):
        query = "UPDATE Pesanan SET Status_Pesanan = %s WHERE ID_Pesanan = %s"
        self.db.execute_query(query, (status, id_pesanan))

class Laporan:
    def __init__(self):
        self.db = Database()

    def generate_harian(self, tanggal):
        start_date = datetime.strptime(tanggal, "%Y-%m-%d")
        end_date = start_date + timedelta(days=1)

        transaksi = Transaksi()
        data_transaksi = transaksi.get_transaksi_by_date_range(start_date, end_date)

        total_transaksi = len(data_transaksi)
        total_pendapatan = sum(t['total_bayar'] for t in data_transaksi)

        query = """
        INSERT INTO Laporan (Tipe_Laporan, Tanggal_Laporan, Total_Transaksi, Total_Pendapatan)
        VALUES (%s, %s, %s, %s) RETURNING ID_Laporan
        """
        result = self.db.execute_query(query, ('Harian', start_date.date(), total_transaksi, total_pendapatan))
        return result[0]['id_laporan']
