/**
 * Q-SHIELD Security History & Forensic Investigation Controller
 */

let currentPage = 1;
let totalPages = 1;

async function loadHistory(page = 1) {
    currentPage = page;
    const filterStatus = document.getElementById('filter-status').value;
    const tbody = document.getElementById('history-table-body');
    const countEl = document.getElementById('history-total-count');
    const pageIndicator = document.getElementById('page-indicator');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Loading records from SQLite...</td></tr>';
    
    let url = `/api/experiments?page=${page}&per_page=12`;
    if (filterStatus) {
        url += `&threat_status=${encodeURIComponent(filterStatus)}`;
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        totalPages = data.pages || 1;
        countEl.textContent = `Total Experiments: ${data.total} recorded in SQLite`;
        pageIndicator.textContent = `Page ${data.current_page} of ${totalPages || 1}`;
        prevBtn.disabled = data.current_page <= 1;
        nextBtn.disabled = data.current_page >= totalPages;
        
        if (!data.experiments || data.experiments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No matching experiment records found.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.experiments.map(e => {
            let pillClass = 'pill-secure';
            if (e.threat_status === 'ATTACK DETECTED' || e.threat_status === 'SIGNATURE INVALID') pillClass = 'pill-danger';
            if (e.threat_status === 'SUSPICIOUS' || e.threat_status === 'REPLAY DETECTED') pillClass = 'pill-warning';

            const backendShort = (e.execution_backend || 'Qiskit Aer').replace('Local ', '').replace(' Simulator', '');
            const timeStr = e.timestamp ? e.timestamp.split(' ')[1] : '--:--:--';
            
            return `
                <tr onclick="openExperimentDetails(${e.id})" style="cursor: pointer;">
                    <td class="font-mono text-sm">${timeStr}</td>
                    <td><strong>${e.attack_type}</strong></td>
                    <td class="font-mono"><strong>${e.qber_percentage}</strong></td>
                    <td>
                        <span class="status-indicator-dot ${e.verification_result === 'SUCCESS' ? 'dot-secure' : 'dot-danger'}"></span>
                        <span style="font-weight:600; color: ${e.verification_result === 'SUCCESS' ? 'var(--status-secure)' : 'var(--status-danger)'};">
                            ${e.verification_result}
                        </span>
                    </td>
                    <td><span class="telemetry-pill ${pillClass}">${e.threat_status}</span></td>
                    <td class="font-mono text-sm text-muted">${backendShort}</td>
                    <td>
                        <button class="btn btn-outline-xs" onclick="event.stopPropagation(); openExperimentDetails(${e.id})">
                            Investigate
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Failed to load history records.</td></tr>';
    }
}

function changePage(delta) {
    const target = currentPage + delta;
    if (target >= 1 && target <= totalPages) {
        loadHistory(target);
    }
}

async function openExperimentDetails(id) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-timestamp');
    
    title.textContent = `Security Audit File #${id}`;
    content.innerHTML = '<p class="table-empty">Retrieving forensic records...</p>';
    modal.style.display = 'flex';
    
    try {
        const res = await fetch(`/api/experiments/${id}`);
        if (!res.ok) throw new Error('Not found');
        const exp = await res.json();
        
        subtitle.textContent = `Timestamp: ${exp.timestamp} UTC | Backend: ${exp.execution_backend}`;
        
        let threatBadgeClass = 'pill-secure';
        if (exp.threat_status === 'ATTACK DETECTED' || exp.threat_status === 'SIGNATURE INVALID') threatBadgeClass = 'pill-danger';
        if (exp.threat_status === 'SUSPICIOUS' || exp.threat_status === 'REPLAY DETECTED') threatBadgeClass = 'pill-warning';
        
        const counts = exp.measurement_counts || {};
        const c0 = counts['0'] || 0;
        const c1 = counts['1'] || 0;
        const total = c0 + c1 || exp.shots || 1000;
        const p0 = ((c0 / total) * 100).toFixed(1);
        const p1 = ((c1 / total) * 100).toFixed(1);

        const qs = exp.quantum_state || {};
        const nonces = exp.nonces || [];
        const nonceToken = nonces.length > 0 ? nonces[0].token : 'Consumed in Session';

        content.innerHTML = `
            <!-- Verdict Header Card -->
            <div class="forensic-verdict-card ${exp.threat_status === 'SECURE' ? 'card-sec' : 'card-thr'}">
                <div class="f-top">
                    <span class="f-label">FINAL DETERMINISTIC DECISION:</span>
                    <span class="telemetry-pill ${threatBadgeClass}">${exp.threat_status}</span>
                </div>
                <div class="f-reason font-mono">${exp.reason}</div>
            </div>

            <!-- Message & Signature Info -->
            <div class="forensic-section mt-3">
                <span class="f-section-title">1. CRYPTOGRAPHIC SIGNATURE & NONCE STATUS</span>
                <div class="f-meta-grid font-mono">
                    <div><span class="k">Scenario:</span> <span class="v">${exp.attack_type}</span></div>
                    <div><span class="k">Verification:</span> <span class="v ${exp.verification_result === 'SUCCESS' ? 'text-secure' : 'text-danger'}">${exp.verification_result}</span></div>
                    <div><span class="k">Basis:</span> <span class="v">${exp.measurement_basis}-Basis</span></div>
                    <div><span class="k">Shots:</span> <span class="v">${exp.shots}</span></div>
                    <div><span class="k">Signature Nonce:</span> <span class="v text-cyan">${nonceToken}</span></div>
                    <div><span class="k">Anti-Replay Status:</span> <span class="v">${exp.threat_status === 'REPLAY DETECTED' ? 'INVALID (REUSED)' : 'VALID & CONSUMED'}</span></div>
                </div>
            </div>

            <!-- Quantum State Density -->
            <div class="forensic-section mt-3">
                <span class="f-section-title">2. QUANTUM STATE COORDINATES & PURITY</span>
                <div class="f-meta-grid font-mono">
                    <div><span class="k">Polar θ:</span> <span class="v">${qs.theta !== undefined ? qs.theta.toFixed(4) : '--'} rad</span></div>
                    <div><span class="k">Azimuthal φ:</span> <span class="v">${qs.phi !== undefined ? qs.phi.toFixed(4) : '--'} rad</span></div>
                    <div><span class="k">State Purity:</span> <span class="v">${qs.purity !== undefined ? qs.purity.toFixed(4) : '--'}</span></div>
                    <div><span class="k">Bloch (x,y,z):</span> <span class="v">(${qs.x || 0}, ${qs.y || 0}, ${qs.z || 0})</span></div>
                </div>
            </div>

            <!-- Statistical Evidence -->
            <div class="forensic-section mt-3">
                <span class="f-section-title">3. STATISTICAL ANOMALY & QBER ANALYSIS</span>
                <div class="f-evidence-grid font-mono">
                    <div class="ev-box">
                        <span class="ev-k">OBSERVED QBER</span>
                        <span class="ev-v ${exp.qber > 0.11 ? 'text-danger' : 'text-secure'}">${exp.qber_percentage}</span>
                        <span class="ev-sub">Cutoff: 11.0%</span>
                    </div>
                    <div class="ev-box">
                        <span class="ev-k">EXPECTED ERROR</span>
                        <span class="ev-v">${exp.expected_error_percentage}</span>
                        <span class="ev-sub">Calibrated noise</span>
                    </div>
                    <div class="ev-box">
                        <span class="ev-k">STATISTICAL Z-SCORE</span>
                        <span class="ev-v ${exp.statistical_deviation >= 3.0 ? 'text-danger' : 'text-secure'}">${exp.statistical_deviation}σ</span>
                        <span class="ev-sub">Limit: 3.0σ</span>
                    </div>
                </div>
            </div>

            <!-- Projective Measurement Histogram -->
            <div class="forensic-section mt-3">
                <span class="f-section-title">4. MEASUREMENT COLLAPSE DISTRIBUTION</span>
                <div class="counts-bars-container mt-2">
                    <div class="c-bar-group">
                        <div class="c-bar-label font-mono">|0⟩ (Target Eigenstate): ${c0} (${p0}%)</div>
                        <div class="c-track"><div class="c-fill fill-secure" style="width: ${p0}%;"></div></div>
                    </div>
                    <div class="c-bar-group">
                        <div class="c-bar-label font-mono">|1⟩ (Orthogonal / Error): ${c1} (${p1}%)</div>
                        <div class="c-track"><div class="c-fill fill-danger" style="width: ${p1}%;"></div></div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (err) {
        content.innerHTML = '<p class="table-empty">Failed to load forensic details.</p>';
    }
}

function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.style.display = 'none';
}

function closeModalOnBackdrop(e) {
    if (e.target.id === 'detail-modal') {
        closeDetailModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHistory(1);
});
