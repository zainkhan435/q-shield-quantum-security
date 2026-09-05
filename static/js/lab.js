/**
 * Q-SHIELD Quantum Protocol Lab Controller
 * Controls State, Pauli, Bell, Teleportation, Measurement, and Noise modules
 */

let activeLabTab = 'state';
let labBloch = null;
let labNetwork = null;

let currentState = {
    theta: 0.0,
    phi: 0.0,
    purity: 1.0,
    basis: 'Z'
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D Bloch Sphere for Lab
    const blochEl = document.getElementById('lab-bloch-canvas');
    if (blochEl && typeof BlochSphere3D !== 'undefined') {
        labBloch = new BlochSphere3D('lab-bloch-canvas', { radius: 1.8 });
        window.globalBloch = labBloch; // Link global helper
    }

    // Initialize 3D Quantum Network for Teleportation & Noise Labs
    const netEl = document.getElementById('lab-network-canvas');
    if (netEl && typeof QuantumNetwork3D !== 'undefined') {
        labNetwork = new QuantumNetwork3D('lab-network-canvas', {
            autoRotate: false,
            globeRadius: 4.8
        });
        window.labNetwork3D = labNetwork;
    }

    // Set initial state
    updateStateDisplay();
});

/* ============================================================
   TAB SWITCHING & VIEWPORT ROUTING
============================================================ */
function switchLabTab(tabName) {
    activeLabTab = tabName;

    // 1. Update Step Navigation
    document.querySelectorAll('.step-nav-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Update Control Panels
    document.querySelectorAll('.control-tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`panel-${tabName}`);
    if (activePanel) activePanel.classList.add('active');

    // 3. Update Viewport Pane
    const blochPane = document.getElementById('vis-bloch-container');
    const bellPane = document.getElementById('vis-bell-container');
    const networkPane = document.getElementById('vis-network-container');

    blochPane.classList.remove('active');
    bellPane.classList.remove('active');
    networkPane.classList.remove('active');

    if (tabName === 'state' || tabName === 'pauli' || tabName === 'measure') {
        blochPane.classList.add('active');
        requestAnimationFrame(() => { if (labBloch) labBloch.resize(); });
        setTimeout(() => { if (labBloch) labBloch.resize(); }, 50);
    } else if (tabName === 'bell') {
        bellPane.classList.add('active');
    } else if (tabName === 'teleport' || tabName === 'noise') {
        networkPane.classList.add('active');
        requestAnimationFrame(() => { if (labNetwork) labNetwork.resize(); });
        setTimeout(() => { if (labNetwork) labNetwork.resize(); }, 50);
        if (labNetwork) {
            if (tabName === 'noise') {
                const noiseVal = parseFloat(document.getElementById('slider-noise').value) || 0.02;
                labNetwork.setScenario('Channel Manipulation');
                labNetwork.setNoiseLevel(noiseVal);
            } else {
                labNetwork.setScenario('Legitimate Communication');
                labNetwork.setStage(1);
            }
        }
    }
}

/* ============================================================
   01 STATE LAB CONTROLLER
============================================================ */
function setPresetState(preset) {
    document.querySelectorAll('#panel-state .btn-preset').forEach(btn => {
        if (btn.textContent.trim() === preset) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const pi = Math.PI;
    if (preset === '|0>') {
        currentState.theta = 0.0;
        currentState.phi = 0.0;
    } else if (preset === '|1>') {
        currentState.theta = pi;
        currentState.phi = 0.0;
    } else if (preset === '|+>') {
        currentState.theta = pi / 2;
        currentState.phi = 0.0;
    } else if (preset === '|->') {
        currentState.theta = pi / 2;
        currentState.phi = pi;
    } else if (preset === '|+i>') {
        currentState.theta = pi / 2;
        currentState.phi = pi / 2;
    } else if (preset === '|-i>') {
        currentState.theta = pi / 2;
        currentState.phi = 3 * pi / 2;
    }

    document.getElementById('slider-theta').value = currentState.theta;
    document.getElementById('slider-phi').value = currentState.phi;
    updateStateDisplay();
}

function onThetaChange(val) {
    currentState.theta = parseFloat(val);
    updateStateDisplay();
}

function onPhiChange(val) {
    currentState.phi = parseFloat(val);
    updateStateDisplay();
}

function updateStateDisplay() {
    const theta = currentState.theta;
    const phi = currentState.phi;

    // Angle labels
    const thetaDeg = Math.round((theta * 180) / Math.PI);
    const phiDeg = Math.round((phi * 180) / Math.PI);
    document.getElementById('label-theta').textContent = `${theta.toFixed(3)} rad (${thetaDeg}°)`;
    document.getElementById('label-phi').textContent = `${phi.toFixed(3)} rad (${phiDeg}°)`;

    // Mathematical formula
    const alpha = Math.cos(theta / 2);
    const beta = Math.sin(theta / 2);
    const p0 = (alpha * alpha * 100).toFixed(1);
    const p1 = (beta * beta * 100).toFixed(1);

    document.getElementById('state-formula').textContent = `|ψ⟩ = ${alpha.toFixed(3)}|0⟩ + e^(${phi.toFixed(2)}i)·${beta.toFixed(3)}|1⟩`;
    document.getElementById('state-p0').textContent = `${p0}%`;
    document.getElementById('state-p1').textContent = `${p1}%`;
    document.getElementById('state-purity').textContent = currentState.purity.toFixed(4);

    // Update 3D Bloch Sphere
    if (labBloch) {
        const x = currentState.purity * Math.sin(theta) * Math.cos(phi);
        const y = currentState.purity * Math.sin(theta) * Math.sin(phi);
        const z = currentState.purity * Math.cos(theta);
        labBloch.updateState({ theta, phi, x, y, z, purity: currentState.purity });
    }
}

async function executeStatePrep() {
    showToast('Synthesizing quantum state in Qiskit Aer...', 'info');

    try {
        const res = await fetch('/api/lab/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theta: currentState.theta, phi: currentState.phi })
        });
        const data = await res.json();
        if (data.success) {
            currentState.theta = data.theta;
            currentState.phi = data.phi;
            currentState.purity = data.purity;

            document.getElementById('state-formula').textContent = data.formula;
            document.getElementById('state-p0').textContent = `${data.p0}%`;
            document.getElementById('state-p1').textContent = `${data.p1}%`;
            document.getElementById('state-purity').textContent = data.purity.toFixed(4);

            if (labBloch) {
                labBloch.updateState({
                    theta: data.theta,
                    phi: data.phi,
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    purity: data.purity
                });
            }
            showToast(`State Prepared: P(|0⟩)=${data.p0}%, P(|1⟩)=${data.p1}% (Qiskit Aer)`, 'success');
        } else {
            showToast(data.error || 'Failed to prepare state', 'error');
        }
    } catch (err) {
        console.error('State prep error:', err);
        showToast('Error communicating with quantum backend', 'error');
    }
}

/* ============================================================
   02 PAULI LAB CONTROLLER
============================================================ */
const PAULI_MATRICES = {
    'X': {
        name: 'PAULI X (BIT-FLIP)',
        matrix: '┌  0   1 ┐\n└  1   0 ┘',
        desc: '|0⟩ ──▶ |1⟩, |1⟩ ──▶ |0⟩'
    },
    'Y': {
        name: 'PAULI Y (BIT & PHASE FLIP)',
        matrix: '┌  0  -i ┐\n└  i   0 ┘',
        desc: '|0⟩ ──▶ i|1⟩, |1⟩ ──▶ -i|0⟩'
    },
    'Z': {
        name: 'PAULI Z (PHASE-FLIP)',
        matrix: '┌  1   0 ┐\n└  0  -1 ┘',
        desc: '|+⟩ ──▶ |-⟩, |-⟩ ──▶ |+⟩'
    },
    'H': {
        name: 'HADAMARD H (SUPERPOSITION)',
        matrix: '1/√2 · ┌  1   1 ┐\n       └  1  -1 ┘',
        desc: '|0⟩ ──▶ |+⟩, |1⟩ ──▶ |-⟩'
    }
};

async function applyPauliGate(gate) {
    if (!PAULI_MATRICES[gate]) return;

    document.getElementById('pauli-matrix-header').textContent = `OPERATOR MATRIX: ${PAULI_MATRICES[gate].name}`;
    document.getElementById('pauli-matrix-text').textContent = PAULI_MATRICES[gate].matrix;
    document.getElementById('pauli-state-transition').textContent = `Applying ${gate} to |ψ⟩...`;

    try {
        const res = await fetch('/api/lab/pauli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operator: gate,
                theta: currentState.theta,
                phi: currentState.phi
            })
        });
        const data = await res.json();
        if (data.success) {
            const s = data.transformed_state;
            currentState.theta = s.theta;
            currentState.phi = s.phi;
            currentState.purity = s.purity || 1.0;

            document.getElementById('pauli-matrix-header').textContent = `OPERATOR MATRIX: ${data.matrix_name}`;
            document.getElementById('pauli-matrix-text').textContent = data.matrix_ascii;
            document.getElementById('pauli-state-transition').textContent = data.description;

            if (labBloch) {
                labBloch.updateState(s);
            }

            // Update sliders in state lab to match transformed state
            const slTheta = document.getElementById('slider-theta');
            const slPhi = document.getElementById('slider-phi');
            if (slTheta) slTheta.value = s.theta;
            if (slPhi) slPhi.value = s.phi;

            showToast(`Applied ${data.matrix_name}: State Rotated`, 'success');
        }
    } catch (err) {
        console.error('Pauli gate error:', err);
        if (labBloch) labBloch.applyPauli(gate);
    }
}

/* ============================================================
   03 BELL LAB CONTROLLER
============================================================ */
async function selectBellState(type) {
    document.querySelectorAll('.btn-bell').forEach(btn => btn.classList.remove('active'));
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    showToast(`Synthesizing Bell State ${type.toUpperCase()} in Qiskit Aer...`, 'info');

    try {
        const res = await fetch('/api/lab/bell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bell_type: type })
        });
        const data = await res.json();
        if (data.success) {
            // Update Bell State badge & visualizer
            const badgeName = document.getElementById('bell-badge-name');
            const badgeFormula = document.getElementById('bell-badge-formula');
            const badgeCorr = document.getElementById('bell-badge-correlation');
            const hudTitle = document.getElementById('vis-bell-hud-title');
            const circuitAscii = document.getElementById('bell-circuit-ascii');
            const qValA = document.getElementById('q-val-a');
            const qValB = document.getElementById('q-val-b');
            const beamGlow = document.getElementById('beam-glow');

            const titles = {
                'phi_plus': { name: '|Φ⁺⟩', corr: 'Even Parity Correlation: Correlated (00 & 11)', color: '#00f0ff', a: 'Correlated (|0⟩/|1⟩)', b: 'Correlated (|0⟩/|1⟩)', circ: 'q₁: ──H──■──\n         │  \nq₂: ─────■──' },
                'phi_minus': { name: '|Φ⁻⟩', corr: 'Phase-Inverted EPR Pair: 180° relative phase flip on |11⟩', color: '#a855f7', a: 'In-Phase (|0⟩)', b: 'Phase-Flipped (-|1⟩)', circ: 'q₁: ──Z──H──■──\n            │  \nq₂: ────────■──' },
                'psi_plus': { name: '|Ψ⁺⟩', corr: 'Odd Parity Correlation: Bit-flipped superposition (01 & 10)', color: '#10b981', a: 'Bit 0 / Bit 1', b: 'Bit 1 / Bit 0 (Inverted)', circ: 'q₁: ──H──■──\n         │  \nq₂: ──X──■──' },
                'psi_minus': { name: '|Ψ⁻⟩', corr: 'Singlet State: Antisymmetric Bell state (01 - 10)', color: '#f59e0b', a: 'Singlet Half A', b: 'Singlet Half B (Antisymmetric)', circ: 'q₁: ──H──■──\n         │  \nq₂: ──X──Z──■──' }
            };

            const info = titles[type] || titles['phi_plus'];
            if (badgeName) badgeName.textContent = info.name;
            if (badgeFormula) badgeFormula.textContent = data.formula;
            if (badgeCorr) badgeCorr.textContent = info.corr;
            if (hudTitle) hudTitle.textContent = `MAXIMAL ENTANGLEMENT BRIDGE · ${info.name} = ${data.formula}`;
            if (circuitAscii) circuitAscii.textContent = info.circ;
            if (qValA) qValA.textContent = info.a;
            if (qValB) qValB.textContent = info.b;
            if (beamGlow) beamGlow.style.background = `linear-gradient(90deg, #0f62fe, ${info.color}, #10b981)`;

            // Update right panel bars & labels
            const bar00 = document.getElementById('bell-bar-00');
            const bar11 = document.getElementById('bell-bar-11');
            const val00 = document.getElementById('bell-val-00');
            const val11 = document.getElementById('bell-val-11');

            if (type.includes('psi')) {
                // Odd parity: |01> and |10>
                if (bar00) {
                    bar00.parentElement.previousElementSibling.textContent = '|01⟩';
                    bar00.style.width = `${data.p01}%`;
                }
                if (bar11) {
                    bar11.parentElement.previousElementSibling.textContent = '|10⟩';
                    bar11.style.width = `${data.p10}%`;
                }
                if (val00) val00.textContent = `${data.p01}% (${data.counts['01'] || 0})`;
                if (val11) val11.textContent = `${data.p10}% (${data.counts['10'] || 0})`;
            } else {
                // Even parity: |00> and |11>
                if (bar00) {
                    bar00.parentElement.previousElementSibling.textContent = '|00⟩';
                    bar00.style.width = `${data.p00}%`;
                }
                if (bar11) {
                    bar11.parentElement.previousElementSibling.textContent = '|11⟩';
                    bar11.style.width = `${data.p11}%`;
                }
                if (val00) val00.textContent = `${data.p00}% (${data.counts['00'] || 0})`;
                if (val11) val11.textContent = `${data.p11}% (${data.counts['11'] || 0})`;
            }

            showToast(`Bell State Synthesized: ${info.name} (Qiskit Aer 1000 Shots)`, 'success');
        }
    } catch (err) {
        console.error('Bell state error:', err);
    }
}

/* ============================================================
   04 TELEPORTATION LAB CONTROLLER
============================================================ */
function onTeleportStateChange() {
    const selectEl = document.getElementById('teleport-input-state');
    const text = selectEl ? selectEl.options[selectEl.selectedIndex].text : '|0⟩';
    const aliceStateEl = document.getElementById('tele-alice-state');
    if (aliceStateEl) aliceStateEl.textContent = text;

    // Update 3D network: reset to stage 1 highlighting Alice preparing this state
    if (labNetwork) {
        labNetwork.setStage(1);
    }
    showToast(`Configured Teleport Input: ${text}`, 'info');
}

let activeExecutionToast = null;
function showExecutionStep(message, isFinal = false, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (activeExecutionToast) {
        const prev = activeExecutionToast;
        prev.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        prev.style.opacity = '0';
        prev.style.transform = 'translateY(-6px)';
        setTimeout(() => {
            if (prev.parentNode) prev.remove();
        }, 250);
        activeExecutionToast = null;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="#0f62fe" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
    if (type === 'success') {
        iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="#10b981" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
        iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="#ef4444" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }

    toast.innerHTML = `
        ${iconSvg}
        <span class="toast-msg font-mono text-sm">${message}</span>
    `;
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    if (isFinal) {
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
        }, 4500);
    } else {
        activeExecutionToast = toast;
    }
}

async function runTeleportationSequence() {
    if (!labNetwork) return;

    const selectEl = document.getElementById('teleport-input-state');
    const stateChoice = selectEl ? selectEl.value : 'zero';
    const executeBtn = document.querySelector('#panel-teleport .btn-primary');
    if (executeBtn) executeBtn.disabled = true;

    showExecutionStep('Step 1: Preparing Alice signature state |ψ⟩ in Qiskit...', false, 'info');

    try {
        const res = await fetch('/api/lab/teleport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state_choice: stateChoice,
                theta: currentState.theta,
                phi: currentState.phi
            })
        });
        const data = await res.json();
        if (!data.success) {
            showExecutionStep(data.error || 'Teleportation simulation failed', true, 'error');
            if (executeBtn) executeBtn.disabled = false;
            return;
        }

        const c0 = data.sample_classical_bits.c0;
        const c1 = data.sample_classical_bits.c1;
        const pauliApplied = data.pauli_applied;
        const fidelity = data.fidelity_percentage;
        const inputLabel = data.input_state.label;

        const aliceStateEl = document.getElementById('tele-alice-state');
        if (aliceStateEl) aliceStateEl.textContent = inputLabel;

        const timeline = [
            { step: 1, msg: `Step 1: Alice preparing signature state ${inputLabel}` },
            { step: 2, msg: 'Step 2: Creating entangled Bell pair |Φ⁺⟩ on (q₁, q₂)' },
            { step: 3, msg: `Step 3: Alice joint Bell measurement collapsed to (${c0}, ${c1})` },
            { step: 4, msg: `Step 4: Transmitting classical bits c₀=${c0}, c₁=${c1} over channel` },
            { step: 5, msg: `Step 5: Bob applying conditional Pauli correction ${pauliApplied}` },
            { step: 6, msg: `Step 6: Bob reconstructing signature state |ψ⟩_Bob` }
        ];

        for (const item of timeline) {
            labNetwork.setStage(item.step);
            showExecutionStep(item.msg, false, 'info');
            if (item.step === 4) {
                document.getElementById('tele-bits').textContent = `c₀=${c0}, c₁=${c1}`;
            } else if (item.step === 5) {
                document.getElementById('tele-pauli').textContent = pauliApplied;
            }
            await new Promise(r => setTimeout(r, 850));
        }

        // Final completion state
        if (aliceStateEl) aliceStateEl.textContent = inputLabel;
        document.getElementById('tele-bits').textContent = `c₀=${c0}, c₁=${c1}`;
        document.getElementById('tele-pauli').textContent = pauliApplied;
        document.getElementById('tele-fidelity').textContent = fidelity;
        document.getElementById('tele-final').textContent = `|ψ⟩_Bob = ${inputLabel.split(' ')[0]}`;
        const verifEl = document.getElementById('tele-verif');
        if (verifEl) verifEl.textContent = data.verification_result || 'VERIFIED (100%)';
        showExecutionStep(`Teleportation Complete: ${inputLabel} reconstructed with ${fidelity} fidelity!`, true, 'success');

    } catch (err) {
        console.error('Teleportation error:', err);
        showExecutionStep('Simulation failed. Retrying available.', true, 'error');
    } finally {
        if (executeBtn) executeBtn.disabled = false;
    }
}

/* ============================================================
   05 MEASUREMENT LAB CONTROLLER
============================================================ */
function setMeasurementBasis(basis) {
    currentState.basis = basis;
    document.querySelectorAll('#panel-measure .btn-preset').forEach(btn => {
        if (btn.textContent.includes(basis)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    showToast(`Rotated measurement basis to ${basis}-Basis`, 'info');
}

async function executeProjectiveMeasurement() {
    const basis = currentState.basis || 'Z';
    showToast(`Performing 1000-shot projection in ${basis}-Basis (Qiskit Aer)...`, 'info');

    try {
        const res = await fetch('/api/lab/measure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                basis: basis,
                theta: currentState.theta,
                phi: currentState.phi,
                shots: 1000
            })
        });
        const data = await res.json();
        if (data.success) {
            const bar0 = document.getElementById('meas-bar-0');
            const bar1 = document.getElementById('meas-bar-1');
            const val0 = document.getElementById('meas-val-0');
            const val1 = document.getElementById('meas-val-1');

            if (bar0) bar0.style.width = `${data.p0}%`;
            if (bar1) bar1.style.width = `${data.p1}%`;
            if (val0) val0.textContent = `${data.p0}% (${data.c0})`;
            if (val1) val1.textContent = `${data.p1}% (${data.c1})`;

            // Rotate state vector in Bloch sphere according to measurement outcome collapse
            if (labBloch) {
                let collapsedDir;
                if (basis === 'Z') {
                    collapsedDir = (data.p0 >= data.p1) ? { theta: 0, phi: 0, x: 0, y: 0, z: 1, purity: 1.0 } : { theta: Math.PI, phi: 0, x: 0, y: 0, z: -1, purity: 1.0 };
                } else if (basis === 'X') {
                    collapsedDir = (data.p0 >= data.p1) ? { theta: Math.PI/2, phi: 0, x: 1, y: 0, z: 0, purity: 1.0 } : { theta: Math.PI/2, phi: Math.PI, x: -1, y: 0, z: 0, purity: 1.0 };
                } else {
                    collapsedDir = (data.p0 >= data.p1) ? { theta: Math.PI/2, phi: Math.PI/2, x: 0, y: 1, z: 0, purity: 1.0 } : { theta: Math.PI/2, phi: 3*Math.PI/2, x: 0, y: -1, z: 0, purity: 1.0 };
                }
                labBloch.updateState(collapsedDir);
            }

            showToast(`Measurement Complete: P(|0⟩)=${data.p0}%, P(|1⟩)=${data.p1}% in ${basis}-Basis`, 'success');
        }
    } catch (err) {
        console.error('Measurement error:', err);
        showToast('Measurement projection error', 'error');
    }
}

/* ============================================================
   06 NOISE LAB CONTROLLER
============================================================ */
function onNoiseSliderChange(val) {
    const noise = parseFloat(val);
    const pct = (noise * 100).toFixed(1);
    document.getElementById('label-noise').textContent = `${pct}%`;
    document.getElementById('noise-rate-val').textContent = `${pct}%`;

    if (labNetwork) {
        labNetwork.setNoiseLevel(noise);
    }
}

async function executeNoiseSimulation() {
    const noise = parseFloat(document.getElementById('slider-noise').value) || 0.02;
    showToast('Dispatching simulation to Qiskit Aer...', 'info');

    try {
        const res = await fetch('/api/experiments/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                attack_type: 'Channel Manipulation',
                noise_level: noise,
                shots: 1000,
                measurement_basis: 'Z'
            })
        });

        const data = await res.json();
        if (data.success) {
            const exp = data.experiment;
            document.getElementById('noise-qber-val').textContent = `${(exp.qber * 100).toFixed(2)}%`;
            document.getElementById('noise-purity-val').textContent = (1.0 - 2 * exp.qber).toFixed(4);
            document.getElementById('noise-fidelity-val').textContent = `${((1.0 - exp.qber) * 100).toFixed(1)}%`;

            if (labNetwork) {
                labNetwork.triggerExperiment(exp);
            }
            showToast(`Simulation complete: QBER=${(exp.qber * 100).toFixed(2)}%`, 'success');
        }
    } catch (e) {
        console.error('Noise simulation error:', e);
    }
}
