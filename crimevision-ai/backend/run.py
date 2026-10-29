import os
from flask import Flask
from flask_cors import CORS
from app.config import settings
from app.extensions import db
from app import models  # Register SQLAlchemy models before create_all().
from app.routes.health import health_bp
from app.routes.evidence import evidence_bp
from app.routes.analysis import analysis_bp
from app.routes.timeline import timeline_bp
from app.routes.chat import chat_bp


def create_app(config_overrides=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    app.config['SECRET_KEY'] = settings.SECRET_KEY
    app.config['SQLALCHEMY_DATABASE_URI'] = settings.DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = settings.MAX_UPLOAD_SIZE

    # Allow isolated demo/test instances to provide a private database and
    # storage root without changing the regular local backend defaults.
    if config_overrides:
        app.config.update(config_overrides)
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS
    cors_origins = settings.CORS_ORIGINS.split(',')
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Keep local storage paths stable when the app is started outside backend/.
    backend_root = os.path.dirname(os.path.abspath(__file__))
    for key in ('UPLOAD_FOLDER', 'EVIDENCE_FOLDER', 'REPORTS_FOLDER', 'THUMBNAILS_FOLDER'):
        configured_path = app.config.get(key, getattr(settings, key))
        if not os.path.isabs(configured_path):
            app.config[key] = os.path.join(backend_root, configured_path)

    # Register blueprints
    app.register_blueprint(health_bp, url_prefix='/api/v1')
    app.register_blueprint(evidence_bp, url_prefix='/api/v1/evidence')
    app.register_blueprint(analysis_bp, url_prefix='/api/v1/analysis')
    app.register_blueprint(timeline_bp, url_prefix='/api/v1/timeline')
    app.register_blueprint(chat_bp, url_prefix='/api/v1/chat')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Ensure storage directories exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['EVIDENCE_FOLDER'], exist_ok=True)
    os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)
    os.makedirs(app.config['THUMBNAILS_FOLDER'], exist_ok=True)
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host=settings.HOST,
        port=settings.PORT,
        debug=settings.FLASK_DEBUG
    )
