# How to Run the New POS Application

This application has been rebuilt as a comprehensive POS system with a **Flask-SQLAlchemy Backend** and a **Single Page Application (SPA) Frontend**.

## Prerequisites

1. **Python 3.x** (with `pip`)
2. **Node.js** (with `npm`)

## 1. Setup and Run Backend

1. Navigate to the backend folder:
   ```bash
   cd coffee-shop-app/backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize the Database (First Time Only)**:
   Run this command to create the database tables and add sample products:
   ```bash
   python seed.py
   ```

4. Run the server:
   ```bash
   python app.py
   ```

   You should see output indicating the server is running on `http://0.0.0.0:5000`.

## 2. Setup and Run Frontend

Open a **new** terminal window (keep the backend running).

1. Navigate to the frontend folder:
   ```bash
   cd coffee-shop-app/frontend
   ```

2. Install Node dependencies (if you haven't already):
   ```bash
   npm install
   ```

3. Start the Electron App:
   ```bash
   npm start
   ```

## How to Use

1. **Open Shift**: When the app starts, click "Toggle Shift" in the sidebar and enter a starting cash amount (e.g., 0). You cannot sell items without an open shift.
2. **POS**: Click items to add to cart. Click Checkout to process payment.
3. **Inventory**: Go to the Inventory tab to view products. (Add/Edit features available via API, UI has basic "Add" demo).
4. **Reports**: View sales stats and recent transactions.
