/**
 * Q-SHIELD Interactive 3D Bloch Sphere & Quantum State Transformer
 * Built with Three.js (WebGL) + 2D Vector Fallback
 *
 * Supports:
 * - Full 6 poles: |0>, |1>, |+>, |->, |+i>, |-i>
 * - Coordinate axes X, Y, Z with physical orientations
 * - Real backend-driven statevector (theta, phi, x, y, z, purity)
 * - Interactive Pauli transformations (X, Y, Z, H) with visible 3D rotation
 */

class BlochSphere3D {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = Object.assign({
            radius: 1.8,
            interactiveHover: true
        }, options);

        this.isWebGLSupported = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arrowHelper = null;
        this.sphereGroup = null;

        // Current state vector angles
        this.currentState = {
            theta: 0.0,
            phi: 0.0,
            x: 0.0,
            y: 0.0,
            z: 1.0,
            purity: 1.0
        };

        // Mouse drag orbiting
        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };

        this.init();
    }

    init() {
        if (!this.container) return;
        this.isWebGLSupported = this.checkWebGLSupport();

        if (this.isWebGLSupported && typeof THREE !== 'undefined') {
            this.initThreeJS();
        } else {
            this.init2DFallback();
        }
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    initThreeJS() {
        const width = this.container.clientWidth || 360;
        const height = this.container.clientHeight || 320;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f1d);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(3.8, 2.6, 4.2);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const amb = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(amb);

        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(6, 12, 8);
        this.scene.add(dir);

        this.sphereGroup = new THREE.Group();
        this.scene.add(this.sphereGroup);

        const R = this.options.radius;

        // 1. Wireframe Sphere
        const sphereGeo = new THREE.SphereGeometry(R, 28, 20);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0x334155,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
        this.sphereGroup.add(new THREE.Mesh(sphereGeo, sphereMat));

        // 2. Equator (XY Plane) and Prime Meridian (XZ Plane)
        const eqGeo = new THREE.RingGeometry(R - 0.01, R + 0.01, 64);
        const eqMat = new THREE.MeshBasicMaterial({ color: 0x0f62fe, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
        const eqMesh = new THREE.Mesh(eqGeo, eqMat);
        eqMesh.rotation.x = Math.PI / 2;
        this.sphereGroup.add(eqMesh);

        // 3. Axes: X (Red), Y (Green), Z (Cyan)
        // In Three.js, Y is UP. We map Physics Z (up) -> Three.js Y, Physics X -> Three.js X, Physics Y -> Three.js Z
        const axisMatX = new THREE.LineBasicMaterial({ color: 0xef4444 });
        const axisMatY = new THREE.LineBasicMaterial({ color: 0x10b981 });
        const axisMatZ = new THREE.LineBasicMaterial({ color: 0x00d2ff });

        // Physics X Axis
        const lineX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-R * 1.3, 0, 0), new THREE.Vector3(R * 1.3, 0, 0)]);
        this.sphereGroup.add(new THREE.Line(lineX, axisMatX));

        // Physics Y Axis
        const lineY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -R * 1.3), new THREE.Vector3(0, 0, R * 1.3)]);
        this.sphereGroup.add(new THREE.Line(lineY, axisMatY));

        // Physics Z Axis (Three.js Vertical)
        const lineZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -R * 1.3, 0), new THREE.Vector3(0, R * 1.3, 0)]);
        this.sphereGroup.add(new THREE.Line(lineZ, axisMatZ));

        // 4. Pole Labels in 3D (|0>, |1>, |+>, |->, |+i>, |-i>)
        this.addPoleLabel("|0⟩", new THREE.Vector3(0, R + 0.35, 0), "#00d2ff");
        this.addPoleLabel("|1⟩", new THREE.Vector3(0, -R - 0.35, 0), "#00d2ff");
        this.addPoleLabel("|+⟩", new THREE.Vector3(R + 0.35, 0, 0), "#ef4444");
        this.addPoleLabel("|-⟩", new THREE.Vector3(-R - 0.35, 0, 0), "#ef4444");
        this.addPoleLabel("|+i⟩", new THREE.Vector3(0, 0, R + 0.35), "#10b981");
        this.addPoleLabel("|-i⟩", new THREE.Vector3(0, 0, -R - 0.35), "#10b981");

        // 5. Statevector Arrow
        const arrowDir = new THREE.Vector3(0, 1, 0); // pointing to |0> initially
        this.arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), R, 0x00f0ff, 0.32, 0.18);
        this.arrowHelper.line.material.linewidth = 3;
        this.sphereGroup.add(this.arrowHelper);

        // 6. Mouse Interaction
        this.setupInteraction();

        // 7. Animation loop
        this.animate = this.animate.bind(this);
        this.animate();
    }

    addPoleLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 45);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(position);
        sprite.scale.set(1.2, 0.6, 1);
        this.sphereGroup.add(sprite);
    }

    setupInteraction() {
        const dom = this.renderer.domElement;

        dom.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.prevMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => { this.isDragging = false; });

        dom.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.prevMouse.x;
            const dy = e.clientY - this.prevMouse.y;

            this.sphereGroup.rotation.y += dx * 0.008;
            this.sphereGroup.rotation.x += dy * 0.008;

            this.prevMouse = { x: e.clientX, y: e.clientY };
        });

        dom.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.position.z = Math.max(2.5, Math.min(8.0, this.camera.position.z + e.deltaY * 0.006));
        }, { passive: false });

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w === 0 || h === 0) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    animate() {
        requestAnimationFrame(this.animate);
        if (!this.isDragging && this.sphereGroup) {
            this.sphereGroup.rotation.y += 0.0012; // subtle continuous rotation
        }
        this.renderer.render(this.scene, this.camera);
    }

    updateState(stateObj) {
        if (!stateObj) return;
        Object.assign(this.currentState, stateObj);

        // Update DOM displays
        const thetaEl = document.getElementById('coord-theta');
        const phiEl = document.getElementById('coord-phi');
        const xyzEl = document.getElementById('coord-xyz');
        const purityEl = document.getElementById('coord-purity');

        if (thetaEl && stateObj.theta !== undefined) thetaEl.textContent = `${stateObj.theta.toFixed(4)} rad`;
        if (phiEl && stateObj.phi !== undefined) phiEl.textContent = `${stateObj.phi.toFixed(4)} rad`;
        if (xyzEl && stateObj.x !== undefined) xyzEl.textContent = `(${stateObj.x.toFixed(2)}, ${stateObj.y.toFixed(2)}, ${stateObj.z.toFixed(2)})`;
        if (purityEl && stateObj.purity !== undefined) purityEl.textContent = stateObj.purity.toFixed(4);

        if (this.isWebGLSupported && this.arrowHelper) {
            const px = stateObj.x || 0;
            const py = stateObj.y || 0;
            const pz = stateObj.z !== undefined ? stateObj.z : 1;
            const purity = stateObj.purity || 1.0;

            // Map Physics (x, y, z) -> Three.js (x, z, y) where z is physics UP -> Three.js Y
            const dir = new THREE.Vector3(px, pz, py).normalize();
            this.arrowHelper.setDirection(dir);
            this.arrowHelper.setLength(this.options.radius * purity, 0.32, 0.18);

            // Change arrow color if purity is decayed or under attack
            if (purity < 0.6) {
                this.arrowHelper.setColor(0xef4444);
            } else if (purity < 0.85) {
                this.arrowHelper.setColor(0xf59e0b);
            } else {
                this.arrowHelper.setColor(0x00f0ff);
            }
        }
    }

    /* ============================================================
       Interactive 3D Pauli Transformations
    ============================================================ */
    applyPauli(operator) {
        let x = this.currentState.x;
        let y = this.currentState.y;
        let z = this.currentState.z;

        if (operator === 'X') {
            // Pauli X: bit flip (x -> x, y -> -y, z -> -z)
            // e.g. |0> (0,0,1) -> |1> (0,0,-1)
            y = -y;
            z = -z;
        } else if (operator === 'Y') {
            // Pauli Y: bit & phase flip (x -> -x, y -> y, z -> -z)
            x = -x;
            z = -z;
        } else if (operator === 'Z') {
            // Pauli Z: phase flip (x -> -x, y -> -y, z -> z)
            // e.g. |+> (1,0,0) -> |-> (-1,0,0)
            x = -x;
            y = -y;
        } else if (operator === 'H') {
            // Hadamard: swaps Z and X (x -> z, y -> -y, z -> x)
            // e.g. |0> (0,0,1) -> |+> (1,0,0)
            const temp = z;
            z = x;
            x = temp;
            y = -y;
        }

        const theta = Math.acos(Math.max(-1.0, Math.min(1.0, z)));
        const phi = Math.atan2(y, x);

        this.updateState({
            theta,
            phi,
            x,
            y,
            z,
            purity: this.currentState.purity
        });

        showToast(`Applied Quantum Gate: Pauli ${operator}`, 'info');
    }

    resetView() {
        if (this.camera && this.sphereGroup) {
            this.camera.position.set(3.8, 2.6, 4.2);
            this.camera.lookAt(0, 0, 0);
            this.sphereGroup.rotation.set(0, 0, 0);
            showToast('3D Bloch sphere view reset', 'info');
        }
    }

    init2DFallback() {
        this.container.innerHTML = `
            <div class="bloch-2d-fallback" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0a0f1d; border-radius:8px;">
                <svg viewBox="0 0 240 240" style="width:200px; height:200px;">
                    <circle cx="120" cy="120" r="90" fill="none" stroke="#334155" stroke-width="2"/>
                    <ellipse cx="120" cy="120" rx="90" ry="30" fill="none" stroke="#0f62fe" stroke-dasharray="4,4"/>
                    <line x1="120" y1="20" x2="120" y2="220" stroke="#00d2ff" stroke-width="2"/>
                    <line x1="20" y1="120" x2="220" y2="120" stroke="#ef4444" stroke-width="2"/>
                    <text x="120" y="16" fill="#00d2ff" font-size="12" text-anchor="middle" font-weight="bold">|0⟩</text>
                    <text x="120" y="234" fill="#00d2ff" font-size="12" text-anchor="middle" font-weight="bold">|1⟩</text>
                    <text x="232" y="124" fill="#ef4444" font-size="12" text-anchor="middle" font-weight="bold">|+⟩</text>
                    <text x="10" y="124" fill="#ef4444" font-size="12" text-anchor="middle" font-weight="bold">|-⟩</text>
                    <!-- State Vector -->
                    <line id="svg-bloch-vector" x1="120" y1="120" x2="120" y2="35" stroke="#00f0ff" stroke-width="4" marker-end="url(#arrow)"/>
                </svg>
                <div style="font-size:11px; color:#94a3b8; margin-top:6px;">2D Vector Projection Mode</div>
            </div>
        `;
    }
}

// Global accessor
window.BlochSphere3D = BlochSphere3D;
let globalBloch = null;

function resetBlochView() {
    if (globalBloch) globalBloch.resetView();
}

function applyBlochPauli(op) {
    if (globalBloch) globalBloch.applyPauli(op);
}

function updateBlochState(state) {
    if (globalBloch) globalBloch.updateState(state);
}

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('bloch-render-target');
    if (el) {
        globalBloch = new BlochSphere3D('bloch-render-target');
    }
});
