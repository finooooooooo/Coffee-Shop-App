-- Sample Menu Items
INSERT INTO Menu (Nama_Menu, Kategori, Harga, Stok, Gambar, Status_Aktif) VALUES
    ('Nasi Goreng Spesial', 'Makanan', 35000.00, 100, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop', true),
    ('Mie Goreng', 'Makanan', 30000.00, 100, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop', true),
    ('Ayam Goreng', 'Makanan', 25000.00, 50, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop', true),
    ('Sate Ayam', 'Makanan', 35000.00, 75, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&h=200&fit=crop', true),
    ('Es Teh Manis', 'Minuman', 5000.00, 200, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=200&fit=crop', true),
    ('Es Jeruk', 'Minuman', 7000.00, 200, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=200&fit=crop', true),
    ('Jus Alpukat', 'Minuman', 15000.00, 50, 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=200&fit=crop', true),
    ('Kopi Hitam', 'Minuman', 8000.00, 100, 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=300&h=200&fit=crop', true);

-- Sample Customer
INSERT INTO Pelanggan (Nama_Pelanggan, No_Telp, Email) VALUES
    ('Umum', '-', '-');