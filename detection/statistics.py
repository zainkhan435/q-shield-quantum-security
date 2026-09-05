import math
from typing import Dict, Any

def calculate_statistical_deviation(
    observed_qber: float,
    noise_rate: float,
    shots: int
) -> Dict[str, Any]:
    """
    Performs rigorous binomial statistical analysis comparing observed QBER
    against expected background quantum circuit and channel noise.
    
    In a teleportation protocol involving Bell pair distribution, Bell measurements,
    and conditional Pauli corrections, the cumulative depolarizing error transfer
    function is: e_0 ≈ 1.75 * noise_rate.
    
    Parameters:
        observed_qber: Observed error rate from measurement counts
        noise_rate: Configured channel noise parameter (0.0 to 0.20)
        shots: Number of measurement shots (sample size N)
        
    Returns:
        Dictionary containing:
        - expected_error: Theoretical circuit baseline error
        - standard_error: Binomial standard error (sigma)
        - z_score: Statistical deviation in standard deviations (Z)
        - shots: Total shots analyzed
    """
    shots = max(shots, 1)
    
    # Circuit noise transfer function
    expected_error = min(0.50, max(0.0, noise_rate * 1.75))
    
    # Binomial variance sigma = sqrt(p * (1 - p) / N)
    effective_p = max(expected_error, 0.01)
    variance = (effective_p * (1.0 - effective_p)) / float(shots)
    sigma = math.sqrt(max(variance, 1e-6))
    
    deviation = abs(observed_qber - expected_error)
    z_score = deviation / sigma
    
    return {
        "expected_error": round(expected_error, 4),
        "observed_error": round(observed_qber, 4),
        "standard_error": round(sigma, 5),
        "z_score": round(z_score, 2),
        "shots": shots
    }
