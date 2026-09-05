/**
 * Q-SHIELD Dashboard Controller
 * Synchronizes 3D Quantum Network Globe, 3D Bloch Sphere, telemetry, and live event ledger
 */

const STAGE_LABELS = {
    1: "01 STATE PREPARATION: Alice preparing target eigenstate |ψ⟩",
    2: "02 BELL ENTANGLEMENT: Generating Bell Pair |Φ⁺⟩ on (q₁, q₂)",
    3: "03 BELL MEASUREMENT: Alice joint projective measurement",
    4: "04 CLASSICAL FEED (c₀, c₁): Transmitting bits over classical channel",
    5: "05 PAULI CORRECTION: Bob applying dynamic Pauli (X, Z)",
    6: "06 PROJECTIVE MEASUREMENT: Bob measuring collapsed quantum state",
    7: "07 VERIFICATION: Bob & Charlie cross-verifying signature parity",
    8: "08 STATISTICAL ANALYSIS: Evaluating QBER against 11% cutoff limit",
    9: "09 FINAL SECURITY DECISION: Deterministic verdict calculated"
};

let latestExperimentData = null;

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) return;
        const data = await response.json();
        
        latestExperimentData = data.latest_experiment;
        
        if (latestExperimentData) {
            updateMetrics(latestExperimentData);
            updateNetworkVisualization(latestExperimentData);
            if (typeof updateBlochState === 'function') {
                updateBlochState(latestExperimentData.quantum_state);
            }
        } else {
            // Default standby state
            const statusEl = document.getElementById('metric-threat-status');
            if (statusEl) {
                statusEl.textContent = 'SECURE (STANDBY)';
                statusEl.className = 'telemetry-pill pill-secure';
            }
            const reasonEl = document.getElementById('metric-reason');
            if (reasonEl) {
                reasonEl.textContent = 'System ready. Launch experiment to audit channel.';
            }
        }
        
        renderRecentEvents(data.recent_experiments);
        
    } catch (err) {
        console.error('Failed to load dashboard data:', err);
    }
}

function updateMetrics(exp) {
    const qberEl = document.getElementById('metric-qber');
    const qberBadge = document.getElementById('metric-qber-badge');
    const accuracyEl = document.getElementById('metric-accuracy');
    const expectedEl = document.getElementById('metric-expected-error');
    const zScoreEl = document.getElementById('metric-z-score');
    const zTag = document.getElementById('metric-z-tag');
    const validityEl = document.getElementById('metric-validity');
    const threatBadge = document.getElementById('metric-threat-status');
    const reasonEl = document.getElementById('metric-reason');
    const backendEl = document.getElementById('metric-backend');
    
    // QBER
    if (qberEl) {
        qberEl.textContent = `${(exp.qber * 100).toFixed(2)}%`;
        if (exp.qber > 0.11) {
            qberEl.style.color = 'var(--status-danger)';
            if (qberBadge) {
                qberBadge.textContent = 'Breach (>11%)';
                qberBadge.className = 'telemetry-pill pill-danger';
            }
        } else {
            qberEl.style.color = 'var(--status-secure)';
            if (qberBadge) {
                qberBadge.textContent = 'Safe Bound';
                qberBadge.className = 'telemetry-pill pill-secure';
            }
        }
    }
    
    // Accuracy
    if (accuracyEl) {
        const accuracy = Math.max(0, (1.0 - exp.qber) * 100);
        accuracyEl.textContent = `${accuracy.toFixed(1)}%`;
    }
    
    // Expected Error
    if (expectedEl) {
        expectedEl.textContent = `${(exp.expected_error * 100).toFixed(2)}%`;
    }
    
    // Z-Score
    if (zScoreEl) {
        zScoreEl.textContent = `${(exp.statistical_deviation || 0).toFixed(2)}σ`;
        if (zTag) {
            if (exp.statistical_deviation >= 3.0) {
                zTag.textContent = 'Anomaly (≥3.0σ)';
                zTag.className = 'telemetry-pill pill-danger';
            } else if (exp.statistical_deviation >= 2.0) {
                zTag.textContent = 'Warning (2-3σ)';
                zTag.className = 'telemetry-pill pill-warning';
            } else {
                zTag.textContent = 'Nominal';
                zTag.className = 'telemetry-pill pill-secure';
            }
        }
    }
    
    // Validity
    if (validityEl) {
        validityEl.textContent = exp.verification_result;
        validityEl.style.color = exp.verification_result === 'SUCCESS' ? 'var(--status-secure)' : 'var(--status-danger)';
    }
    
    // Threat Status
    if (threatBadge) {
        threatBadge.textContent = exp.threat_status;
        if (exp.threat_status === 'SECURE') {
            threatBadge.className = 'telemetry-pill pill-secure';
        } else if (exp.threat_status === 'SUSPICIOUS') {
            threatBadge.className = 'telemetry-pill pill-warning';
        } else {
            threatBadge.className = 'telemetry-pill pill-danger';
        }
    }
    
    // Reason
    if (reasonEl) {
        reasonEl.textContent = exp.reason || 'Nominal channel transmission';
    }

    // Backend
    if (backendEl && exp.execution_backend) {
        backendEl.textContent = exp.execution_backend.replace('Local ', '').toUpperCase();
    }
}

function updateNetworkVisualization(exp) {
    if (window.network3D) {
        window.network3D.state.qber = exp.qber || 0.0;
        window.network3D.state.threatStatus = exp.threat_status || "SECURE";
        window.network3D.state.scenario = exp.attack_type || "Legitimate Communication";
        window.network3D.setScenario(exp.attack_type);
        window.network3D.setNoiseLevel(exp.noise_level || 0.02);
        window.network3D.setStage(9);
    }
    
    const overlayText = document.getElementById('overlay-stage-text');
    if (overlayText) {
        const isAttack = exp.threat_status !== 'SECURE';
        overlayText.textContent = isAttack ? `AUDIT COMPLETE: ${exp.threat_status} (${exp.attack_type})` : `AUDIT COMPLETE: SECURE (${exp.reason || 'Nominal'})`;
    }
}

const STAGE_DESCRIPTIONS = {
    1: "01 State Preparation — Alice prepares her secret signature qubit |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ on her local quantum register. Bob and Charlie remain on standby; Eve is inactive.",
    2: "02 Bell Entanglement — An entangled Bell pair |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 is distributed across Alice (q₁) and Bob (q₂). An active entanglement bridge links the parties with maximal correlation.",
    3: "03 Bell Measurement — Alice applies CNOT(q₀, q₁) and Hadamard H(q₀), performing a joint projective Bell measurement. The state collapses, producing classical bits c₀, c₁ from Qiskit simulation.",
    4: "04 Classical Feed — Alice broadcasts classical bits (c₀, c₁) across the public classical channel to Bob. Notice the classical packets moving along the upper arc, clearly distinguished from the quantum channel.",
    5: "05 Pauli Correction — Bob receives bits (c₀, c₁) and applies conditional Pauli unitary correction U = X^c₁ · Z^c₀ to his entangled half q₂, completing exact state reconstruction: |ψ⟩_Bob = |ψ⟩_Alice.",
    6: "06 Projective Measurement — Bob executes projective verification measurement in Alice's secret key basis (Z or X basis). Wavefunction collapses to the target eigenstate.",
    7: "07 Verification — Verifiers Bob and Charlie cross-check measurement outcomes. Parity parity correlation confirms signature authenticity and non-repudiation.",
    8: "08 Statistical Analysis — Evaluating Quantum Bit Error Rate (QBER) and binomial standard deviation Z-score against the 11.0% security cutoff and 3.0σ confidence limit.",
    9: "09 Final Security Decision — Deterministic security verdict rendered from the backend analysis: SECURE, SUSPICIOUS, or ATTACK DETECTED."
};

function selectDashboardStage(stageNum) {
    stageNum = parseInt(stageNum) || 1;
    
    // 1. Update Stepper Buttons UI
    document.querySelectorAll('.stage-step-btn').forEach(btn => {
        const s = parseInt(btn.getAttribute('data-step') || "0");
        if (s === stageNum) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Update Overlay HUD Text
    const overlayText = document.getElementById('overlay-stage-text');
    if (overlayText && STAGE_LABELS[stageNum]) {
        overlayText.textContent = STAGE_LABELS[stageNum];
    }

    // 2b. Update Detail Description in Pipeline Panel
    const descEl = document.getElementById('stage-detail-desc');
    if (descEl) {
        if (stageNum === 6) {
            descEl.textContent = "06 Projective Measurement — Bob executes projective measurement in the secret signature key basis. Wavefunction collapses deterministically to the target eigenstate outcome.";
        } else if (stageNum === 7) {
            const verifStatus = latestExperimentData ? (latestExperimentData.verification_result === 'SUCCESS' ? 'VERIFIED (Parity Match)' : 'VERIFICATION FAILED') : 'VERIFIED';
            descEl.textContent = `07 Verification — Verifiers Bob and Charlie cross-check measurement outcomes across multiparty channels: ${verifStatus}.`;
        } else if (stageNum === 8) {
            const qberStr = latestExperimentData ? (latestExperimentData.qber * 100).toFixed(2) + '%' : '3.20%';
            const zStr = latestExperimentData ? (latestExperimentData.statistical_deviation || 0).toFixed(2) + 'σ' : '0.45σ';
            descEl.textContent = `08 Statistical Analysis — Evaluating observed Quantum Bit Error Rate (QBER=${qberStr}) and binomial standard deviation (Z=${zStr}) against the 11.0% security cutoff and 3.0σ limit.`;
        } else if (stageNum === 9) {
            const verdict = latestExperimentData ? latestExperimentData.threat_status : 'SECURE';
            const reason = latestExperimentData ? latestExperimentData.reason : 'Nominal channel transmission';
            descEl.textContent = `09 Final Security Decision — Full protocol finalized. Security verdict rendered deterministically: ${verdict} (${reason}).`;
        } else if (STAGE_DESCRIPTIONS[stageNum]) {
            descEl.textContent = STAGE_DESCRIPTIONS[stageNum];
        }
    }

    // 3. Update 3D Network
    if (window.network3D) {
        window.network3D.setStage(stageNum);
    }

    // 4. Synchronize Bloch Sphere preview with stage state
    if (typeof globalBloch !== 'undefined' && globalBloch) {
        if (stageNum === 1) {
            // Alice prepares secret signature state: |+> (Hadamard eigenstate, vector +X)
            globalBloch.updateState({ theta: Math.PI / 2, phi: 0, x: 1, y: 0, z: 0, purity: 1.0 });
        } else if (stageNum === 2) {
            // Bell Pair Entangled Resource |Φ⁺⟩ on (q1, q2)
            globalBloch.updateState({ theta: 0, phi: 0, x: 0, y: 0, z: 1, purity: 1.0 });
        } else if (stageNum === 3) {
            // Joint Bell Measurement collapse
            globalBloch.updateState({ theta: Math.PI, phi: 0, x: 0, y: 0, z: -1, purity: 1.0 });
        } else if (stageNum === 4) {
            // Classical bits (c0, c1) broadcast along public channel
            globalBloch.updateState({ theta: Math.PI / 2, phi: Math.PI / 2, x: 0, y: 1, z: 0, purity: 0.95 });
        } else if (stageNum === 5) {
            // Bob conditional Pauli correction recovers Alice's signature state |+>
            globalBloch.updateState({ theta: Math.PI / 2, phi: 0, x: 1, y: 0, z: 0, purity: 1.0 });
        } else if (stageNum === 6) {
            // Bob projective measurement in secret key basis (Wavefunction collapses to |0>)
            globalBloch.updateState({ theta: 0, phi: 0, x: 0, y: 0, z: 1, purity: 1.0 });
        } else if (stageNum === 7) {
            // Multiparty verification parity cross-check
            globalBloch.updateState({ theta: Math.PI / 4, phi: 0, x: 0.707, y: 0, z: 0.707, purity: 1.0 });
        } else if (stageNum === 8) {
            // Binomial statistical analysis (QBER evaluation & purity)
            const qber = latestExperimentData ? latestExperimentData.qber : 0.032;
            const purity = Math.max(0.05, 1.0 - 2 * qber);
            globalBloch.updateState({ theta: Math.PI / 2, phi: 0, x: purity, y: 0, z: 0, purity: purity });
        } else if (stageNum === 9) {
            // Final security decision: Render actual backend state if available
            if (latestExperimentData && latestExperimentData.quantum_state) {
                globalBloch.updateState(latestExperimentData.quantum_state);
            } else {
                globalBloch.updateState({ theta: Math.PI / 2, phi: 0, x: 1, y: 0, z: 0, purity: 1.0 });
            }
        }
    }
}

function renderRecentEvents(experiments) {
    const streamContainer = document.getElementById('recent-events-stream');
    const tbody = document.getElementById('recent-experiments-body');
    
    if (streamContainer) {
        if (!experiments || experiments.length === 0) {
            streamContainer.innerHTML = '<div class="event-item-placeholder">No security audit events recorded yet. Ready for first experiment.</div>';
        } else {
            streamContainer.innerHTML = experiments.slice(0, 4).map(e => {
                let pillClass = 'pill-secure';
                if (e.threat_status === 'ATTACK DETECTED' || e.threat_status === 'SIGNATURE INVALID') pillClass = 'pill-danger';
                if (e.threat_status === 'SUSPICIOUS' || e.threat_status === 'REPLAY DETECTED') pillClass = 'pill-warning';

                const timeStr = e.timestamp ? e.timestamp.split(' ')[1] : 'Recent';
                return `
                    <div class="event-pill-item" onclick="window.location.href='/history'">
                        <span class="event-id">#${e.id}</span>
                        <span class="event-time">${timeStr}</span>
                        <span class="event-type">${e.attack_type}</span>
                        <span class="event-qber">QBER: <strong>${(e.qber * 100).toFixed(2)}%</strong></span>
                        <span class="telemetry-pill ${pillClass}">${e.threat_status}</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    if (tbody) {
        if (!experiments || experiments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No previous experiment records in database.</td></tr>';
            return;
        }
        
        tbody.innerHTML = experiments.map(e => {
            let pillClass = 'secure';
            if (e.threat_status === 'ATTACK DETECTED' || e.threat_status === 'SIGNATURE INVALID') pillClass = 'danger';
            if (e.threat_status === 'SUSPICIOUS' || e.threat_status === 'REPLAY DETECTED') pillClass = 'warning';
            
            return `
                <tr onclick="window.location.href='/history'">
                    <td><strong>#${e.id}</strong></td>
                    <td>${e.timestamp ? e.timestamp.split(' ')[1] : '--'}</td>
                    <td>${e.attack_type}</td>
                    <td><strong>${(e.qber * 100).toFixed(2)}%</strong></td>
                    <td><span class="status-pill ${pillClass}">${e.threat_status}</span></td>
                </tr>
            `;
        }).join('');
    }
}
