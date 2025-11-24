import os

class Config:
    """
    Configuration class for the Flask Application.
    This centralized config helps manage environment variables and default settings.
    """
    # Secret key for session management and security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_secret_key')

    # Database connection string
    # We prefer PostgreSQL, but fallback to SQLite for local development ease.
    # The 'postgresql+pg8000' driver is used for better cross-platform compatibility.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///pos_system.db')

    # Disable modification tracking to save memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
