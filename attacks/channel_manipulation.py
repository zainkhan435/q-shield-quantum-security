from typing import Tuple

def configure_channel_manipulation(requested_noise: float) -> Tuple[float, str]:
    """
    Simulates Quantum Channel Manipulation / Excessive Environmental Decoherence.
    
    Mechanism:
    - Adversary tampers with the fiber-optic quantum channel or injects strong environmental
      disturbances (optical cross-talk, intentional phase jitter, or high thermal noise).
    - Forces the effective channel noise to jump above the critical QDS security cutoff (11% QBER).
    
    Returns:
        (effective_noise_rate: float, description: str)
    """
    # Enforce severe channel degradation (between 14% and 20% depolarizing rate)
    manipulated_noise = max(requested_noise, 0.15)
    description = (
        f"Quantum Channel Manipulation active: Channel depolarizing noise forced to "
        f"{manipulated_noise * 100:.1f}%, exceeding tolerable QDS decoherence limits."
    )
    return manipulated_noise, description
