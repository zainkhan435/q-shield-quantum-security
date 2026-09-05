from qiskit import QuantumCircuit

def create_bell_pair(circuit: QuantumCircuit, q_alice: int, q_bob: int, state_type: str = "phi_plus") -> QuantumCircuit:
    """
    Entangles two qubits into a maximally entangled Bell state.
    
    Default is |Phi+> = (|00> + |11>) / sqrt(2).
    
    Parameters:
        circuit: Existing QuantumCircuit
        q_alice: Index of Alice's entangled qubit (q1)
        q_bob: Index of Bob's entangled qubit (q2)
        state_type: 'phi_plus', 'phi_minus', 'psi_plus', 'psi_minus'
    """
    # Create |Phi+>
    circuit.h(q_alice)
    circuit.cx(q_alice, q_bob)
    
    if state_type == "phi_minus":
        circuit.z(q_alice)
    elif state_type == "psi_plus":
        circuit.x(q_bob)
    elif state_type == "psi_minus":
        circuit.x(q_bob)
        circuit.z(q_alice)
        
    return circuit
