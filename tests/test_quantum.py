import unittest
import numpy as np
from quantum.bell_state import create_bell_pair
from quantum.teleportation import build_teleportation_circuit
from quantum.simulator import run_quantum_simulation, calculate_bloch_coordinates
from quantum.noise import create_channel_noise_model
from qiskit import QuantumCircuit

class TestQuantumCore(unittest.TestCase):
    def test_bell_pair_circuit(self):
        """Test Bell state generation circuit."""
        qc = QuantumCircuit(2)
        create_bell_pair(qc, 0, 1, state_type="phi_plus")
        self.assertEqual(len(qc.data), 2)  # H and CX gates

    def test_ideal_teleportation_simulation(self):
        """Test ideal quantum teleportation achieves >98% fidelity for state |0>."""
        circuit, _, _, _ = build_teleportation_circuit(
            theta=0.0,
            phi=0.0,
            measurement_basis="Z"
        )
        result = run_quantum_simulation(circuit, shots=1000, noise_rate=0.0)
        bob_counts = result["bob_counts"]
        # In ideal zero-noise simulation, state |0> should teleport with 100% fidelity
        self.assertEqual(bob_counts.get("1", 0), 0)
        self.assertEqual(bob_counts.get("0", 0), 1000)

    def test_bloch_coordinates(self):
        """Test Bloch sphere spherical to cartesian conversion."""
        # North pole (|0>)
        bloch_0 = calculate_bloch_coordinates(theta=0.0, phi=0.0)
        self.assertAlmostEqual(bloch_0["z"], 1.0, places=2)
        self.assertAlmostEqual(bloch_0["x"], 0.0, places=2)
        
        # South pole (|1>)
        bloch_1 = calculate_bloch_coordinates(theta=np.pi, phi=0.0)
        self.assertAlmostEqual(bloch_1["z"], -1.0, places=2)
        
        # Equator (|+>)
        bloch_plus = calculate_bloch_coordinates(theta=np.pi / 2, phi=0.0)
        self.assertAlmostEqual(bloch_plus["x"], 1.0, places=2)
        self.assertAlmostEqual(bloch_plus["z"], 0.0, places=2)

    def test_channel_noise_model(self):
        """Test noise model creation for Qiskit Aer."""
        noise = create_channel_noise_model(0.10)
        self.assertIsNotNone(noise)
        
        zero_noise = create_channel_noise_model(0.0)
        self.assertIsNone(zero_noise)

if __name__ == "__main__":
    unittest.main()
