import unittest
from app import create_app
from config import TestConfig
from database.database import db
from database.models import User, Experiment, SignatureNonce, SecurityEvent

class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_experiment_persistence(self):
        """Verify experiment record creation, JSON properties, and retrieval."""
        exp = Experiment(
            attack_type="Intercept & Resend",
            shots=1000,
            noise_level=0.03,
            measurement_basis="Z",
            qber=0.24,
            expected_error=0.015,
            observed_error=0.24,
            statistical_deviation=9.8,
            verification_result="FAILED",
            threat_status="ATTACK DETECTED",
            reason="Channel collapse detected",
            execution_backend="Local Qiskit Aer Simulator"
        )
        exp.quantum_state = {"theta": 1.57, "phi": 0.0, "x": 1.0, "y": 0.0, "z": 0.0, "purity": 0.4}
        exp.measurement_counts = {"0": 760, "1": 240}
        
        db.session.add(exp)
        db.session.commit()
        
        retrieved = db.session.get(Experiment, exp.id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.attack_type, "Intercept & Resend")
        self.assertEqual(retrieved.quantum_state["x"], 1.0)
        self.assertEqual(retrieved.measurement_counts["0"], 760)

    def test_signature_nonce_uniqueness_and_consumption(self):
        """Verify unique cryptographic nonce generation and consumption."""
        nonce1 = SignatureNonce.create_unique_nonce()
        self.assertIsNotNone(nonce1.token)
        self.assertTrue(nonce1.token.startswith("tok_"))
        self.assertFalse(nonce1.is_consumed)
        
        nonce1.consume()
        self.assertTrue(nonce1.is_consumed)
        self.assertIsNotNone(nonce1.consumed_at)
        
        nonce2 = SignatureNonce.create_unique_nonce()
        self.assertNotEqual(nonce1.token, nonce2.token)

    def test_security_event_logging(self):
        """Verify security event audit logging."""
        event = SecurityEvent(
            event_type="ATTACK DETECTED",
            severity="CRITICAL",
            description="Intercept & Resend attack flagged"
        )
        db.session.add(event)
        db.session.commit()
        
        saved = db.session.get(SecurityEvent, event.id)
        self.assertIsNotNone(saved)
        self.assertEqual(saved.severity, "CRITICAL")

if __name__ == "__main__":
    unittest.main()
