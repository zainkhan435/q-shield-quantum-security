/**
 * Q-SHIELD Threat Detection & Experiment Controller
 * Synchronizes 3D Quantum Network Globe, attack simulation, and forensic verdict display
 */

const SCENARIO_DESCRIPTIONS = {
    "Legitimate Communication": "Alice teleports valid signature state |ψ⟩ to Bob and Charlie over quantum channel with calibrated background noise. Teleportation fidelity is high and verification succeeds.",
    "Intercept & Resend": "Eve intercepts qubit q₂ in the quantum channel and performs projective measurement, collapsing the entangled Bell pair. Introduces ~25% to 50% QBER, drastically exceeding the 11% cutoff.",
    "Signature Forgery": "Adversary tampers with the signature qubit or injects an altered state |ψ'⟩. Projective measurement fails to match Alice's private key basis.",
    "Replay Attack": "Adversary re-transmits an earlier captured valid quantum signature session. SQLite cryptographic nonce ledger detects that token was previously consumed.",
    "Impersonation": "Unauthorized signer attempts authentication without valid pre-shared entanglement key material, yielding randomized measurement distributions.",
    "Channel Manipulation": "Environmental decoherence or fiber manipulation forces depolarizing noise beyond tolerable QDS limits (≥15%)."
};

const LAB_STAGE_TEXTS = {
    1: "01 STATE PREPARATION: Alice synthesizing secret signature state |ψ⟩",
    2: "02 BELL ENTANGLEMENT: Distributing EPR pair |Φ⁺⟩ across channel",
    3: "03 QUANTUM TRANSMISSION: State traveling through quantum channel",
    4: "04 ATTACK VECTOR ACTIVE: Channel interaction / evaluation",
    5: "05 MEASUREMENT COLLAPSE: Projective measurement & collapse event",
    6: "06 RECEPTION: Bob receiving reconstructed/transmitted state",
    7: "07 VERIFICATION: Bob & Charlie executing multiparty parity cross-check",
    8: "08 STATISTICAL ANALYSIS: Evaluating QBER against 11.0% cutoff limit",
    9: "09 FINAL SECURITY DECISION: Deterministic verdict rendered"
};

function onAttackTypeChange(attackType) {
    const descBox = document.getElementById('attack-info-text');
    if (descBox && SCENARIO_DESCRIPTIONS[attackType]) {
        descBox.textContent = SCENARIO_DESCRIPTIONS[attackType];
    }

    // Sync 3D Network Engine immediately
    const noiseLevel = parseFloat(document.getElementById('noise_level').value) / 100.0;
    if (window.labNetwork3D) {
        window.labNetwork3D.setScenario(attackType);
        window.labNetwork3D.setNoiseLevel(noiseLevel);
    }
}

function updateNoiseDisplay(val) {
    const display = document.getElementById('noise-display');
    if (display) {
        display.textContent = `${parseFloat(val).toFixed(1)}%`;
    }

    // Sync 3D Network noise turbulence
    const attackType = document.getElementById('attack_type').value;
    const noiseLevel = parseFloat(val) / 100.0;
    if (window.labNetwork3D) {
        window.labNetwork3D.setScenario(attackType);
        window.labNetwork3D.setNoiseLevel(noiseLevel);
    }
}

async function handleRunExperiment(e) {
    e.preventDefault();
    const btn = document.getElementById('run-exp-btn');
    const statusText = document.getElementById('pipeline-overall-status');
    const labOverlay = document.getElementById('lab-overlay-stage');
    
    // Read form values
    const attackType = document.getElementById('attack_type').value;
    const shots = parseInt(document.querySelector('input[name="shots"]:checked').value, 10);
    const noiseLevel = parseFloat(document.getElementById('noise_level').value) / 100.0;
    const measurementBasis = document.getElementById('measurement_basis').value;
    const executionBackend = document.getElementById('execution_backend').value;

    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> <span id="btn-status-text">Stage 01: Preparing quantum state...</span>';
    if (statusText) {
        statusText.textContent = 'EXECUTING';
        statusText.style.color = 'var(--primary)';
    }

    // Sync 3D scene scenario immediately
    if (window.labNetwork3D) {
        window.labNetwork3D.setScenario(attackType);
        window.labNetwork3D.setNoiseLevel(noiseLevel);
    }

    // Dispatch API request to Flask backend concurrently
    const apiPromise = fetch('/api/experiments/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            attack_type: attackType,
            shots: shots,
            noise_level: noiseLevel,
            measurement_basis: measurementBasis,
            execution_backend: executionBackend
        })
    });

    const updateStage = (stageNum, msg) => {
        const btnSpan = document.getElementById('btn-status-text');
        if (btnSpan) btnSpan.textContent = msg;
        if (labOverlay) labOverlay.textContent = msg;
        if (statusText) statusText.textContent = `STAGE 0${stageNum} / 09`;
        if (window.labNetwork3D) window.labNetwork3D.setStage(stageNum);
    };

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    try {
        // Stage 01: Preparing quantum state
        updateStage(1, "01 STATE PREPARATION: Alice synthesizing target signature state |ψ⟩");
        await delay(700);

        // Stage 02: Establishing Bell correlation
        updateStage(2, "02 BELL ENTANGLEMENT: Distributing EPR pair |Φ⁺⟩ across channel");
        await delay(700);

        // Stage 03: Transmitting quantum state
        updateStage(3, "03 QUANTUM TRANSMISSION: State traveling along quantum channel");
        await delay(700);

        // Stage 04: Attack vector active (Contextual to selected scenario)
        let st4Msg = "04 ATTACK VECTOR ACTIVE: Quantum channel inspection";
        if (attackType === "Intercept & Resend") {
            st4Msg = "04 ATTACK VECTOR ACTIVE: Eve intercepting channel qubit q₂";
        } else if (attackType === "Channel Manipulation") {
            st4Msg = `04 ATTACK VECTOR ACTIVE: Depolarizing noise (${(noiseLevel * 100).toFixed(1)}%) disturbing channel`;
        } else if (attackType === "Signature Forgery") {
            st4Msg = "04 ATTACK VECTOR ACTIVE: Altered forged signature payload injected";
        } else if (attackType === "Replay Attack") {
            st4Msg = "04 ATTACK VECTOR ACTIVE: Re-transmitting captured token (nonce check)";
        } else if (attackType === "Impersonation") {
            st4Msg = "04 ATTACK VECTOR ACTIVE: Unauthorized signer attempting communication";
        } else if (attackType === "Legitimate Communication") {
            st4Msg = "04 PROTOCOL ACTIVE: Clean quantum state traversing channel";
        }
        updateStage(4, st4Msg);
        await delay(750);

        // Stage 05: Measurement / Channel disturbance
        let st5Msg = "05 MEASUREMENT COLLAPSE: Joint measurement & state projection";
        if (attackType === "Intercept & Resend") {
            st5Msg = "05 INTERCEPTION COLLAPSE: Eve projective measurement collapses state";
        } else if (attackType === "Channel Manipulation") {
            st5Msg = "05 CHANNEL DISTURBANCE: Environmental decoherence perturbing channel";
        } else if (attackType === "Legitimate Communication") {
            st5Msg = "05 PAULI CORRECTION: Bob applying unitary correction based on (c₀, c₁)";
        }
        updateStage(5, st5Msg);
        await delay(750);

        // Stage 06: Bob receives state
        updateStage(6, "06 RECEPTION: Bob receiving transmitted/reconstructed quantum state");
        await delay(700);

        // Stage 07: Projective measurement & verification
        updateStage(7, "07 VERIFICATION: Bob & Charlie executing multiparty parity cross-check");
        await delay(700);

        // Stage 08: Statistical analysis
        updateStage(8, "08 STATISTICAL ANALYSIS: Evaluating QBER against 11.0% cutoff limit");
        await delay(700);

        // Await real Qiskit simulation backend data
        const response = await apiPromise;
        const data = await response.json();

        if (!response.ok || !data.success) {
            showToast(data.error || 'Quantum simulation failed', 'error');
            if (statusText) {
                statusText.textContent = 'FAILED';
                statusText.style.color = 'var(--status-danger)';
            }
            return;
        }

        const exp = data.experiment;

        // Stage 09: Final security decision
        if (window.labNetwork3D) {
            window.labNetwork3D.state.qber = exp.qber;
            window.labNetwork3D.state.threatStatus = exp.threat_status;
            window.labNetwork3D.state.scenario = exp.attack_type;
            window.labNetwork3D.setStage(9);
        }

        const isSecure = (exp.threat_status === "SECURE");
        const verdictMsg = isSecure 
            ? `09 AUDIT VERDICT: SECURE — QBER ${exp.qber_percentage} (≤ 11.0% cutoff)` 
            : `09 AUDIT VERDICT: ${exp.threat_status} — QBER ${exp.qber_percentage} (${exp.reason})`;
        
        if (labOverlay) labOverlay.textContent = verdictMsg;
        if (statusText) {
            statusText.textContent = isSecure ? 'SECURE' : 'THREAT DETECTED';
            statusText.style.color = isSecure ? 'var(--status-secure)' : 'var(--status-danger)';
        }

        // Render Forensic Result Panel with real Qiskit outputs
        renderResults(exp, data.raw_counts, data.nonce_token);
        showToast(`Audit Complete: ${exp.threat_status} (QBER ${exp.qber_percentage})`, isSecure ? 'success' : 'warning');

    } catch (err) {
        console.error(err);
        showToast('Network error while communicating with Q-SHIELD backend', 'error');
        if (statusText) {
            statusText.textContent = 'ERROR';
            statusText.style.color = 'var(--status-danger)';
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> <span>EXECUTE ATTACK AUDIT</span>';
    }
}

function renderResults(exp, rawCounts, nonceToken) {
    const resultCard = document.getElementById('result-card');
    if (resultCard) {
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Verdict Banner
    const banner = document.getElementById('verdict-banner');
    const statusTitle = document.getElementById('res-threat-status');
    const verifTag = document.getElementById('res-verification');
    const reasonText = document.getElementById('res-reason');
    const timeEl = document.getElementById('res-timestamp');

    if (timeEl) timeEl.textContent = exp.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (statusTitle) statusTitle.textContent = exp.threat_status;
    if (reasonText) reasonText.textContent = exp.reason;

    if (verifTag) {
        verifTag.textContent = exp.verification_result === 'SUCCESS' ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED';
        verifTag.className = exp.verification_result === 'SUCCESS' ? 'verdict-tag tag-success' : 'verdict-tag tag-danger';
    }

    if (banner) {
        if (exp.threat_status === 'SECURE') {
            banner.className = 'verdict-banner-box verdict-secure';
        } else if (exp.threat_status === 'REPLAY DETECTED') {
            banner.className = 'verdict-banner-box verdict-warning';
        } else {
            banner.className = 'verdict-banner-box verdict-threat';
        }
    }

    // Evidence Metrics
    const qberEl = document.getElementById('res-qber');
    const expErrEl = document.getElementById('res-expected');
    const obsErrEl = document.getElementById('res-observed');
    const zScoreEl = document.getElementById('res-z-score');
    const nonceEl = document.getElementById('res-nonce');

    if (qberEl) qberEl.textContent = exp.qber_percentage;
    if (expErrEl) expErrEl.textContent = exp.expected_error_percentage;
    if (obsErrEl) obsErrEl.textContent = exp.qber_percentage;
    if (zScoreEl) zScoreEl.textContent = `${(exp.statistical_deviation || 0).toFixed(2)}σ`;
    if (nonceEl) nonceEl.textContent = nonceToken ? `${nonceToken.substring(0, 16)}...` : 'N/A';

    // Counts Breakdown
    const counts = exp.measurement_counts || {};
    const count0 = counts['0'] || 0;
    const count1 = counts['1'] || 0;
    const total = count0 + count1 || exp.shots || 1000;

    const bar0 = document.getElementById('res-bar-0');
    const bar1 = document.getElementById('res-bar-1');
    const val0 = document.getElementById('res-val-0');
    const val1 = document.getElementById('res-val-1');
    const totalEl = document.getElementById('res-counts-total');

    if (totalEl) totalEl.textContent = `Total Shots: ${total}`;

    const p0 = ((count0 / total) * 100).toFixed(1);
    const p1 = ((count1 / total) * 100).toFixed(1);

    if (bar0) bar0.style.width = `${p0}%`;
    if (bar1) bar1.style.width = `${p1}%`;
    if (val0) val0.textContent = `${count0} (${p0}%)`;
    if (val1) val1.textContent = `${count1} (${p1}%)`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D Quantum Network Globe in Experiment Lab
    const labCanvas = document.getElementById('lab-quantum-3d-canvas');
    if (labCanvas && typeof QuantumNetwork3D !== 'undefined') {
        window.labNetwork3D = new QuantumNetwork3D('lab-quantum-3d-canvas', {
            autoRotate: true,
            globeRadius: 4.8
        });
    }
});
