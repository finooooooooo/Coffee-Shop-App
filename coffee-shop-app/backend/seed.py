from app import create_app
from extensions import db
from seeder import seed_database

app = create_app()

def seed():
    with app.app_context():
        # Force a full re-seed by dropping
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        # Use the common seeder logic
        # Note: seed_database checks if users exist, but we just dropped tables, so it will always seed.
        seed_database()
        
        print("Seeding complete via seed script.")

if __name__ == '__main__':
    seed()
