from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db
from routes.inventory_routes import inventory_bp
from routes.pos_routes import pos_bp
from routes.report_routes import report_bp
from routes.auth_routes import auth_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    # Create DB tables if they don't exist (simple migration)
    with app.app_context():
        db.create_all()

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(pos_bp, url_prefix='/api/pos')
    app.register_blueprint(report_bp, url_prefix='/api/report')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
