import os

class Config:
    basedir = os.path.abspath(os.path.dirname(__file__))
    # Force DB to be in backend/instance/pos_system.db
    db_path = os.path.join(basedir, 'instance', 'pos_system.db')

    # Ensure instance folder exists
    instance_dir = os.path.join(basedir, 'instance')
    if not os.path.exists(instance_dir):
        os.makedirs(instance_dir)

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + db_path
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
