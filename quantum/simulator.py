import math
import numpy as np
from typing import Dict, Any, Optional
import qiskit
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from quantum.noise import create_channel_noise_model
from quantum.measurements import parse_teleportation_counts

def calculate_bloch_coordinates(theta: float, phi: float, purity: float = 1.0) -> Dict[str, float]:
    """
    Computes Cartesian (x, y, z) and spherical (theta, phi) coordinates
    on the Bloch Sphere.
    
    |psi> = cos(theta/2)|0> + e^(i*phi) sin(theta/2)|1>
    x = r * sin(theta) * cos(phi)
    y = r * sin(theta) * sin(phi)
    z = r * cos(theta)
    
    where r = purity (1.0 for pure state, < 1.0 for mixed/decohered states).
    """
    r = max(0.0, min(1.0, purity))
    x = r * math.sin(theta) * math.cos(phi)
    y = r * math.sin(theta) * math.sin(phi)
    z = r * math.cos(theta)
    
    return {
        "theta": round(float(theta), 4),
        "phi": round(float(phi), 4),
        "x": round(float(x), 4),
        "y": round(float(y), 4),
        "z": round(float(z), 4),
        "purity": round(float(r), 4)
    }

def run_quantum_simulation(
    circuit: QuantumCircuit,
    shots: int = 1000,
    noise_rate: float = 0.0,
    noise_type: str = "depolarizing"
) -> Dict[str, Any]:
    """
    Executes the prepared quantum circuit using Qiskit AerSimulator.
    
    Parameters:
        circuit: QuantumCircuit to execute
        shots: Number of simulation shots (e.g. 100 to 5000)
        noise_rate: Channel noise level (0.0 to 0.20)
        noise_type: 'depolarizing' or 'phase_damping'
        
    Returns:
        Dictionary containing raw counts, parsed Bob counts, total shots, and backend metadata.
    """
    noise_model = create_channel_noise_model(noise_rate, noise_type)
    
    # Initialize AerSimulator
    simulator = AerSimulator()
    
    # Transpile circuit for simulator target
    transpiled_circuit = qiskit.transpile(circuit, simulator)
    
    # Run simulation
    job = simulator.run(transpiled_circuit, shots=shots, noise_model=noise_model)
    result = job.result()
    raw_counts = result.get_counts()
    
    parsed = parse_teleportation_counts(raw_counts)
    
    return {
        "raw_counts": raw_counts,
        "bob_counts": parsed["bob_counts"],
        "joint_counts": parsed["joint_counts"],
        "total_shots": parsed["total_shots"],
        "p0": parsed["p0"],
        "p1": parsed["p1"],
        "backend": "Local Qiskit Aer Simulator",
        "noise_applied": noise_rate > 0.0,
        "noise_rate": noise_rate
    }
