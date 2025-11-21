import os
import sys

# Determine which database to use
# Default to SQLite for development if POSTGRES_HOST is not set or if explicit flag is set
USE_SQLITE = os.environ.get('USE_SQLITE', 'True').lower() == 'true' or not os.environ.get('POSTGRES_HOST')

if USE_SQLITE:
    print("Using SQLite Database", file=sys.stderr)
    from database_sqlite import Database
else:
    print("Using Postgres Database", file=sys.stderr)
    from database_postgres import Database
