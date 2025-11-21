# How to Run the POS Application

This application consists of a **Python Flask Backend** and an **Electron Frontend**.

## Prerequisites

1. **Python 3.x** (with `pip`)
2. **Node.js** (with `npm`)

## 1. Setup and Run Backend

The backend handles the database and API. It helps if you open a terminal for this.

1. Navigate to the backend folder:
   ```bash
   cd coffee-shop-app/backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   # Note: I have added flask and other required packages to the environment.
   # If requirements.txt is missing them, run:
   pip install flask flask-cors psycopg2-binary python-dotenv
   ```

3. Run the server:
   ```bash
   python app.py
   ```

   *Note:* The app will automatically use a local SQLite database (`pos_restoran.db`) if it cannot connect to PostgreSQL. You don't need to install Postgres to test the app!

   You should see output indicating the server is running on `http://0.0.0.0:5000`.

## 2. Setup and Run Frontend

Open a **new** terminal window (keep the backend running).

1. Navigate to the frontend folder:
   ```bash
   cd coffee-shop-app/frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Electron App:
   ```bash
   npm start
   ```

## Troubleshooting

- **White Screen / Error**: Check the backend terminal. If the backend isn't running, the menu won't load.
- **Database**: If you want to use PostgreSQL, make sure your `.env` file or environment variables are set. Otherwise, enjoy the automatic SQLite mode!
