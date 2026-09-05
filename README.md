# Q-SHIELD: Quantum-Inspired Cyber Threat Detection for Digital Signature Security

**Smart India Hackathon 2026**  
**Problem Statement ID:** SIH26141  
**Organization:** Egreen Quanta LLP  
**Category:** Software | **Theme:** Security  

---

## 1. Project Overview & Deliverables
**Q-SHIELD** is a quantum-cybersecurity verification platform engineered to safeguard **Quantum Digital Signatures (QDS)** against active and passive cyber threats. Unlike classical digital signatures (RSA, ECDSA) which are vulnerable to polynomial-time factoring by Shor's algorithm, QDS leverages the no-cloning theorem, Bell-state entanglement, quantum teleportation, and projective measurement statistics.

### Official SIH Deliverables:
1. **Prototype:** Fully functional web application with interactive quantum network visualization, 3D Three.js Bloch sphere, live execution pipeline, and real-time Qiskit simulation.
2. **Code:** Modular, production-quality Python 3.10+ and Flask codebase with Qiskit 2.5, SQLite persistence, and comprehensive test suite.
3. **Documentation:** Exhaustive technical documentation with mathematical formulation, circuit diagrams, and threat taxonomies.

---

## 2. Core Architecture & Teleportation Protocol
Q-SHIELD models signature transmission using the Bennett et al. (1993) quantum teleportation protocol:

```
Alice (Signer)
      ↓
Quantum State |ψ⟩
      ↓
Bell-State Entanglement |Φ⁺⟩
      ↓
Quantum Teleportation (CNOT, H, Bell Measurement)
      ↓
Quantum Channel (Fiber) ───[ Eve Adversary Tap ]
      ↓
Bob (Verifier)
      ↓
Dynamic Pauli Corrections (X, Z)
      ↓
Projective Measurement across Conjugate Bases (Z, X, Y)
      ↓
Quantum Bit Error Rate (QBER) & Binomial Statistical Z-Score
      ↓
Deterministic Threat Detection Engine (Strictly Non-AI/ML)
      ↓
SQLite Cryptographic Audit Ledger & 3D Bloch Sphere
```

---

## 3. Threat Models & Detection Methodology

### Strictly Zero AI/ML Policy
In critical quantum cryptographic infrastructure, black-box machine learning models (neural networks, random forests, SVMs) introduce unacceptable non-deterministic failure modes and adversarial evasion risks. Q-SHIELD relies exclusively on:
- **Quantum Bit Error Rate (QBER):** $QBER = \frac{N_{\text{error}}}{N_{\text{total}}}$
- **Expected Error Transfer Baseline:** $e_0 = 1.75 \times \text{noise\_rate}$
- **Binomial Standard Error:** $\sigma = \sqrt{\frac{e_0(1 - e_0)}{N}}$
- **Statistical Deviation:** $Z = \frac{|QBER - e_0|}{\sigma}$
- **Deterministic Boundary Rules:** 11.0% QBER theoretical security cutoff and anti-replay nonce tracking.

### Supported Attack Scenarios:
| Scenario | Adversary Mechanism | Observable Effect | System Verdict |
| :--- | :--- | :--- | :--- |
| **Legitimate Communication** | Alice teleports state over calibrated background noise. | $QBER \le 5\%$, nominal variance ($Z < 2\sigma$). | `SECURE` (SUCCESS) |
| **Intercept & Resend** | Eve projectively measures channel qubit $q_2$ in $X$-basis. | Irreversibly collapses Bell pair ($QBER \approx 50\%$). | `ATTACK DETECTED` (FAILED) |
| **Signature Forgery** | Attacker substitutes an altered/inverted quantum state. | Projective measurement flips ($QBER \approx 100\%$). | `SIGNATURE INVALID` (FAILED) |
| **Replay Attack** | Attacker intercepts and resends an earlier valid token. | SQLite nonce ledger detects token was consumed. | `REPLAY DETECTED` (FAILED) |
| **Impersonation** | Unregistered signer transmits without entangled key. | Scrambled probabilities ($QBER \approx 50\%$). | `ATTACK DETECTED` (FAILED) |
| **Channel Manipulation** | Adversary injects physical fiber disturbance/decoherence. | $QBER$ breaches the 11.0% cutoff threshold. | `ATTACK DETECTED` (FAILED) |

---

## 4. Technology Stack
- **Backend:** Python 3.10+, Flask 3.1, Flask-SQLAlchemy 3.1, Werkzeug (PBKDF2 SHA-256 password hashing)
- **Database:** SQLite with SQLAlchemy ORM and transactional collision handling
- **Quantum Simulation:** Qiskit 2.5.2, Qiskit Aer 0.17.2 with dynamic circuits (`if_test`) and `NoiseModel`
- **Frontend:** HTML5, CSS3 (IBM Quantum-inspired clean infrastructure design), Vanilla JavaScript, Three.js (3D Bloch Sphere)
- **Real Hardware (Optional):** Modular IBM Quantum hardware integration layer (`ibm/backend.py`, never faked)

---

## 5. Quick Start & Installation

### Prerequisites
- Python 3.10 or higher
- pip package manager

### 1. Clone & Enter Directory
```bash
cd c:\Users\lenovo\final
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Initialize & Run the Application
```bash
python app.py
```
The application will launch on **`http://127.0.0.1:5000`**.

### Demo Credentials:
- **Researcher Email:** `admin@qshield.security`
- **Password:** `QShield@2026`
*(Pre-seeded automatically into SQLite on first startup, with a convenient 1-click autofill button on the login screen).*

---

## 6. Verification & Automated Testing
To run the automated unit and end-to-end integration test suite:
```bash
python -m unittest discover -s tests
```
All 21 unit & integration tests validate authentication, Bell pairs, teleportation fidelity, all 6 attack simulations, binomial statistical engine, and SQLite transaction integrity.

To execute the live HTTP verification script against the active server:
```bash
python e2e_verification.py
```

---

## 7. Project Structure
```
q-shield/
├── app.py                      # Application factory & entrypoint
├── config.py                   # Configuration & security thresholds
├── requirements.txt            # Dependency manifest
├── README.md                   # Technical documentation
├── .env.example                # Safe environment variable template
├── .gitignore                  # Git ignore rules
├── e2e_verification.py         # HTTP test suite against live server
│
├── database/
│   ├── database.py             # SQLAlchemy instance
│   └── models.py               # User, Experiment, SignatureNonce, SecurityEvent
│
├── quantum/
│   ├── bell_state.py           # Entangled Bell pair generator
│   ├── teleportation.py        # Teleportation circuit with dynamic Pauli gates
│   ├── pauli.py                # Pauli correction matrix operators
│   ├── measurements.py         # Projective basis transforms (Z, X, Y)
│   ├── noise.py                # Aer depolarizing channel noise models
│   └── simulator.py            # AerSimulator runner & Bloch coordinates
│
├── attacks/
│   ├── intercept_resend.py     # Eve projective channel collapse
│   ├── forgery.py              # State inversion & tampering
│   ├── replay.py               # Cryptographic nonce replay evaluator
│   ├── impersonation.py        # Unregistered identity state injection
│   └── channel_manipulation.py # High decoherence channel injection
│
├── detection/
│   ├── qber.py                 # Quantum Bit Error Rate calculation
│   ├── statistics.py           # Binomial standard error & Z-score
│   ├── thresholds.py           # 11% cutoff & 3-sigma security bounds
│   └── threat_detector.py      # Deterministic decision engine
│
├── ibm/
│   └── backend.py              # Optional IBM Quantum hardware bridge
│
├── routes/
│   ├── auth.py                 # Session login, logout & demo user seed
│   ├── dashboard.py            # Protected HTML page views
│   └── api.py                  # REST API endpoints
│
├── templates/
│   ├── base.html               # Master layout with toasts & branding
│   ├── login.html              # Page 1: Enterprise login
│   ├── dashboard.html          # Page 2: Interactive topology & 3D Bloch sphere
│   ├── experiment.html         # Page 3: Lab workbench & counts chart
│   ├── history.html            # Page 4: SQLite experiment ledger & modal
│   └── documentation.html      # Page 5: SIH26141 technical specifications
│
├── static/
│   ├── css/
│   │   └── style.css           # IBM Quantum-inspired styling (responsive)
│   └── js/
│       ├── main.js             # Toast notifications & logout
│       ├── dashboard.js        # Topology animation & metrics sync
│       ├── experiment.js       # Lab pipeline & Qiskit counts chart
│       ├── bloch.js            # Three.js 3D Bloch sphere controller
│       └── history.js          # SQLite ledger filtering & modal
│
├── instance/
│   └── qshield.db              # SQLite persistent database
│
└── tests/
    ├── test_auth.py            # Authentication & session tests
    ├── test_quantum.py         # Circuit fidelity & Bloch math tests
    ├── test_attacks.py         # Attack scenarios tests
    ├── test_detection.py       # Deterministic rules tests
    ├── test_database.py        # Nonce uniqueness & integrity tests
    └── test_e2e_api.py         # End-to-end API tests for all 6 scenarios
```

---

## 8. Scientific Honesty & Limitations
This system is an authentic **quantum simulation and cybersecurity research prototype** designed to demonstrate quantum-measurement-based threat detection principles against digital signatures. It does not claim to replace formally proven production optical hardware or guarantee unconditional physical security against arbitrary side-channel attacks on physical detectors.
