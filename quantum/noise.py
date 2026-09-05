from typing import Optional
from qiskit_aer.noise import NoiseModel, depolarizing_error, phase_damping_error

def create_channel_noise_model(noise_rate: float, noise_type: str = "depolarizing") -> Optional[NoiseModel]:
    """
    Constructs a Qiskit Aer NoiseModel representing environmental decoherence
    or quantum channel degradation.
    
    Parameters:
        noise_rate: Float between 0.0 and 0.20 (0% to 20%)
        noise_type: 'depolarizing' or 'phase_damping'
        
    Returns:
        NoiseModel instance or None if noise_rate is negligible.
    """
    if noise_rate <= 1e-4:
        return None
        
    noise_rate = min(max(noise_rate, 0.0), 0.20)
    noise_model = NoiseModel()
    
    # 1-qubit error for single-qubit gates and channel transmission
    if noise_type == "depolarizing":
        error_1q = depolarizing_error(noise_rate, 1)
        # 2-qubit error scaled proportionally
        error_2q = depolarizing_error(min(noise_rate * 1.5, 0.30), 2)
    else:
        error_1q = phase_damping_error(noise_rate)
        error_2q = depolarizing_error(noise_rate, 2)
        
    # Apply to standard basis gates
    single_qubit_gates = ["x", "z", "h", "ry", "rz", "sdg", "s", "sx", "id"]
    noise_model.add_all_qubit_quantum_error(error_1q, single_qubit_gates)
    noise_model.add_all_qubit_quantum_error(error_2q, ["cx"])
    
    return noise_model
