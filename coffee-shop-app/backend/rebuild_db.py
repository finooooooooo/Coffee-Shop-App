from app import create_app
from extensions import db
import seeder

app = create_app()

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    print("Seeding database...")
    seeder.seed_database()
    print("Database rebuilt successfully.")
