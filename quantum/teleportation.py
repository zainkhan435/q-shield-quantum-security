import numpy as np
from typing import Optional, Callable
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from quantum.bell_state import create_bell_pair
from quantum.pauli import apply_pauli_corrections
from quantum.measurements import rotate_to_measurement_basis

def build_teleportation_circuit(
    theta: float = 0.0,
    phi: float = 0.0,
    measurement_basis: str = "Z",
    attack_hook: Optional[Callable[[QuantumCircuit, QuantumRegister, ClassicalRegister], None]] = None
) -> TupleCircuit:
    """
    Assembles a complete Quantum Teleportation circuit for Quantum Digital Signatures.
    
    Qubit mapping:
    - qr[0]: Alice's secret signature qubit (|psi>)
    - qr[1]: Alice's entangled Bell pair half
    - qr[2]: Bob's entangled Bell pair half
    
    Registers:
    - cr_alice (2 bits): Classical transmission of Bell measurement (c0, c1)
    - cr_bob (1 bit): Bob's projective verification measurement
    
    Parameters:
        theta: Polar angle [0, pi] for state preparation Ry(theta)
        phi: Azimuthal angle [0, 2*pi] for phase Rz(phi)
        measurement_basis: 'Z', 'X', or 'Y'
        attack_hook: Optional function injected into circuit to simulate attacks (Eve)
    """
    qr = QuantumRegister(3, name="q")
    cr_alice = ClassicalRegister(2, name="c_alice")
    cr_bob = ClassicalRegister(1, name="c_bob")
    
    circuit = QuantumCircuit(qr, cr_alice, cr_bob, name="QDS_Teleportation")
    
    # 1. Alice prepares signature state |psi> on q0
    if abs(theta) > 1e-6:
        circuit.ry(theta, qr[0])
    if abs(phi) > 1e-6:
        circuit.rz(phi, qr[0])
        
    # 2. Generate entangled Bell pair |Phi+> on q1 and q2
    create_bell_pair(circuit, q_alice=1, q_bob=2)
    
    # 3. If an attack hook is provided that intercepts prior to teleportation/channel
    if attack_hook:
        attack_hook(circuit, qr, cr_alice, "pre_teleportation")
        
    # 4. Alice Bell Measurement: CNOT(q0, q1) then H(q0)
    circuit.cx(qr[0], qr[1])
    circuit.h(qr[0])
    
    # Measure Alice's qubits
    circuit.measure(qr[0], cr_alice[0])
    circuit.measure(qr[1], cr_alice[1])
    
    # 5. Quantum Channel Transmission & Channel-level Attack Hook
    if attack_hook:
        attack_hook(circuit, qr, cr_alice, "in_channel")
        
    # 6. Bob applies Pauli corrections based on classical bits
    apply_pauli_corrections(circuit, q_target=2, cr_alice=cr_alice)
    
    # 7. Post-correction Attack Hook (e.g. Bob verification tampering)
    if attack_hook:
        attack_hook(circuit, qr, cr_alice, "post_correction")
        
    # 8. Basis transformation for Bob's projective measurement
    rotate_to_measurement_basis(circuit, qubit=2, basis=measurement_basis)
    
    # 9. Bob's Projective Verification Measurement
    circuit.measure(qr[2], cr_bob[0])
    
    return circuit, qr, cr_alice, cr_bob

TupleCircuit = tuple[QuantumCircuit, QuantumRegister, ClassicalRegister, ClassicalRegister]
