from typing import Tuple, Optional
from database.models import SignatureNonce

def evaluate_replay_attack(token: Optional[str] = None, simulate_replay: bool = False) -> Tuple[bool, str, Optional[SignatureNonce]]:
    """
    Evaluates whether the incoming signature request constitutes a Replay Attack.
    
    Checks the cryptographic nonce against the SQLite SignatureNonce ledger.
    
    Returns:
        (is_replay: bool, reason_message: str, nonce_obj: Optional[SignatureNonce])
    """
    if simulate_replay:
        # User explicitly requested a Replay Attack simulation:
        # Find the latest consumed nonce or create and consume one to demonstrate detection
        consumed_nonce = SignatureNonce.query.filter_by(is_consumed=True).order_by(SignatureNonce.id.desc()).first()
        if not consumed_nonce:
            # Create and consume a dummy nonce for this test demonstration
            consumed_nonce = SignatureNonce.create_unique_nonce()
            consumed_nonce.consume()
            
        return (
            True,
            f"Replay Attack Detected: Nonce '{consumed_nonce.token[:16]}...' was already consumed at "
            f"{consumed_nonce.consumed_at.strftime('%Y-%m-%d %H:%M:%S UTC') if consumed_nonce.consumed_at else 'earlier timestamp'}. "
            "Re-transmission of consumed quantum signature token is rejected.",
            consumed_nonce
        )
        
    if not token:
        # Fresh legitimate transaction without explicit token
        return False, "Legitimate fresh signature token generated.", None
        
    # Check existing token in database
    existing_nonce = SignatureNonce.query.filter_by(token=token).first()
    if existing_nonce and existing_nonce.is_consumed:
        return (
            True,
            f"Replay Attack Detected: Nonce '{token[:16]}...' has already been consumed. "
            "Anti-replay ledger prevents duplicate authentication.",
            existing_nonce
        )
        
    return False, "Token is fresh and valid.", existing_nonce
