import unittest
from app import create_app
from config import TestConfig
from database.database import db
from database.models import User

class TestAuth(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_demo_user_seeded(self):
        """Verify default demo user exists and has valid hashed password."""
        user = User.query.filter_by(email="admin@qshield.security").first()
        self.assertIsNotNone(user)
        self.assertTrue(user.check_password("QShield@2026"))
        self.assertFalse(user.check_password("WrongPassword"))

    def test_login_success(self):
        """Test login API with valid credentials."""
        res = self.client.post("/api/login", json={
            "email": "admin@qshield.security",
            "password": "QShield@2026"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("user", data)

    def test_login_invalid_password(self):
        """Test login rejection on invalid password."""
        res = self.client.post("/api/login", json={
            "email": "admin@qshield.security",
            "password": "incorrect_password"
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data["success"])

    def test_logout(self):
        """Test logout session termination."""
        # Login first
        self.client.post("/api/login", json={
            "email": "admin@qshield.security",
            "password": "QShield@2026"
        })
        res = self.client.post("/api/logout")
        self.assertEqual(res.status_code, 200)
        
        # Verify session cleared
        me_res = self.client.get("/api/me")
        self.assertEqual(me_res.status_code, 401)

if __name__ == "__main__":
    unittest.main()
