# Coffee Shop POS System

A full-stack Point of Sale system rebuilt for simplicity and reliability.

## Features
- **Frontend:** Vanilla JS (SPA), Light/Blue Theme, Responsive Grid.
- **Backend:** Python Flask, SQLAlchemy (Postgres/SQLite).
- **Sorting:** Manual Merge Sort algorithm implementation (`backend/utils/sorter.py`).
- **Receipts:** Auto-generates text file receipts in `backend/Struct/`.
- **Order IDs:** Custom `P-XXX` daily running numbers.

## Prerequisities
- Python 3.8+
- Node.js (Optional, only if serving static via another server, but Flask handles it here).

## How to Run

1. **Install Dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Run the Application**
   ```bash
   python backend/app.py
   ```
   *The app will automatically seed the database on the first run.*

3. **Access**
   Open your browser to: `http://localhost:5000`

## Project Structure
- `backend/`: API, Database, and Logic.
  - `Struct/`: Generated receipt files appear here.
  - `utils/sorter.py`: The custom Merge Sort algorithm.
- `frontend/`: UI code (HTML/CSS/JS).
