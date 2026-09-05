# Quantum Digital Signature Security Thresholds
# Grounded in quantum information theory and statistical confidence

# Standard 11% theoretical maximum threshold (QKD & teleportation-based QDS security cutoff)
# Beyond 11%, information leakage to an eavesdropper exceeds classical error-correction limits
QBER_SECURITY_CUTOFF = 0.11

# Statistical decision thresholds (Z-score standard deviations)
Z_CRITICAL_THRESHOLD = 3.0    # 3-sigma (p < 0.0027, 99.73% confidence of active intrusion)
Z_WARNING_THRESHOLD = 2.0     # 2-sigma (p < 0.0455, 95.45% confidence warning)

# Expected baseline measurement fidelity
MIN_FIDELITY_FOR_VERIFICATION = 0.85
