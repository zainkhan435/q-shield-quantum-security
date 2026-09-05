from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister

def apply_intercept_resend_attack(circuit: QuantumCircuit, qr: QuantumRegister, cr_alice: ClassicalRegister, stage: str):
    """
    Simulates Eve's Intercept & Resend eavesdropping attack on the Quantum Channel.
    
    Physical Mechanism:
    - Eve intercepts the flying qubit in the channel (q2) before Bob receives it.
    - Eve measures the qubit projectively in an arbitrary basis (e.g. Hadamard X basis).
    - This measurement irreversibly collapses the entangled Bell pair (|Phi+>).
    - Eve re-prepares a replacement state based on her measurement outcome (e.g. |+>) and forwards it.
    
    Quantum Effect:
    - The Bell entanglement between Alice and Bob is permanently severed.
    - Teleportation Pauli corrections on Bob's side fail, scrambling Bob's projective outcomes.
    - Observed QBER jumps from near 0% to approximately 50%, triggering deterministic detection.
    """
    if stage == "in_channel":
        # Eve's projective intercept and re-preparation:
        # Collapse the entangled channel qubit q2 and resend a prepared state
        circuit.reset(qr[2])
        circuit.h(qr[2])
