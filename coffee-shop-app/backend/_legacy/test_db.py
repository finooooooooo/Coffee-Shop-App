import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        database="latihan_db",
        user="postgres",
        password="5432",
        port=5432
    )
    print("Connection successful")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
