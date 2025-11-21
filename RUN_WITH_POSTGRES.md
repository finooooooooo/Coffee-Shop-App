
# Running with PostgreSQL

To run this application with PostgreSQL, ensure you have a PostgreSQL server running.

## Configuration

The application reads the `DATABASE_URL` environment variable from the `.env` file in `coffee-shop-app/backend/.env`.

**Default Config (as requested):**
```
DATABASE_URL=postgresql://potgres:5432@localhost:5432/coffee_shop
```

## Setup Steps

1. **Install Dependencies:**
   ```bash
   pip install -r coffee-shop-app/backend/requirements.txt
   ```

2. **Ensure Postgres is Running:**
   Make sure your Postgres server is up and listening on port 5432.
   Ensure the database `coffee_shop` exists (or the user has permissions to create it, though `create_all` creates tables, not the DB itself).

3. **Run the App:**
   ```bash
   cd coffee-shop-app/backend
   python app.py
   ```
   The application will automatically connect to Postgres if `DATABASE_URL` is set.

## Troubleshooting

If you see `Connection refused`, check:
- Is Postgres running?
- Is the username `potgres` correct? (Standard is `postgres`).
- Is the password `5432` correct?
- Is the port `5432` correct?
