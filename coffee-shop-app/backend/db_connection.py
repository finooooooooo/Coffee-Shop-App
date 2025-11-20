import os
from dotenv import load_dotenv
import psycopg2

# Muat variabel dari file .env
load_dotenv()

def connect_to_postgres():
    conn = None
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_DATABASE"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        print("✅ Berhasil terhubung ke database PostgreSQL!")
        return conn

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"❌ Error saat terhubung ke PostgreSQL: {error}")
        return conn # Akan mengembalikan None jika error

# --- Cara Menggunakan Fungsi ---
if __name__ == "__main__":
    # Panggil fungsi untuk mendapatkan koneksi
    connection = connect_to_postgres()

    # Periksa apakah koneksi berhasil sebelum menjalankan query
    if connection is not None:
        try:
            # Buat objek cursor untuk mengeksekusi perintah SQL
            cursor = connection.cursor()
            
            # Contoh query sederhana: cek versi PostgreSQL
            print("\nMenjalankan query untuk mengecek versi...")
            cursor.execute("SELECT version();")
            
            # Ambil satu hasil dari query
            db_version = cursor.fetchone()
            print(f"Versi PostgreSQL: {db_version[0]}")

            # Tutup cursor
            cursor.close()
            
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"❌ Error saat menjalankan query: {error}")
            
        finally:
            # PASTIKAN KONEKSI DITUTUP setelah selesai
            if connection is not None:
                connection.close()
                print("Koneksi ke database telah ditutup.")
