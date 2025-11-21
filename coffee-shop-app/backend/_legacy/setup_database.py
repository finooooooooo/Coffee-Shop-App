import psycopg2
from psycopg2.extras import RealDictCursor

def setup_database():
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host="localhost",
        database="latihan_db",
        user="postgres",
        password="5432",
        port=5432
    )
    conn.autocommit = True
    cursor = conn.cursor()

    # Create tables
    tables = [
        """
        CREATE TABLE IF NOT EXISTS Menu (
            ID_Menu SERIAL PRIMARY KEY,
            Nama_Menu VARCHAR(100) NOT NULL,
            Kategori VARCHAR(50) NOT NULL,
            Harga DECIMAL(10, 2) NOT NULL,
            Stok INT DEFAULT 0,
            Gambar VARCHAR(255),
            Status_Aktif BOOLEAN DEFAULT TRUE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Pelanggan (
            ID_Pelanggan SERIAL PRIMARY KEY,
            Nama_Pelanggan VARCHAR(100) NOT NULL,
            No_Telp VARCHAR(20),
            Email VARCHAR(100),
            Alamat TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Transaksi (
            ID_Transaksi SERIAL PRIMARY KEY,
            ID_Pelanggan INTEGER REFERENCES Pelanggan(ID_Pelanggan),
            Tanggal_Transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            Total_Bayar DECIMAL(10, 2) NOT NULL,
            Metode_Pembayaran VARCHAR(50) NOT NULL,
            Status_Pembayaran VARCHAR(20) DEFAULT 'Lunas'
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Detail_Transaksi (
            ID_Detail_Transaksi SERIAL PRIMARY KEY,
            ID_Transaksi INTEGER REFERENCES Transaksi(ID_Transaksi),
            ID_Menu INTEGER REFERENCES Menu(ID_Menu),
            Jumlah INT NOT NULL,
            Subtotal DECIMAL(10, 2) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Pesanan (
            ID_Pesanan SERIAL PRIMARY KEY,
            ID_Transaksi INTEGER REFERENCES Transaksi(ID_Transaksi),
            ID_Menu INTEGER REFERENCES Menu(ID_Menu),
            Jumlah INTEGER NOT NULL,
            Status_Pesanan VARCHAR(20) DEFAULT 'Menunggu',
            Waktu_Pesanan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            Tujuan VARCHAR(20) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Laporan (
            ID_Laporan SERIAL PRIMARY KEY,
            Tipe_Laporan VARCHAR(20) NOT NULL,
            Tanggal_Laporan DATE NOT NULL,
            Total_Transaksi INT DEFAULT 0,
            Total_Pendapatan DECIMAL(10, 2) DEFAULT 0,
            File_Laporan VARCHAR(255)
        )
        """
    ]

    # Create tables
    for table in tables:
        try:
            cursor.execute(table)
            print(f"Table created successfully")
        except Exception as e:
            print(f"Error creating table: {e}")

    # Insert sample menu items with images
    sample_menu = [
        ('Nasi Goreng Spesial', 'Makanan', 35000, 100, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop'),
        ('Mie Goreng', 'Makanan', 30000, 100, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop'),
        ('Ayam Goreng', 'Makanan', 25000, 50, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop'),
        ('Sate Ayam', 'Makanan', 35000, 75, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&h=200&fit=crop'),
        ('Es Teh Manis', 'Minuman', 5000, 200, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=200&fit=crop'),
        ('Es Jeruk', 'Minuman', 7000, 200, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=200&fit=crop'),
        ('Jus Alpukat', 'Minuman', 15000, 50, 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=200&fit=crop'),
        ('Kopi Hitam', 'Minuman', 8000, 100, 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=300&h=200&fit=crop'),
        ('Bakso', 'Makanan', 20000, 80, 'https://images.unsplash.com/photo-1551468747-9e9b8b5b5b5b?w=300&h=200&fit=crop'),
        ('Soto Ayam', 'Makanan', 25000, 60, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'),
        ('Rendang', 'Makanan', 40000, 40, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop'),
        ('Gado-Gado', 'Makanan', 22000, 70, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop'),
        ('Teh Tarik', 'Minuman', 8000, 150, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop'),
        ('Jus Mangga', 'Minuman', 12000, 80, 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=200&fit=crop'),
        ('Cappuccino', 'Minuman', 18000, 90, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop'),
        ('Latte', 'Minuman', 20000, 85, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop')
    ]

    try:
        cursor.execute("DELETE FROM Menu")  # Clear existing menu items
        cursor.executemany("""
            INSERT INTO Menu (Nama_Menu, Kategori, Harga, Stok, Gambar)
            VALUES (%s, %s, %s, %s, %s)
        """, sample_menu)
        print("Sample menu items inserted successfully")
    except Exception as e:
        print(f"Error inserting sample menu: {e}")

    # Insert sample customer
    try:
        cursor.execute("DELETE FROM Pelanggan")  # Clear existing customers
        cursor.execute("""
            INSERT INTO Pelanggan (Nama_Pelanggan, No_Telp, Email)
            VALUES (%s, %s, %s)
        """, ('Umum', '-', '-'))
        print("Sample customer inserted successfully")
    except Exception as e:
        print(f"Error inserting sample customer: {e}")

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    setup_database()