"""Create the project database if it doesn't exist.
This script connects to the Postgres server's maintenance DB (default 'postgres') and creates
the requested database if missing. It prompts for credentials if not provided via env.
"""
import os
import getpass
import psycopg2


def main():
    host = os.environ.get('PGHOST') or input('Postgres host (default localhost): ') or 'localhost'
    port = os.environ.get('PGPORT') or input('Postgres port (default 5432): ') or '5432'
    user = os.environ.get('PGUSER') or input('Postgres username (default postgres): ') or 'postgres'
    password = os.environ.get('PGPASSWORD') or getpass.getpass(f'Password for {user} (leave empty to prompt later): ')
    dbname = os.environ.get('PGDATABASE') or input('Database to create (default latihan_db): ') or 'latihan_db'

    print(f"Connecting to {host}:{port} as {user} to create database '{dbname}'...")

    conn = None
    try:
        conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname='postgres')
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (dbname,))
        exists = cur.fetchone()
        if exists:
            print(f"Database '{dbname}' already exists.")
        else:
            # Use SQL identifier; psycopg2 AsIs requires careful use – we keep it simple here.
            cur.execute(f"CREATE DATABASE \"{dbname}\"")
            print(f"Database '{dbname}' created.")
        cur.close()
    except Exception as e:
        print('Error:', e)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
