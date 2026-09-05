import numpy as np
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister

def apply_forgery_attack(circuit: QuantumCircuit, qr: QuantumRegister, cr_alice: ClassicalRegister, stage: str):
    """
    Simulates a Signature Forgery Attack.
    
    Mechanism:
    - An adversary attempts to sign a message using an invalid or forged quantum state.
    - Instead of Alice's legitimate secret signature state |psi(theta, phi)>, the attacker
      substitutes an orthogonal or forged state (applying an X / Z flip to the signature qubit).
    
    Quantum effect:
    - When Bob performs projective verification against the expected signature key,
      the measurement outcome is inverted or statistically incompatible, leading to an
      immediate signature verification rejection.
    """
    if stage == "pre_teleportation":
        # Attacker tampers with the signature qubit q0 before teleportation
        circuit.x(qr[0])
        circuit.z(qr[0])
