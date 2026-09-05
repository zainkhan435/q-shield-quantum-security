import unittest
from detection.qber import calculate_qber
from detection.statistics import calculate_statistical_deviation
from detection.threat_detector import evaluate_threat

class TestDetectionEngine(unittest.TestCase):
    def test_qber_calculation(self):
        """Test exact calculation of QBER."""
        counts = {"0": 950, "1": 50}
        qber = calculate_qber(counts, expected_state="0")
        self.assertAlmostEqual(qber, 0.05, places=3)
        
        # Zero error
        counts_clean = {"0": 1000, "1": 0}
        self.assertEqual(calculate_qber(counts_clean, expected_state="0"), 0.0)

    def test_statistical_deviation_zscore(self):
        """Test binomial Z-score analysis."""
        # Baseline circuit error for noise_rate=0.02 is 0.035 (3.5%).
        # Observed 0.035 yields nominal Z-score near 0.
        stat_nominal = calculate_statistical_deviation(observed_qber=0.035, noise_rate=0.02, shots=1000)
        self.assertLess(stat_nominal["z_score"], 1.5)
        
        # Expected error: 0.035 (3.5%), Observed: 0.25 (anomalous intrusion)
        stat_intrusion = calculate_statistical_deviation(observed_qber=0.25, noise_rate=0.02, shots=1000)
        self.assertGreater(stat_intrusion["z_score"], 10.0)

    def test_threat_decision_rules(self):
        """Verify deterministic threshold-based decision rules."""
        # 1. Legitimate Secure
        decision_sec = evaluate_threat(
            qber=0.02,
            expected_error=0.02,
            z_score=0.8,
            attack_type="Legitimate Communication"
        )
        self.assertEqual(decision_sec["threat_status"], "SECURE")
        self.assertEqual(decision_sec["verification_result"], "SUCCESS")

        # 2. Critical QBER Breach (> 11%)
        decision_breach = evaluate_threat(
            qber=0.18,
            expected_error=0.02,
            z_score=8.5,
            attack_type="Channel Manipulation"
        )
        self.assertEqual(decision_breach["threat_status"], "ATTACK DETECTED")
        self.assertEqual(decision_breach["verification_result"], "FAILED")

        # 3. Forgery
        decision_forgery = evaluate_threat(
            qber=0.98,
            expected_error=0.01,
            z_score=40.0,
            attack_type="Signature Forgery"
        )
        self.assertEqual(decision_forgery["threat_status"], "SIGNATURE INVALID")
        self.assertEqual(decision_forgery["verification_result"], "FAILED")

        # 4. Replay
        decision_replay = evaluate_threat(
            qber=0.01,
            expected_error=0.01,
            z_score=0.0,
            attack_type="Replay Attack",
            is_replay=True,
            replay_reason="Nonce consumed"
        )
        self.assertEqual(decision_replay["threat_status"], "REPLAY DETECTED")
        self.assertEqual(decision_replay["verification_result"], "FAILED")

if __name__ == "__main__":
    unittest.main()
