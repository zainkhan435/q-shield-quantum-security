from flask import Blueprint, request, jsonify, session, redirect, url_for
from database.models import User
from database.database import db

auth_bp = Blueprint("auth", __name__)

def seed_demo_user():
    """Seeds default demo user credentials for SIH hackathon evaluation."""
    demo_email = "admin@qshield.security"
    existing = User.query.filter_by(email=demo_email).first()
    if not existing:
        user = User(email=demo_email, role="lead_researcher")
        user.set_password("QShield@2026")
        db.session.add(user)
        db.session.commit()

@auth_bp.route("/api/login", methods=["POST"])
def login_api():
    """Handles session login via REST JSON request."""
    data = request.get_json(silent=True) or request.form
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "Invalid email or password credentials"}), 401
        
    session["user_id"] = user.id
    session["user_email"] = user.email
    session["user_role"] = user.role
    session.permanent = True
    
    return jsonify({
        "success": True,
        "message": "Authentication successful",
        "redirect": url_for("dashboard.dashboard_view"),
        "user": user.to_dict()
    })

@auth_bp.route("/api/logout", methods=["POST", "GET"])
def logout_api():
    """Clears user session and redirects to login."""
    session.clear()
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"success": True, "message": "Logged out successfully", "redirect": url_for("dashboard.login_view")})
    return redirect(url_for("dashboard.login_view"))

@auth_bp.route("/api/me", methods=["GET"])
def get_current_user():
    """Returns information about the authenticated user session."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"authenticated": False}), 401
        
    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return jsonify({"authenticated": False}), 401
        
    return jsonify({
        "authenticated": True,
        "user": user.to_dict()
    })
