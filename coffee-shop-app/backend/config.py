import os

class Config:
    basedir = os.path.abspath(os.path.dirname(__file__))
    # Force DB to be in backend/instance/pos_system.db
    db_path = os.path.join(basedir, 'instance', 'pos_system.db')

    # Ensure instance folder exists
    instance_dir = os.path.join(basedir, 'instance')
    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)

    database_url = os.environ.get('DATABASE_URL')

    if not database_url:
        # Construct from individual components if DATABASE_URL is not set
        db_host = os.environ.get('DB_HOST')
        db_user = os.environ.get('DB_USER')
        db_password = os.environ.get('DB_PASSWORD')
        db_name = os.environ.get('DB_DATABASE')
        db_port = os.environ.get('DB_PORT')

        if all([db_host, db_user, db_password, db_name, db_port]):
            database_url = f"postgresql+pg8000://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        else:
             database_url = 'sqlite:///' + db_path

    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
