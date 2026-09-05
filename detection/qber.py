from typing import Dict

def calculate_qber(bob_counts: Dict[str, int], expected_state: str = "0") -> float:
    """
    Calculates the Quantum Bit Error Rate (QBER).
    
    QBER = N_error / (N_correct + N_error)
    
    Parameters:
        bob_counts: Dict with counts {'0': count0, '1': count1}
        expected_state: '0' or '1' representing the expected projective eigenstate
        
    Returns:
        Float QBER between 0.0 and 1.0
    """
    total = bob_counts.get("0", 0) + bob_counts.get("1", 0)
    if total == 0:
        return 0.0
        
    error_state = "1" if expected_state == "0" else "0"
    n_error = bob_counts.get(error_state, 0)
    
    return float(n_error) / float(total)
