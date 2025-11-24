from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Initialize SQLAlchemy with no settings (they come from app config later)
db = SQLAlchemy()
cors = CORS()
