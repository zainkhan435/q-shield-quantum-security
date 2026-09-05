import unittest
from app import create_app
from config import TestConfig
from database.database import db
from database.models import User, Experiment

class TestEndToEndAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        
        # Authenticate user session
        self.client.post("/api/login", json={
            "email": "admin@qshield.security",
            "password": "QShield@2026"
        })

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_run_all_six_scenarios(self):
        """Runs each of the 6 scenarios consecutively through the REST API."""
        scenarios = [
            ("Legitimate Communication", "SECURE", "SUCCESS"),
            ("Intercept & Resend", "ATTACK DETECTED", "FAILED"),
            ("Signature Forgery", "SIGNATURE INVALID", "FAILED"),
            ("Replay Attack", "REPLAY DETECTED", "FAILED"),
            ("Impersonation", "ATTACK DETECTED", "FAILED"),
            ("Channel Manipulation", "ATTACK DETECTED", "FAILED")
        ]
        
        for attack_type, expected_status, expected_verif in scenarios:
            res = self.client.post("/api/experiments/run", json={
                "attack_type": attack_type,
                "shots": 500,
                "noise_level": 0.02,
                "measurement_basis": "Z"
            })
            self.assertEqual(res.status_code, 200, f"Failed on {attack_type}: {res.get_json()}")
            data = res.get_json()
            self.assertTrue(data["success"])
            exp = data["experiment"]
            self.assertEqual(exp["threat_status"], expected_status, f"Status mismatch on {attack_type}")
            self.assertEqual(exp["verification_result"], expected_verif, f"Verification mismatch on {attack_type}")
            self.assertIn("0", exp["measurement_counts"])
            self.assertIn("1", exp["measurement_counts"])

        # Check total experiments in SQLite
        self.assertEqual(Experiment.query.count(), 6)

    def test_dashboard_and_stats_endpoints(self):
        """Verify dashboard overview and statistics calculation."""
        # Run one secure and one attack experiment
        self.client.post("/api/experiments/run", json={"attack_type": "Legitimate Communication", "shots": 200})
        self.client.post("/api/experiments/run", json={"attack_type": "Intercept & Resend", "shots": 200})
        
        # Test dashboard API
        dash_res = self.client.get("/api/dashboard")
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.get_json()
        self.assertEqual(dash_data["total_experiments"], 2)
        self.assertEqual(dash_data["attacks_detected"], 1)
        self.assertEqual(dash_data["secure_sessions"], 1)
        
        # Test statistics API
        stat_res = self.client.get("/api/statistics")
        self.assertEqual(stat_res.status_code, 200)
        stat_data = stat_res.get_json()
        self.assertEqual(stat_data["total_runs"], 2)

    def test_pages_render_authenticated(self):
        """Verify all pages render with status 200."""
        for path in ["/dashboard", "/experiment", "/history", "/documentation"]:
            res = self.client.get(path)
            self.assertEqual(res.status_code, 200, f"Failed to render {path}")

if __name__ == "__main__":
    unittest.main()
