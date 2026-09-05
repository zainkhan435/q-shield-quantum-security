import unittest
from app import create_app
from config import TestConfig
from database.database import db
from database.models import SignatureNonce
from quantum.teleportation import build_teleportation_circuit
from quantum.simulator import run_quantum_simulation
from attacks.intercept_resend import apply_intercept_resend_attack
from attacks.forgery import apply_forgery_attack
from attacks.impersonation import apply_impersonation_attack
from attacks.channel_manipulation import configure_channel_manipulation
from attacks.replay import evaluate_replay_attack
from detection.qber import calculate_qber

class TestAttacks(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_intercept_resend_attack(self):
        """Verify Intercept & Resend induces high QBER (approx 20% to 60%)."""
        circuit, _, _, _ = build_teleportation_circuit(
            theta=0.0,
            phi=0.0,
            measurement_basis="Z",
            attack_hook=apply_intercept_resend_attack
        )
        res = run_quantum_simulation(circuit, shots=1000)
        qber = calculate_qber(res["bob_counts"], expected_state="0")
        # Collapsed entanglement should yield significant error
        self.assertGreater(qber, 0.15)

    def test_forgery_attack(self):
        """Verify Signature Forgery inverts the measured eigenstate."""
        circuit, _, _, _ = build_teleportation_circuit(
            theta=0.0,
            phi=0.0,
            measurement_basis="Z",
            attack_hook=apply_forgery_attack
        )
        res = run_quantum_simulation(circuit, shots=1000)
        qber = calculate_qber(res["bob_counts"], expected_state="0")
        # Forged state inverted
        self.assertGreater(qber, 0.90)

    def test_replay_attack_evaluation(self):
        """Verify anti-replay detection without database crashes."""
        # Create and consume a nonce
        nonce = SignatureNonce.create_unique_nonce()
        nonce.consume()
        
        # Test replay check
        is_replay, reason, _ = evaluate_replay_attack(token=nonce.token)
        self.assertTrue(is_replay)
        self.assertIn("Replay Attack Detected", reason)
        
        # Test fresh token is not replay
        fresh_nonce = SignatureNonce.create_unique_nonce()
        is_replay_fresh, _, _ = evaluate_replay_attack(token=fresh_nonce.token)
        self.assertFalse(is_replay_fresh)

    def test_channel_manipulation(self):
        """Verify channel manipulation forces effective noise above cutoff."""
        noise, desc = configure_channel_manipulation(0.02)
        self.assertGreaterEqual(noise, 0.15)
        self.assertIn("exceeding tolerable QDS", desc)

if __name__ == "__main__":
    unittest.main()
