import json
import secrets
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from database.database import db

class User(db.Model):
    """User model for session authentication."""
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default="researcher")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Experiment(db.Model):
    """Experiment model storing quantum simulation runs and threat analyses."""
    __tablename__ = "experiments"
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    attack_type = db.Column(db.String(64), nullable=False)
    shots = db.Column(db.Integer, nullable=False, default=1000)
    noise_level = db.Column(db.Float, nullable=False, default=0.0)
    measurement_basis = db.Column(db.String(16), nullable=False, default="Z")
    
    qber = db.Column(db.Float, nullable=False, default=0.0)
    expected_error = db.Column(db.Float, nullable=False, default=0.0)
    observed_error = db.Column(db.Float, nullable=False, default=0.0)
    statistical_deviation = db.Column(db.Float, nullable=False, default=0.0)
    
    verification_result = db.Column(db.String(32), nullable=False)  # SUCCESS, FAILED
    threat_status = db.Column(db.String(32), nullable=False)        # SECURE, ATTACK DETECTED, SIGNATURE INVALID, REPLAY DETECTED, SUSPICIOUS
    reason = db.Column(db.Text, nullable=False)
    
    # Serialized JSON structures
    _quantum_state = db.Column("quantum_state", db.Text, nullable=True)
    _measurement_counts = db.Column("measurement_counts", db.Text, nullable=True)
    
    execution_backend = db.Column(db.String(64), nullable=False, default="Local Qiskit Aer Simulator")
    
    # Relationship to nonces
    nonces = db.relationship("SignatureNonce", backref="experiment", lazy=True, cascade="all, delete-orphan")
    security_events = db.relationship("SecurityEvent", backref="experiment", lazy=True, cascade="all, delete-orphan")

    @property
    def quantum_state(self):
        if self._quantum_state:
            try:
                return json.loads(self._quantum_state)
            except (ValueError, TypeError):
                return {}
        return {}

    @quantum_state.setter
    def quantum_state(self, value):
        self._quantum_state = json.dumps(value) if value is not None else None

    @property
    def measurement_counts(self):
        if self._measurement_counts:
            try:
                return json.loads(self._measurement_counts)
            except (ValueError, TypeError):
                return {}
        return {}

    @measurement_counts.setter
    def measurement_counts(self, value):
        self._measurement_counts = json.dumps(value) if value is not None else None

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None,
            "iso_timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "attack_type": self.attack_type,
            "shots": self.shots,
            "noise_level": round(self.noise_level, 4),
            "noise_percentage": f"{self.noise_level * 100:.1f}%",
            "measurement_basis": self.measurement_basis,
            "qber": round(self.qber, 4),
            "qber_percentage": f"{self.qber * 100:.2f}%",
            "expected_error": round(self.expected_error, 4),
            "expected_error_percentage": f"{self.expected_error * 100:.2f}%",
            "observed_error": round(self.observed_error, 4),
            "observed_error_percentage": f"{self.observed_error * 100:.2f}%",
            "statistical_deviation": round(self.statistical_deviation, 2),
            "verification_result": self.verification_result,
            "threat_status": self.threat_status,
            "reason": self.reason,
            "quantum_state": self.quantum_state,
            "measurement_counts": self.measurement_counts,
            "execution_backend": self.execution_backend
        }

class SignatureNonce(db.Model):
    """
    Cryptographic nonce ledger for Quantum Digital Signatures.
    Guarantees anti-replay protection.
    """
    __tablename__ = "signature_nonces"
    
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(128), unique=True, nullable=False, index=True)
    experiment_id = db.Column(db.Integer, db.ForeignKey("experiments.id"), nullable=True)
    is_consumed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    consumed_at = db.Column(db.DateTime, nullable=True)
    
    @classmethod
    def create_unique_nonce(cls, experiment_id=None, max_retries=5):
        """
        Safely generates and persists a unique cryptographic nonce with transaction rollback.
        Guarantees no SQLite unique constraint crash.
        """
        for _ in range(max_retries):
            token = f"tok_{secrets.token_urlsafe(32)}"
            nonce = cls(
                token=token,
                experiment_id=experiment_id,
                is_consumed=False,
                created_at=datetime.now(timezone.utc)
            )
            try:
                db.session.add(nonce)
                db.session.commit()
                return nonce
            except IntegrityError:
                db.session.rollback()
                continue
        raise RuntimeError("Failed to generate unique signature nonce after max retries")

    def consume(self):
        self.is_consumed = True
        self.consumed_at = datetime.now(timezone.utc)
        db.session.commit()

    def to_dict(self):
        return {
            "id": self.id,
            "token": self.token,
            "experiment_id": self.experiment_id,
            "is_consumed": self.is_consumed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "consumed_at": self.consumed_at.isoformat() if self.consumed_at else None
        }

class SecurityEvent(db.Model):
    """Audit log of detected threats and security violations."""
    __tablename__ = "security_events"
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    event_type = db.Column(db.String(64), nullable=False)
    severity = db.Column(db.String(32), nullable=False) # CRITICAL, WARNING, INFO
    description = db.Column(db.Text, nullable=False)
    experiment_id = db.Column(db.Integer, db.ForeignKey("experiments.id"), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None,
            "event_type": self.event_type,
            "severity": self.severity,
            "description": self.description,
            "experiment_id": self.experiment_id
        }
