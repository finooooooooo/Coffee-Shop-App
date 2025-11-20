import psycopg2
from psycopg2.extras import RealDictCursor

class Database:
    def __init__(self):
        # Updated to match user's PostgreSQL settings
        self.conn = psycopg2.connect(
            host="localhost",
            database="latihan_db",
            user="postgres",
            password="5432",
            port=5432
        )
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
    
    def execute_query(self, query, params=None):
        self.cursor.execute(query, params)
        self.conn.commit()
        # Fetch results for SELECT queries or queries with RETURNING
        if 'SELECT' in query.upper() or 'RETURNING' in query.upper():
            return self.cursor.fetchall()
        else:
            return None
    
    def close(self):
        self.cursor.close()
        self.conn.close()