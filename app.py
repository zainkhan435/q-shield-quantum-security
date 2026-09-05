import os
from pathlib import Path
from flask import Flask, jsonify, render_template, request
from config import Config
from database.database import db
from routes.auth import auth_bp, seed_demo_user
from routes.dashboard import dashboard_bp
from routes.api import api_bp

def create_app(config_class=Config):
    """Application factory for Q-SHIELD."""
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(config_class)
    
    # Ensure SQLite instance directory exists
    instance_path = Path(app.config.get("DB_PATH", Path(app.root_path) / "instance" / "qshield.db")).parent
    instance_path.mkdir(parents=True, exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(api_bp)
    
    # Error handlers - Clean, enterprise error responses without leaking tracebacks
    @app.errorhandler(404)
    def handle_not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "Endpoint not found"}), 404
        return render_template("login.html", error="The requested page was not found."), 404
        
    @app.errorhandler(500)
    def handle_server_error(e):
        app.logger.error(f"Internal server error: {str(e)}")
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "An internal error occurred. Please try again."}), 500
        return render_template("login.html", error="An internal server error occurred."), 500
        
    # Initialize database tables and seed demo user
    with app.app_context():
        db.create_all()
        seed_demo_user()
        
    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

