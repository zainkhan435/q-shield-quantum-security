from functools import wraps
from flask import Blueprint, render_template, session, redirect, url_for
from database.models import User

dashboard_bp = Blueprint("dashboard", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("dashboard.login_view"))
        return f(*args, **kwargs)
    return decorated_function

@dashboard_bp.route("/")
def index_view():
    if "user_id" in session:
        return redirect(url_for("dashboard.dashboard_view"))
    return redirect(url_for("dashboard.login_view"))

@dashboard_bp.route("/login")
def login_view():
    if "user_id" in session:
        return redirect(url_for("dashboard.dashboard_view"))
    return render_template("login.html")

@dashboard_bp.route("/dashboard")
@login_required
def dashboard_view():
    return render_template("dashboard.html", user_email=session.get("user_email"))

@dashboard_bp.route("/lab")
@dashboard_bp.route("/quantum-lab")
@login_required
def lab_view():
    return render_template("lab.html", user_email=session.get("user_email"))

@dashboard_bp.route("/experiment")
@dashboard_bp.route("/threat-detection")
@login_required
def experiment_view():
    return render_template("experiment.html", user_email=session.get("user_email"))

@dashboard_bp.route("/history")
@login_required
def history_view():
    return render_template("history.html", user_email=session.get("user_email"))

@dashboard_bp.route("/documentation")
def documentation_view():
    return render_template("documentation.html", user_email=session.get("user_email"))

