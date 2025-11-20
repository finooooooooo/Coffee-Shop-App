-- Database untuk Sistem POS Restoran

-- Tabel Menu
CREATE TABLE Menu (
    ID_Menu SERIAL PRIMARY KEY,
    Nama_Menu VARCHAR(100) NOT NULL,
    Kategori VARCHAR(50) NOT NULL,
    Harga DECIMAL(10, 2) NOT NULL,
    Stok INT DEFAULT 0,
    Gambar VARCHAR(255),
    Status_Aktif BOOLEAN DEFAULT TRUE
);

-- Tabel Pelanggan
CREATE TABLE Pelanggan (
    ID_Pelanggan SERIAL PRIMARY KEY,
    Nama_Pelanggan VARCHAR(100) NOT NULL,
    No_Telp VARCHAR(20),
    Email VARCHAR(100),
    Alamat TEXT
);

-- Tabel Transaksi
CREATE TABLE Transaksi (
    ID_Transaksi SERIAL PRIMARY KEY,
    ID_Pelanggan INTEGER REFERENCES Pelanggan(ID_Pelanggan),
    Tanggal_Transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Total_Bayar DECIMAL(10, 2) NOT NULL,
    Metode_Pembayaran VARCHAR(50) NOT NULL,
    Status_Pembayaran VARCHAR(20) DEFAULT 'Lunas'
);

-- Tabel Detail_Transaksi
CREATE TABLE Detail_Transaksi (
    ID_Detail_Transaksi SERIAL PRIMARY KEY,
    ID_Transaksi INTEGER REFERENCES Transaksi(ID_Transaksi),
    ID_Menu INTEGER REFERENCES Menu(ID_Menu),
    Jumlah INT NOT NULL,
    Subtotal DECIMAL(10, 2) NOT NULL
);

-- Tabel Pesanan
CREATE TABLE Pesanan (
    ID_Pesanan SERIAL PRIMARY KEY,
    ID_Transaksi INTEGER REFERENCES Transaksi(ID_Transaksi),
    ID_Menu INTEGER REFERENCES Menu(ID_Menu),
    Jumlah INT NOT NULL,
    Status_Pesanan VARCHAR(20) DEFAULT 'Menunggu',
    Waktu_Pesanan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Tujuan VARCHAR(20) NOT NULL -- 'Kitchen' atau 'Bar'
);

-- Tabel Laporan
CREATE TABLE Laporan (
    ID_Laporan SERIAL PRIMARY KEY,
    Tipe_Laporan VARCHAR(20) NOT NULL, -- 'Harian', 'Mingguan', 'Bulanan'
    Tanggal_Laporan DATE NOT NULL,
    Total_Transaksi INT DEFAULT 0,
    Total_Pendapatan DECIMAL(10, 2) DEFAULT 0,
    File_Laporan VARCHAR(255)
);

-- Insert data contoh
INSERT INTO Menu (Nama_Menu, Kategori, Harga, Stok) VALUES
('Espresso', 'Minuman', 15000, 100),
('Cappuccino', 'Minuman', 25000, 100),
('Croissant', 'Makanan', 20000, 50),
('Sandwich', 'Makanan', 35000, 30);

INSERT INTO Pelanggan (Nama_Pelanggan, No_Telp) VALUES
('Budi Santoso', '08123456789'),
('Siti Nurhaliza', '08987654321');