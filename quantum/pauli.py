from qiskit import QuantumCircuit, ClassicalRegister

def apply_pauli_corrections(circuit: QuantumCircuit, q_target: int, cr_alice: ClassicalRegister) -> QuantumCircuit:
    """
    Applies conditional Pauli corrections on Bob's qubit based on Alice's classical measurement bits.
    
    In standard teleportation:
    - Alice measures state qubit (bit 0) and Bell qubit (bit 1).
    - If bit 1 == 1, Bob applies X.
    - If bit 0 == 1, Bob applies Z.
    
    This reconstructs the exact original state |psi> on Bob's qubit without violation
    of the no-cloning theorem.
    """
    # Dynamic circuit conditional logic in Qiskit 2.x
    with circuit.if_test((cr_alice[1], 1)):
        circuit.x(q_target)
    with circuit.if_test((cr_alice[0], 1)):
        circuit.z(q_target)
        
    return circuit
