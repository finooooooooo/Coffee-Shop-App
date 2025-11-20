require('dotenv').config(); // Muat variabel dari file .env
const { Client } = require('pg');

async function connectToPostgres() {
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    try {
        await client.connect();
        console.log("✅ Berhasil terhubung ke database PostgreSQL!");
        return client;
    } catch (error) {
        console.error(`❌ Error saat terhubung ke PostgreSQL: ${error.stack}`);
        return null; // Mengembalikan null jika error
    }
}

// --- Cara Menggunakan Fungsi ---
async function main() {
    // Panggil fungsi untuk mendapatkan client
    const client = await connectToPostgres();

    // Periksa apakah koneksi berhasil sebelum menjalankan query
    if (client) {
        try {
            console.log("\nMenjalankan query untuk mengecek versi...");
            const res = await client.query('SELECT version();');
            
            console.log(`Versi PostgreSQL: ${res.rows[0].version}`);

        } catch (error) {
            console.error(`❌ Error saat menjalankan query: ${error.stack}`);
        } finally {
            // PASTIKAN KONEKSI DITUTUP setelah selesai
            await client.end();
            console.log("Koneksi ke database telah ditutup.");
        }
    }
}

// Jalankan fungsi utama
main();