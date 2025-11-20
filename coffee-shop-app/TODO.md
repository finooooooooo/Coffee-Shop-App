    # TODO: Perbaikan Aplikasi Kasir POS Restoran

## 1. Perbaiki Inconsistency ID Menu
- [x] Perbaiki field ID di renderer.js agar konsisten (id_menu)
- [x] Pastikan addToOrder menggunakan id_menu yang benar

## 2. Tambahkan Gambar Menu
- [x] Tambahkan field gambar ke seed.sql dengan dummy URLs
- [x] Update displayMenu di renderer.js untuk menampilkan gambar
- [x] Perbaiki CSS menu-item untuk layout gambar

## 3. Implementasi Cash Out
- [x] Tambahkan modal pembayaran di index.html
- [x] Implementasi logika input uang dan kalkulasi kembalian di renderer.js
- [x] Update checkout button untuk membuka modal cash out

## 4. Perbaiki CSS Displays
- [x] Update kitchen.html dan bar.html untuk menampilkan gambar menu
- [x] Perbaiki CSS di displays agar gambar terlihat baik
- [x] Update kitchen.js dan bar.js jika perlu

## 5. Testing
- [x] Test penambahan semua menu items
- [x] Test fitur cash out dan kembalian
- [x] Test displays dengan gambar
- [x] Jalankan aplikasi lengkap

## 6. Perbaikan Backend
- [x] Perbaiki database.py untuk handle RETURNING queries
- [x] Test transaksi creation
