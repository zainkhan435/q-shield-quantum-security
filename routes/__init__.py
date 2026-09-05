from routes.auth import auth_bp, seed_demo_user
from routes.dashboard import dashboard_bp
from routes.api import api_bp

__all__ = ["auth_bp", "dashboard_bp", "api_bp", "seed_demo_user"]
