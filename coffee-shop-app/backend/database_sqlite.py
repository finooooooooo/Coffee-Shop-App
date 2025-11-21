import sqlite3
import os
from datetime import datetime

class Database:
    def __init__(self):
        self.db_path = 'pos_restoran.db'
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = self.dict_factory
        self.cursor = self.conn.cursor()
        self.init_db()

    def dict_factory(self, cursor, row):
        d = {}
        for idx, col in enumerate(cursor.description):
            d[col[0].lower()] = row[idx]  # Lowercase keys to match RealDictCursor
        return d

    def execute_query(self, query, params=None):
        # Convert %s to ? for SQLite
        sqlite_query = query.replace('%s', '?')

        try:
            if params:
                self.cursor.execute(sqlite_query, params)
            else:
                self.cursor.execute(sqlite_query)
            self.conn.commit()

            # Check if it's a SELECT or RETURNING query
            if 'SELECT' in query.upper():
                return self.cursor.fetchall()
            elif 'RETURNING' in query.upper():
                # SQLite doesn't support RETURNING in older versions, but we can emulate for INSERT
                if 'INSERT' in query.upper():
                    last_id = self.cursor.lastrowid
                    # Guess the ID column name based on table name or context
                    # This is a simplified heuristic for this specific app
                    if 'Transaksi' in query:
                         return [{'id_transaksi': last_id}]
                    elif 'Laporan' in query:
                         return [{'id_laporan': last_id}]
                    return [{'id': last_id}]
            return None
        except Exception as e:
            print(f"Query Error: {e}")
            print(f"Query: {sqlite_query}")
            print(f"Params: {params}")
            return None

    def close(self):
        self.cursor.close()
        self.conn.close()

    def init_db(self):
        # Create tables if not exist

        # Menu
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS Menu (
            ID_Menu INTEGER PRIMARY KEY AUTOINCREMENT,
            Nama_Menu TEXT NOT NULL,
            Kategori TEXT,
            Harga REAL,
            Stok INTEGER,
            Gambar TEXT,
            Status_Aktif INTEGER DEFAULT 1
        )
        ''')

        # Pelanggan
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS Pelanggan (
            ID_Pelanggan INTEGER PRIMARY KEY AUTOINCREMENT,
            Nama_Pelanggan TEXT
        )
        ''')

        # Transaksi
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS Transaksi (
            ID_Transaksi INTEGER PRIMARY KEY AUTOINCREMENT,
            ID_Pelanggan INTEGER,
            Total_Bayar REAL,
            Metode_Pembayaran TEXT,
            Tanggal_Transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Detail Transaksi
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS Detail_Transaksi (
            ID_Detail INTEGER PRIMARY KEY AUTOINCREMENT,
            ID_Transaksi INTEGER,
            ID_Menu INTEGER,
            Jumlah INTEGER,
            Subtotal REAL
        )
        ''')

        # Pesanan (KDS)
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS Pesanan (
            ID_Pesanan INTEGER PRIMARY KEY AUTOINCREMENT,
            ID_Transaksi INTEGER,
            ID_Menu INTEGER,
            Jumlah INTEGER,
            Tujuan TEXT,
            Status_Pesanan TEXT DEFAULT 'Menunggu',
            Waktu_Pesanan TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Laporan
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS Laporan (
            ID_Laporan INTEGER PRIMARY KEY AUTOINCREMENT,
            Tipe_Laporan TEXT,
            Tanggal_Laporan TEXT,
            Total_Transaksi INTEGER,
            Total_Pendapatan REAL
        )
        ''')

        # Seed initial data if empty
        self.cursor.execute('SELECT COUNT(*) as count FROM Menu')
        if self.cursor.fetchone()['count'] == 0:
            menus = [
                ('Cappuccino', 'Minuman', 25000, 100, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop'),
                ('Latte', 'Minuman', 28000, 100, 'https://images.unsplash.com/photo-1561882468-488b7332d5ad?w=300&h=200&fit=crop'),
                ('Americano', 'Minuman', 20000, 100, 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=300&h=200&fit=crop'),
                ('Croissant', 'Makanan', 18000, 50, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop'),
                ('Cheesecake', 'Makanan', 35000, 30, 'https://images.unsplash.com/photo-1524351199678-c41d621572e1?w=300&h=200&fit=crop'),
            ]
            self.cursor.executemany('INSERT INTO Menu (Nama_Menu, Kategori, Harga, Stok, Gambar) VALUES (?, ?, ?, ?, ?)', menus)

            self.cursor.execute("INSERT INTO Pelanggan (Nama_Pelanggan) VALUES ('Walk-in Customer')")

            self.conn.commit()
            print("Initialized SQLite database with seed data.")
