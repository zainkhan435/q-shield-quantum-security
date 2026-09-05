from typing import Dict, Tuple
from qiskit import QuantumCircuit, ClassicalRegister

def rotate_to_measurement_basis(circuit: QuantumCircuit, qubit: int, basis: str = "Z") -> QuantumCircuit:
    """
    Applies the appropriate single-qubit unitary rotation to measure in the specified basis.
    
    Bases:
    - 'Z': Computational basis {|0>, |1>} (standard measurement, no pre-rotation)
    - 'X': Hadamard basis {|+>, |->} (apply H before measurement)
    - 'Y': Circular basis {|+i>, |-i>} (apply Sdg then H before measurement)
    """
    basis_upper = basis.upper()
    if basis_upper == "X":
        circuit.h(qubit)
    elif basis_upper == "Y":
        circuit.sdg(qubit)
        circuit.h(qubit)
    # Z basis requires no pre-rotation
    return circuit

def parse_teleportation_counts(raw_counts: Dict[str, int]) -> Dict[str, any]:
    """
    Parses Qiskit Aer measurement counts from a teleportation experiment.
    
    Qiskit bitstrings for registers (cr_bob, cr_alice) are formatted as:
    '<cr_bob_bit> <cr_alice_bits>' e.g. '0 01' or concatenated '001' (where bob is highest index).
    
    Returns structured dictionary with:
    - bob_counts: {'0': count, '1': count}
    - joint_counts: detailed counts per outcome
    - total_shots: total measurement count
    """
    bob_counts = {"0": 0, "1": 0}
    joint_counts = {}
    total_shots = sum(raw_counts.values())
    
    for bitstring, count in raw_counts.items():
        clean_str = bitstring.replace(" ", "")
        joint_counts[bitstring] = count
        
        # Bob's bit is the leftmost bit when bob register was added last
        # or first register before space
        if " " in bitstring:
            parts = bitstring.split(" ")
            bob_bit = parts[0]
        else:
            bob_bit = clean_str[0]
            
        if bob_bit in bob_counts:
            bob_counts[bob_bit] += count
            
    return {
        "bob_counts": bob_counts,
        "joint_counts": joint_counts,
        "total_shots": total_shots,
        "p0": bob_counts["0"] / total_shots if total_shots > 0 else 0.0,
        "p1": bob_counts["1"] / total_shots if total_shots > 0 else 0.0
    }
