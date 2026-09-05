/**
 * Q-SHIELD Signature 3D Quantum Network Globe Engine
 * Built with Three.js (WebGL) + Graceful 2D Vector Fallback
 * 
 * Centerpiece Features:
 * - Stylized 3D Quantum Network Sphere with subtle lat/long quantum grid & mesh nodes
 * - Distinct nodes: Alice (Signer), Bob (Verifier 1), Charlie (Verifier 2), Eve (Attacker)
 * - Animated quantum particles (continuous bright pulse) vs Classical packets (c0, c1 cubes)
 * - Dynamic Bell Entanglement bridge with pulsing wave
 * - 6-stage teleportation animation with clear stage indicators
 * - Authentic attack simulation: Intercept & Resend, Channel Manipulation, Replay, Forgery, Impersonation
 * - Smooth Orbit/Pan/Zoom camera controls with quick Reset View
 */

class QuantumNetwork3D {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = Object.assign({
            readOnly: false,
            autoRotate: true,
            globeRadius: 5.0,
            showCharlie: true
        }, options);

        this.isWebGLSupported = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animFrameId = null;
        this.clock = null;

        // Camera control state
        this.isDragging = false;
        this.isPanning = false;
        this.prevMouse = { x: 0, y: 0 };
        this.defaultCamera = { theta: 0.15, phi: 0.22, radius: 15.5 };
        this.cameraAngle = { ...this.defaultCamera };
        this.cameraTarget = (typeof THREE !== 'undefined' && typeof THREE.Vector3 === 'function') ? new THREE.Vector3(0, 0.2, 0) : null;
        this.autoRotate = this.options.autoRotate;

        // Protocol state
        this.state = {
            scenario: "Legitimate Communication",
            noiseLevel: 0.02,
            stage: 1, // 1 to 6
            qber: 0.032,
            threatStatus: "SECURE",
            pauliApplied: "Z",
            isPlaying: true,
            progress: 0.0,
            particleT: 0.0,
            classicalT: 0.0,
            intercepted: false
        };

        // 3D references
        this.nodes = {};
        this.channels = {};
        this.entanglementBridge = null;
        this.quantumParticle = null;
        this.classicalPackets = [];
        this.globeGroup = null;
        this.threatAlertGroup = null;

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
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 520;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x080c14); // Dark technical viewport

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.cameraTarget = new THREE.Vector3(0, 0.2, 0);
        this.updateCameraPosition();

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
        dirLight1.position.set(12, 18, 16);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x0f62fe, 0.5);
        dirLight2.position.set(-12, -8, -10);
        this.scene.add(dirLight2);

        // Group hierarchy
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);

        // Build 3D elements
        this.buildQuantumGlobe();
        this.buildNodes();
        this.buildChannels();
        this.buildEntanglementBridge();
        this.buildMovingParticles();
        this.buildClassicalPackets();

        // Interaction
        this.setupInteraction();

        // Clock & loop
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.animate();

        // Resize handler
        window.addEventListener('resize', () => this.resize());
    }

    /* ============================================================
       1. STYLIZED QUANTUM NETWORK SPHERE (Not Earth)
    ============================================================ */
    buildQuantumGlobe() {
        const R = this.options.globeRadius;

        // Subtle inner wireframe sphere
        const innerSphereGeo = new THREE.SphereGeometry(R * 0.98, 36, 36);
        const innerSphereMat = new THREE.MeshBasicMaterial({
            color: 0x0f172a,
            transparent: true,
            opacity: 0.85,
            wireframe: false
        });
        const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
        this.globeGroup.add(innerSphere);

        // Quantum latitude rings
        const latAngles = [-60, -40, -20, 0, 20, 40, 60];
        latAngles.forEach(deg => {
            const phi = (deg * Math.PI) / 180;
            const rLat = R * Math.cos(phi);
            const yLat = R * Math.sin(phi);

            const ringGeo = new THREE.RingGeometry(rLat - 0.02, rLat + 0.02, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: deg === 0 ? 0x0f62fe : 0x1e3a8a,
                transparent: true,
                opacity: deg === 0 ? 0.45 : 0.22,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = yLat;
            this.globeGroup.add(ring);
        });

        // Quantum longitude meridian rings
        for (let i = 0; i < 6; i++) {
            const meridianGeo = new THREE.BufferGeometry();
            const points = [];
            const numSegments = 64;
            for (let j = 0; j <= numSegments; j++) {
                const theta = (j / numSegments) * Math.PI * 2;
                points.push(new THREE.Vector3(R * Math.cos(theta), R * Math.sin(theta), 0));
            }
            meridianGeo.setFromPoints(points);
            const meridianMat = new THREE.LineBasicMaterial({
                color: 0x1e293b,
                transparent: true,
                opacity: 0.3
            });
            const meridian = new THREE.Line(meridianGeo, meridianMat);
            meridian.rotation.y = (i * Math.PI) / 6;
            this.globeGroup.add(meridian);
        }

        // Distributed Quantum Mesh Nodes on Sphere Surface
        const meshNodesCount = 64;
        const meshPoints = [];
        for (let i = 0; i < meshNodesCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / meshNodesCount);
            const theta = Math.sqrt(meshNodesCount * Math.PI) * phi;
            const x = R * Math.cos(theta) * Math.sin(phi);
            const y = R * Math.sin(theta) * Math.sin(phi);
            const z = R * Math.cos(phi);
            meshPoints.push(new THREE.Vector3(x, y, z));
        }

        // Point cloud on sphere
        const pGeo = new THREE.BufferGeometry().setFromPoints(meshPoints);
        const pMat = new THREE.PointsMaterial({
            color: 0x38bdf8,
            size: 0.12,
            transparent: true,
            opacity: 0.65
        });
        const meshCloud = new THREE.Points(pGeo, pMat);
        this.globeGroup.add(meshCloud);

        // Connect subset of mesh nodes with geodesic network threads
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x0284c7,
            transparent: true,
            opacity: 0.18
        });
        for (let i = 0; i < meshPoints.length - 1; i += 2) {
            const p1 = meshPoints[i];
            const p2 = meshPoints[(i + 7) % meshPoints.length];
            const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            const lineMesh = new THREE.Line(lineGeo, lineMat);
            this.globeGroup.add(lineMesh);
        }

        // Outer ambient particle halo
        const haloGeo = new THREE.BufferGeometry();
        const haloPoints = [];
        for (let i = 0; i < 120; i++) {
            const radius = R * (1.05 + Math.random() * 0.4);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            haloPoints.push(new THREE.Vector3(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            ));
        }
        haloGeo.setFromPoints(haloPoints);
        const haloMat = new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 0.08,
            transparent: true,
            opacity: 0.35
        });
        this.haloParticles = new THREE.Points(haloGeo, haloMat);
        this.globeGroup.add(this.haloParticles);
    }

    /* ============================================================
       2. PRIMARY NETWORK NODES (Alice, Bob, Charlie, Eve)
    ============================================================ */
    buildNodes() {
        const R = this.options.globeRadius;

        // Position nodes on sphere with clear visual prominence:
        // Alice (Signer) - Front Left
        const posAlice = new THREE.Vector3(-3.2, 1.6, 3.6).normalize().multiplyScalar(R);
        this.nodes.alice = this.createNodeEntity({
            name: "Alice",
            role: "SIGNER",
            roleGlyph: "◆ SIGNER",
            shapeType: "octahedron", // Geometric diamond/signer key
            subrole: "State Prep & Bell Measurement",
            color: 0x0f62fe, // Electric Blue
            position: posAlice,
            leaderOffset: new THREE.Vector3(-1.2, 1.4, 0)
        });

        // Bob (Verifier 1) - Front Right
        const posBob = new THREE.Vector3(3.2, 1.4, 3.6).normalize().multiplyScalar(R);
        this.nodes.bob = this.createNodeEntity({
            name: "Bob",
            role: "VERIFIER 1",
            roleGlyph: "🛡 VERIFIER 1",
            shapeType: "cylinder", // Hexagonal verifier prism
            subrole: "Pauli Correction & Projection",
            color: 0x10b981, // Secure Green
            position: posBob,
            leaderOffset: new THREE.Vector3(1.2, 1.4, 0)
        });

        // Charlie (Verifier 2) - Lower Center-Right (adjusted Y for complete viewport visibility)
        const posCharlie = new THREE.Vector3(1.4, -1.7, 4.2).normalize().multiplyScalar(R);
        this.nodes.charlie = this.createNodeEntity({
            name: "Charlie",
            role: "VERIFIER 2",
            roleGlyph: "⚖ VERIFIER 2",
            shapeType: "icosahedron", // Dual verifier icosahedron
            subrole: "Multiparty Cross-Check",
            color: 0x06b6d4, // Cyan
            position: posCharlie,
            leaderOffset: new THREE.Vector3(1.2, -1.0, 0)
        });

        // Eve (Attacker) - Midpoint above Alice and Bob (no overlap)
        const posEve = new THREE.Vector3(0.0, 2.6, 4.2).normalize().multiplyScalar(R * 1.05);
        this.nodes.eve = this.createNodeEntity({
            name: "Eve",
            role: "ADVERSARY",
            roleGlyph: "⚠ ADVERSARY",
            shapeType: "tetrahedron", // Sharp threat spike
            subrole: "Quantum Intercept & Resend",
            color: 0xef4444, // Threat Red
            position: posEve,
            leaderOffset: new THREE.Vector3(0, 1.5, 0),
            isEve: true
        });

        // Eve is hidden by default in legitimate mode
        this.nodes.eve.group.visible = false;
    }

    createNodeEntity({ name, role, roleGlyph, shapeType, subrole, color, position, leaderOffset, isEve = false }) {
        const group = new THREE.Group();
        group.position.copy(position);

        // Core sphere
        const coreGeo = new THREE.SphereGeometry(0.55, 32, 32);
        const coreMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.8
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // Subtle geometric identity wireframe shape surrounding the node
        let identityGeo;
        if (shapeType === 'octahedron') {
            identityGeo = new THREE.OctahedronGeometry(0.88, 0);
        } else if (shapeType === 'cylinder') {
            identityGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.5, 6);
        } else if (shapeType === 'icosahedron') {
            identityGeo = new THREE.IcosahedronGeometry(0.88, 0);
        } else {
            identityGeo = new THREE.TetrahedronGeometry(0.98, 0);
        }

        const identityMat = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.45
        });
        const identityMesh = new THREE.Mesh(identityGeo, identityMat);
        group.add(identityMesh);

        // Rotating orbital ring
        const ringGeo = new THREE.TorusGeometry(0.85, 0.03, 16, 48);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 3;
        group.add(ring);

        // Pulsing aura sphere
        const auraGeo = new THREE.SphereGeometry(0.72, 24, 24);
        const auraMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.25,
            wireframe: true
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        group.add(aura);

        // Thin Leader Line connecting node to 3D label
        const linePoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(leaderOffset.x * 0.4, leaderOffset.y * 0.5, leaderOffset.z * 0.4),
            leaderOffset
        ];
        const leaderGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
        const leaderMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6
        });
        const leaderLine = new THREE.Line(leaderGeo, leaderMat);
        group.add(leaderLine);

        // Billboard badge on top of leader line
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');

        // Background pill
        ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
        ctx.strokeStyle = isEve ? '#ef4444' : '#334155';
        ctx.lineWidth = 3;
        this.roundRect(ctx, 4, 4, 312, 112, 12, true, true);

        // Accent indicator
        ctx.fillStyle = isEve ? '#ef4444' : (color === 0x0f62fe ? '#0f62fe' : (color === 0x10b981 ? '#10b981' : '#06b6d4'));
        ctx.beginPath();
        ctx.arc(32, 40, 8, 0, Math.PI * 2);
        ctx.fill();

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(name.toUpperCase(), 52, 48);

        // Role with subtle identity glyph
        ctx.fillStyle = isEve ? '#f87171' : (color === 0x0f62fe ? '#60a5fa' : (color === 0x10b981 ? '#34d399' : '#38bdf8'));
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillText(roleGlyph || role, 32, 86);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(leaderOffset);
        sprite.position.y += 0.35;
        sprite.scale.set(2.5, 1.0, 1);
        group.add(sprite);

        this.globeGroup.add(group);

        return {
            group,
            core,
            ring,
            aura,
            identityMesh,
            sprite,
            position,
            color,
            name,
            isEve
        };
    }

    roundRect(ctx, x, y, w, h, r, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    /* ============================================================
       3. QUANTUM & CLASSICAL CHANNELS
    ============================================================ */
    buildChannels() {
        this.rebuildChannels();
    }

    rebuildChannels() {
        if (!this.globeGroup || !this.nodes.alice || !this.nodes.bob) return;

        // Clean up previous channel meshes
        if (this.channels.quantumMesh) {
            this.globeGroup.remove(this.channels.quantumMesh);
            if (this.channels.quantumMesh.geometry) this.channels.quantumMesh.geometry.dispose();
            if (this.channels.quantumMesh.material) this.channels.quantumMesh.material.dispose();
            this.channels.quantumMesh = null;
        }
        if (this.channels.classicalMesh) {
            this.globeGroup.remove(this.channels.classicalMesh);
            if (this.channels.classicalMesh.geometry) this.channels.classicalMesh.geometry.dispose();
            if (this.channels.classicalMesh.material) this.channels.classicalMesh.material.dispose();
            this.channels.classicalMesh = null;
        }
        if (this.channels.charlieMesh) {
            this.globeGroup.remove(this.channels.charlieMesh);
            if (this.channels.charlieMesh.geometry) this.channels.charlieMesh.geometry.dispose();
            if (this.channels.charlieMesh.material) this.channels.charlieMesh.material.dispose();
            this.channels.charlieMesh = null;
        }

        const posAlice = this.nodes.alice.position;
        const posBob = this.nodes.bob.position;
        const posCharlie = this.nodes.charlie ? this.nodes.charlie.position : null;
        const posEve = this.nodes.eve ? this.nodes.eve.position : null;

        const isIntercept = (this.state.scenario === "Intercept & Resend");
        const isChannelManipulated = (this.state.scenario === "Channel Manipulation");
        const isForgery = (this.state.scenario === "Signature Forgery");
        const isImpersonation = (this.state.scenario === "Impersonation");
        const isReplay = (this.state.scenario === "Replay Attack");

        // A. Quantum Channel Curve
        let quantumCurve;
        if (isIntercept && posEve) {
            // Channel path routes physically through Eve: Alice -> Eve -> Bob
            const midAE = new THREE.Vector3().addVectors(posAlice, posEve).multiplyScalar(0.53);
            const midEB = new THREE.Vector3().addVectors(posEve, posBob).multiplyScalar(0.53);
            const curve1 = new THREE.QuadraticBezierCurve3(posAlice, midAE, posEve);
            const curve2 = new THREE.QuadraticBezierCurve3(posEve, midEB, posBob);

            this.curveAliceEve = curve1;
            this.curveEveBob = curve2;

            const pts1 = curve1.getPoints(24);
            const pts2 = curve2.getPoints(24);
            const allPts = pts1.concat(pts2.slice(1));
            quantumCurve = new THREE.CatmullRomCurve3(allPts);
            quantumCurve.curveType = 'catmullrom';
            quantumCurve.tension = 0.5;
        } else {
            // Direct arched curve from Alice to Bob
            const midPoint = new THREE.Vector3().addVectors(posAlice, posBob).multiplyScalar(0.58);
            midPoint.y += 1.4; // Arch upwards
            quantumCurve = new THREE.QuadraticBezierCurve3(posAlice, midPoint, posBob);
            this.curveAliceEve = null;
            this.curveEveBob = null;
        }
        this.quantumCurve = quantumCurve;

        const noise = this.state.noiseLevel || 0.0;
        const tubeRadius = isChannelManipulated ? (0.07 + noise * 0.35) : (isIntercept ? 0.065 : (isForgery || isImpersonation ? 0.065 : 0.058));
        const qGeo = new THREE.TubeGeometry(quantumCurve, 54, tubeRadius, 10, false);

        let chColor = 0x00f0ff;
        let chEmissive = 0x0077b6;
        if (isIntercept) {
            chColor = 0xef4444; chEmissive = 0xb91c1c;
        } else if (isChannelManipulated) {
            if (noise > 0.15) { chColor = 0xef4444; chEmissive = 0xb91c1c; }
            else if (noise > 0.08) { chColor = 0xf59e0b; chEmissive = 0xd97706; }
            else if (noise > 0.03) { chColor = 0x06b6d4; chEmissive = 0x0284c7; }
            else { chColor = 0x00f0ff; chEmissive = 0x0077b6; }
        } else if (isForgery) {
            chColor = 0xd946ef; chEmissive = 0x9333ea;
        } else if (isImpersonation) {
            chColor = 0xf97316; chEmissive = 0xc2410c;
        } else if (isReplay) {
            chColor = 0xf43f5e; chEmissive = 0xbe123c;
        }

        const qMat = new THREE.MeshStandardMaterial({
            color: chColor,
            emissive: chEmissive,
            emissiveIntensity: 0.85,
            transparent: true,
            opacity: 0.82,
            roughness: 0.25
        });
        this.channels.quantumMesh = new THREE.Mesh(qGeo, qMat);
        this.globeGroup.add(this.channels.quantumMesh);

        // B. Secondary Quantum Channel: Alice -> Charlie
        if (posCharlie) {
            const charlieControl = new THREE.Vector3(-0.8, -0.6, 4.6);
            const charlieCurve = new THREE.QuadraticBezierCurve3(posAlice, charlieControl, posCharlie);
            this.charlieCurve = charlieCurve;

            const cGeo = new THREE.TubeGeometry(charlieCurve, 36, 0.04, 8, false);
            const cMat = new THREE.MeshStandardMaterial({
                color: 0x06b6d4,
                emissive: 0x0284c7,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.55
            });
            this.channels.charlieMesh = new THREE.Mesh(cGeo, cMat);
            this.globeGroup.add(this.channels.charlieMesh);
        }

        // C. Distinct Classical Channel: Elevated Arc for c0/c1 packets
        const classicalControl = new THREE.Vector3(0, 4.6, 5.4);
        const classicalCurve = new THREE.QuadraticBezierCurve3(posAlice, classicalControl, posBob);
        this.classicalCurve = classicalCurve;

        const clGeo = new THREE.TubeGeometry(classicalCurve, 40, 0.035, 8, false);
        const clMat = new THREE.MeshBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.45,
            wireframe: true
        });
        this.channels.classicalMesh = new THREE.Mesh(clGeo, clMat);
        this.globeGroup.add(this.channels.classicalMesh);
    }

    /* ============================================================
       4. 3D BELL ENTANGLEMENT BRIDGE
    ============================================================ */
    buildEntanglementBridge() {
        const group = new THREE.Group();
        const posAlice = this.nodes.alice.position;
        const posBob = this.nodes.bob.position;

        // Oscillating wave between Alice and Bob
        const numPts = 32;
        const pts = [];
        for (let i = 0; i <= numPts; i++) {
            const alpha = i / numPts;
            const p = new THREE.Vector3().lerpVectors(posAlice, posBob, alpha);
            pts.push(p);
        }

        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.6,
            linewidth: 2
        });
        this.entanglementLine = new THREE.Line(geo, mat);
        group.add(this.entanglementLine);

        // Bell Entanglement 3D label badge
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 2, 2, 236, 60, 8, true, true);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BELL ENTANGLEMENT', 120, 38);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        this.entanglementSprite = new THREE.Sprite(spriteMat);
        const midPoint = new THREE.Vector3().lerpVectors(posAlice, posBob, 0.5);
        this.entanglementSprite.position.copy(midPoint);
        this.entanglementSprite.position.y += 0.6;
        this.entanglementSprite.scale.set(1.6, 0.42, 1);
        group.add(this.entanglementSprite);

        this.entanglementBridge = group;
        this.entanglementBridge.visible = false; // Triggered on Bell stage
        this.globeGroup.add(this.entanglementBridge);
    }

    /* ============================================================
       5. MOVING PARTICLES: Quantum Photon vs Classical Packets
    ============================================================ */
    buildMovingParticles() {
        // Quantum Transmission Particle (Luminous Energy Sphere + Aura)
        const pGroup = new THREE.Group();

        const coreGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        pGroup.add(core);

        const haloGeo = new THREE.SphereGeometry(0.38, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.65
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        pGroup.add(halo);

        this.quantumParticle = pGroup;
        this.globeGroup.add(this.quantumParticle);
    }

    buildClassicalPackets() {
        // Discrete classical packets carrying c0 and c1
        ['c₀', 'c₁'].forEach((label, idx) => {
            const group = new THREE.Group();

            // Small glowing cube
            const boxGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
            const boxMat = new THREE.MeshStandardMaterial({
                color: 0xf59e0b, // Amber
                emissive: 0xd97706,
                roughness: 0.3
            });
            const box = new THREE.Mesh(boxGeo, boxMat);
            group.add(box);

            // Text Sprite
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, 32, 44);

            const tex = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.y = 0.38;
            sprite.scale.set(0.6, 0.6, 1);
            group.add(sprite);

            group.visible = false;
            this.classicalPackets.push({ group, offset: idx * 0.12 });
            this.globeGroup.add(group);
        });
    }

    /* ============================================================
       6. INTERACTION (Rotate, Zoom, Pan, Reset)
    ============================================================ */
    setupInteraction() {
        const dom = this.renderer.domElement;

        dom.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.isPanning = (e.button === 2 || e.shiftKey);
            this.prevMouse = { x: e.clientX, y: e.clientY };
            this.autoRotate = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.prevMouse.x;
            const dy = e.clientY - this.prevMouse.y;

            if (this.isPanning) {
                // Pan camera
                this.cameraTarget.x -= dx * 0.01;
                this.cameraTarget.y += dy * 0.01;
            } else {
                // Orbit camera
                this.cameraAngle.theta += dx * 0.006;
                this.cameraAngle.phi = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraAngle.phi + dy * 0.006));
            }

            this.prevMouse = { x: e.clientX, y: e.clientY };
            this.updateCameraPosition();
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isPanning = false;
        });

        dom.addEventListener('contextmenu', (e) => e.preventDefault());

        dom.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraAngle.radius = Math.max(8.0, Math.min(26.0, this.cameraAngle.radius + e.deltaY * 0.015));
            this.updateCameraPosition();
        }, { passive: false });
    }

    updateCameraPosition() {
        const { theta, phi, radius } = this.cameraAngle;
        this.camera.position.x = this.cameraTarget.x + radius * Math.sin(theta) * Math.cos(phi);
        this.camera.position.y = this.cameraTarget.y + radius * Math.sin(phi);
        this.camera.position.z = this.cameraTarget.z + radius * Math.cos(theta) * Math.cos(phi);
        this.camera.lookAt(this.cameraTarget);
    }

    resetView() {
        this.cameraAngle = { ...this.defaultCamera };
        this.cameraTarget.set(0, 0.2, 0);
        this.updateCameraPosition();
        this.autoRotate = true;
    }

    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        return this.autoRotate;
    }

    resize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /* ============================================================
       7. ANIMATION LOOP & PROTOCOL SEQUENCING
    ============================================================ */
    animate() {
        this.animFrameId = requestAnimationFrame(this.animate);
        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // 1. Idle Globe Rotation
        if (this.autoRotate && !this.isDragging) {
            this.cameraAngle.theta += delta * 0.12;
            this.updateCameraPosition();
        }

        // 2. Pulse Orbital Rings & Geometric Identity Wireframes
        Object.values(this.nodes).forEach(n => {
            if (n && n.ring) n.ring.rotation.z += delta * 0.8;
            if (n && n.identityMesh) {
                n.identityMesh.rotation.x += delta * 0.35;
                n.identityMesh.rotation.y += delta * 0.5;
            }
            if (n && n.aura) {
                const s = 1.0 + 0.08 * Math.sin(elapsed * 3.5);
                n.aura.scale.set(s, s, s);
            }
        });

        // 3. Entanglement Bridge Wave
        if (this.entanglementBridge && this.entanglementBridge.visible) {
            const pts = this.entanglementLine.geometry.attributes.position.array;
            const numPts = pts.length / 3;
            for (let i = 0; i < numPts; i++) {
                const alpha = i / (numPts - 1);
                // Sine perturbation perpendicular to line
                pts[i * 3 + 1] = pts[i * 3 + 1] + Math.sin(elapsed * 8.0 + alpha * 12.0) * 0.008;
            }
            this.entanglementLine.geometry.attributes.position.needsUpdate = true;
        }

        // 4. Quantum Particle Flow
        this.animateQuantumParticle(elapsed, delta);

        // 5. Classical Packets Flow (Active during Stage 4 / Teleportation)
        this.animateClassicalPackets(elapsed, delta);

        // 6. Threat specific visual perturbations
        this.applyThreatEffects(elapsed);

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    animateQuantumParticle(elapsed, delta) {
        if (!this.quantumParticle) return;

        const speed = 0.40; // Smooth 1.2s - 1.6s readable transit
        this.state.particleT = (this.state.particleT + delta * speed) % 1.0;
        const t = this.state.particleT;

        const isIntercept = (this.state.scenario === "Intercept & Resend");
        const isChannelManipulated = (this.state.scenario === "Channel Manipulation");
        const isForgery = (this.state.scenario === "Signature Forgery");
        const isImpersonation = (this.state.scenario === "Impersonation");
        const isReplay = (this.state.scenario === "Replay Attack");

        // Dynamic halo color reaction
        if (this.quantumParticle.children && this.quantumParticle.children[1]) {
            const haloMat = this.quantumParticle.children[1].material;
            if (isIntercept) {
                haloMat.color.setHex(t > 0.48 ? 0xef4444 : 0x00f0ff);
            } else if (isForgery) {
                haloMat.color.setHex(0xd946ef); // Forged altered state
            } else if (isChannelManipulated) {
                haloMat.color.setHex(this.state.noiseLevel > 0.08 ? 0xf59e0b : 0x00f0ff);
            } else if (isImpersonation) {
                haloMat.color.setHex(0xf97316); // Unauthorized
            } else if (isReplay) {
                haloMat.color.setHex(0xf43f5e); // Replay
            } else {
                haloMat.color.setHex(0x00f0ff); // Pure quantum state
            }
        }

        if (isIntercept && this.curveAliceEve && this.curveEveBob) {
            // Visual Sequence: Alice -> Eve, pause/intercept measurement pulse, Eve -> Bob
            let currentPos;
            if (t < 0.45) {
                // Leg 1: Alice to Eve
                const subT = t / 0.45;
                currentPos = this.curveAliceEve.getPoint(subT);
            } else if (t <= 0.55) {
                // Intercept event at Eve
                currentPos = this.nodes.eve.position.clone();
                // Eve aura measurement collapse pulse
                if (this.nodes.eve.aura) {
                    const s = 1.3 + Math.sin(elapsed * 18.0) * 0.45;
                    this.nodes.eve.aura.scale.set(s, s, s);
                    this.nodes.eve.aura.material.opacity = 0.95;
                }
            } else {
                // Leg 2: Eve resends altered collapsed state to Bob
                const subT = (t - 0.55) / 0.45;
                currentPos = this.curveEveBob.getPoint(subT);
                currentPos.x += (Math.random() - 0.5) * 0.08;
                currentPos.y += (Math.random() - 0.5) * 0.08;
            }
            this.quantumParticle.position.copy(currentPos);
        } else if (isChannelManipulated && this.quantumCurve) {
            const currentPos = this.quantumCurve.getPoint(t);
            const noise = this.state.noiseLevel || 0.0;
            const jitter = noise * 0.85;
            currentPos.x += (Math.sin(elapsed * 25.0) + Math.random() - 0.5) * jitter;
            currentPos.y += (Math.cos(elapsed * 22.0) + Math.random() - 0.5) * jitter;
            currentPos.z += (Math.sin(elapsed * 28.0) + Math.random() - 0.5) * (jitter * 0.5);
            this.quantumParticle.position.copy(currentPos);
        } else if (this.quantumCurve) {
            // Legitimate & other attack scenarios along curve
            const currentPos = this.quantumCurve.getPoint(t);
            this.quantumParticle.position.copy(currentPos);
        }
    }

    animateClassicalPackets(elapsed, delta) {
        if (!this.classicalPackets || !this.classicalCurve) return;

        const isStageClassical = (this.state.stage >= 4 || this.state.scenario === "Replay Attack");
        this.classicalPackets.forEach(p => {
            p.group.visible = isStageClassical;
            if (isStageClassical) {
                const t = (elapsed * 0.35 + p.offset) % 1.0;
                const pos = this.classicalCurve.getPoint(t);
                p.group.position.copy(pos);
                p.group.rotation.x += delta * 2;
                p.group.rotation.y += delta * 3;
            }
        });
    }

    applyThreatEffects(elapsed) {
        const scenario = this.state.scenario;

        // Channel Manipulation: Dynamic turbulence scaled by noise level
        if (scenario === "Channel Manipulation" && this.channels.quantumMesh) {
            const noise = this.state.noiseLevel || 0.0;
            const turbulence = noise * 0.35;
            this.channels.quantumMesh.position.x = Math.sin(elapsed * 10.0) * turbulence;
            this.channels.quantumMesh.position.y = Math.cos(elapsed * 8.0) * turbulence;
            this.channels.quantumMesh.rotation.z = Math.sin(elapsed * 6.0) * (noise * 0.12);
        } else if (this.channels.quantumMesh) {
            this.channels.quantumMesh.position.set(0, 0, 0);
            this.channels.quantumMesh.rotation.set(0, 0, 0);
        }
    }

    updateNodeBadge(node, title, role, color = '#ffffff', roleColor = '#60a5fa') {
        if (!node || !node.sprite) return;
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(8, 12, 20, 0.92)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        this.roundRect(ctx, 4, 4, 312, 112, 12, true, true);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(32, 40, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title.toUpperCase(), 52, 48);

        ctx.fillStyle = roleColor;
        ctx.font = '600 19px "JetBrains Mono", monospace';
        ctx.fillText(role, 32, 86);

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        if (node.sprite.material.map) node.sprite.material.map.dispose();
        node.sprite.material.map = tex;
        node.sprite.material.needsUpdate = true;
    }

    updateClassicalPackets(isReplay = false) {
        if (!this.classicalPackets || this.classicalPackets.length < 2) return;
        const labels = isReplay ? ['REPLAY', 'NONCE'] : ['c₀', 'c₁'];
        const boxColor = isReplay ? 0xef4444 : 0xf59e0b;
        const emissiveColor = isReplay ? 0xb91c1c : 0xd97706;

        this.classicalPackets.forEach((p, idx) => {
            if (p.group.children[0] && p.group.children[0].material) {
                p.group.children[0].material.color.setHex(boxColor);
                p.group.children[0].material.emissive.setHex(emissiveColor);
            }
            if (p.group.children[1] && p.group.children[1].material) {
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = isReplay ? 'rgba(239, 68, 68, 0.9)' : 'rgba(15, 23, 42, 0.9)';
                ctx.strokeStyle = isReplay ? '#ef4444' : '#f59e0b';
                ctx.lineWidth = 2;
                this.roundRect(ctx, 2, 2, 124, 60, 8, true, true);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(labels[idx], 64, 40);

                const tex = new THREE.CanvasTexture(canvas);
                tex.minFilter = THREE.LinearFilter;
                if (p.group.children[1].material.map) p.group.children[1].material.map.dispose();
                p.group.children[1].material.map = tex;
                p.group.children[1].material.needsUpdate = true;
                p.group.children[1].scale.set(isReplay ? 1.1 : 0.6, isReplay ? 0.55 : 0.6, 1);
            }
        });
    }

    /* ============================================================
       8. PUBLIC API & CONTROLS
    ============================================================ */
    setScenario(scenarioName, autoAnimate = true) {
        this.state.scenario = scenarioName;

        const isAttack = (scenarioName !== "Legitimate Communication");
        const isIntercept = (scenarioName === "Intercept & Resend");
        const isImpersonation = (scenarioName === "Impersonation");
        const isForgery = (scenarioName === "Signature Forgery");
        const isReplay = (scenarioName === "Replay Attack");

        // Eve visibility: Active in attack scenarios, inactive in legitimate
        if (this.nodes.eve) {
            this.nodes.eve.group.visible = isAttack;
            if (this.nodes.eve.aura) {
                this.nodes.eve.aura.material.color.setHex(0xef4444);
                this.nodes.eve.aura.material.opacity = isIntercept ? 0.85 : 0.45;
            }
        }

        // Alice / Signer Identity Reaction
        if (this.nodes.alice) {
            if (isImpersonation) {
                this.nodes.alice.aura.material.color.setHex(0xf97316); // Unauthorized orange
                this.nodes.alice.aura.material.opacity = 0.7;
                this.updateNodeBadge(this.nodes.alice, "UNTRUSTED SIGNER", "⚠ UNAUTHORIZED", "#f97316", "#fb923c");
            } else {
                this.nodes.alice.aura.material.color.setHex(0x0f62fe);
                this.nodes.alice.aura.material.opacity = 0.25;
                this.updateNodeBadge(this.nodes.alice, "ALICE", "◆ SIGNER", "#0f62fe", "#60a5fa");
            }
        }

        // Bob Verifier Reaction
        if (this.nodes.bob && this.nodes.bob.aura) {
            if (isForgery || isIntercept) {
                this.nodes.bob.aura.material.color.setHex(0xef4444);
                this.nodes.bob.aura.material.opacity = 0.6;
            } else {
                this.nodes.bob.aura.material.color.setHex(0x10b981);
                this.nodes.bob.aura.material.opacity = 0.25;
            }
        }

        // Classical Packets labeling
        this.updateClassicalPackets(isReplay);

        // Rebuild 3D channels for the selected scenario
        this.rebuildChannels();

        // Update active badge in UI if container has elements
        this.updateStageUI(this.state.stage);
    }

    updateChannelAppearance() {
        if (!this.channels.quantumMesh || !this.channels.quantumMesh.material) return;
        const noise = this.state.noiseLevel || 0.0;
        const isManipulated = (this.state.scenario === "Channel Manipulation");
        const isIntercept = (this.state.scenario === "Intercept & Resend");

        if (isIntercept) {
            this.channels.quantumMesh.material.color.setHex(0xef4444);
            this.channels.quantumMesh.material.emissive.setHex(0xb91c1c);
            this.channels.quantumMesh.material.opacity = 0.88;
        } else if (isManipulated) {
            if (noise > 0.15) {
                this.channels.quantumMesh.material.color.setHex(0xef4444);
                this.channels.quantumMesh.material.emissive.setHex(0xb91c1c);
                this.channels.quantumMesh.material.opacity = 0.92;
            } else if (noise > 0.08) {
                this.channels.quantumMesh.material.color.setHex(0xf59e0b);
                this.channels.quantumMesh.material.emissive.setHex(0xd97706);
                this.channels.quantumMesh.material.opacity = 0.82;
            } else if (noise > 0.03) {
                this.channels.quantumMesh.material.color.setHex(0x06b6d4);
                this.channels.quantumMesh.material.emissive.setHex(0x0284c7);
                this.channels.quantumMesh.material.opacity = 0.78;
            } else {
                this.channels.quantumMesh.material.color.setHex(0x00f0ff);
                this.channels.quantumMesh.material.emissive.setHex(0x0077b6);
                this.channels.quantumMesh.material.opacity = 0.72;
            }
        }
    }

    setNoiseLevel(noiseRate) {
        this.state.noiseLevel = Math.max(0.0, Math.min(0.20, parseFloat(noiseRate) || 0.0));
        this.updateChannelAppearance();
        if (this.state.scenario === "Channel Manipulation") {
            this.rebuildChannels();
        }
    }

    setStage(stageNum) {
        this.state.stage = Math.max(1, Math.min(9, parseInt(stageNum) || 1));
        const s = this.state.stage;
        const scenario = this.state.scenario;
        const isAttack = (scenario !== "Legitimate Communication");

        // Entanglement bridge visibility (Stages 2 and 3)
        if (this.entanglementBridge) {
            this.entanglementBridge.visible = (s === 2 || s === 3);
        }

        // Classical packets visibility (Stage 4, or Replay Attack)
        if (this.classicalPackets) {
            const isClassical = (s === 4 || scenario === "Replay Attack");
            this.classicalPackets.forEach(p => {
                p.group.visible = isClassical;
            });
        }

        // Alice node emphasis
        if (this.nodes.alice && this.nodes.alice.aura) {
            if (s === 1) {
                this.nodes.alice.aura.material.opacity = 0.85;
                this.nodes.alice.aura.scale.set(1.6, 1.6, 1.6);
            } else if (s === 3) {
                this.nodes.alice.aura.material.opacity = 0.7;
                this.nodes.alice.aura.scale.set(1.4, 1.4, 1.4);
            } else {
                this.nodes.alice.aura.material.opacity = (scenario === "Impersonation") ? 0.7 : 0.25;
                this.nodes.alice.aura.scale.set(1.0, 1.0, 1.0);
            }
        }

        // Bob node emphasis
        if (this.nodes.bob && this.nodes.bob.aura) {
            if (s === 2) {
                this.nodes.bob.aura.material.opacity = 0.6;
                this.nodes.bob.aura.scale.set(1.3, 1.3, 1.3);
            } else if (s === 5) {
                this.nodes.bob.aura.material.color.setHex(0x10b981);
                this.nodes.bob.aura.material.opacity = 0.8;
                this.nodes.bob.aura.scale.set(1.55, 1.55, 1.55);
            } else if (s === 6) {
                this.nodes.bob.aura.material.color.setHex(0x00f0ff);
                this.nodes.bob.aura.material.opacity = 0.85;
                this.nodes.bob.aura.scale.set(1.65, 1.65, 1.65);
            } else if (s === 7) {
                this.nodes.bob.aura.material.color.setHex(0x10b981);
                this.nodes.bob.aura.material.opacity = 0.75;
                this.nodes.bob.aura.scale.set(1.45, 1.45, 1.45);
            } else if (s === 8) {
                this.nodes.bob.aura.material.color.setHex(0x0f62fe);
                this.nodes.bob.aura.material.opacity = 0.65;
                this.nodes.bob.aura.scale.set(1.35, 1.35, 1.35);
            } else if (s === 9) {
                const isSecure = (this.state.threatStatus === "SECURE");
                this.nodes.bob.aura.material.color.setHex(isSecure ? 0x10b981 : 0xef4444);
                this.nodes.bob.aura.material.opacity = 0.85;
                this.nodes.bob.aura.scale.set(1.55, 1.55, 1.55);
            } else {
                this.nodes.bob.aura.material.color.setHex(0x10b981);
                this.nodes.bob.aura.material.opacity = 0.25;
                this.nodes.bob.aura.scale.set(1.0, 1.0, 1.0);
            }
        }

        // Charlie node emphasis
        if (this.nodes.charlie && this.nodes.charlie.aura) {
            if (s === 7) {
                this.nodes.charlie.aura.material.color.setHex(0x00f0ff);
                this.nodes.charlie.aura.material.opacity = 0.85;
                this.nodes.charlie.aura.scale.set(1.6, 1.6, 1.6);
            } else if (s === 8) {
                this.nodes.charlie.aura.material.color.setHex(0x06b6d4);
                this.nodes.charlie.aura.material.opacity = 0.55;
                this.nodes.charlie.aura.scale.set(1.25, 1.25, 1.25);
            } else if (s === 9) {
                const isSecure = (this.state.threatStatus === "SECURE");
                this.nodes.charlie.aura.material.color.setHex(isSecure ? 0x10b981 : 0xef4444);
                this.nodes.charlie.aura.material.opacity = 0.7;
                this.nodes.charlie.aura.scale.set(1.4, 1.4, 1.4);
            } else {
                this.nodes.charlie.aura.material.color.setHex(0x06b6d4);
                this.nodes.charlie.aura.material.opacity = 0.25;
                this.nodes.charlie.aura.scale.set(1.0, 1.0, 1.0);
            }
        }

        // Charlie channel emphasis during Stage 7 (Verification cross-check)
        if (this.channels.charlieMesh && this.channels.charlieMesh.material) {
            if (s === 7) {
                this.channels.charlieMesh.material.opacity = 0.95;
                this.channels.charlieMesh.material.color.setHex(0x00f0ff);
            } else if (s === 8 || s === 9) {
                this.channels.charlieMesh.material.opacity = 0.65;
                this.channels.charlieMesh.material.color.setHex(0x06b6d4);
            } else {
                this.channels.charlieMesh.material.opacity = 0.35;
                this.channels.charlieMesh.material.color.setHex(0x06b6d4);
            }
        }

        // Quantum particle flow handling by stage
        if (this.quantumParticle) {
            if (s === 1) {
                this.quantumParticle.visible = false;
            } else if (s >= 2 && s <= 5) {
                this.quantumParticle.visible = true;
            } else if (s === 6) {
                this.quantumParticle.visible = true;
                this.state.particleT = 0.98;
            } else {
                this.quantumParticle.visible = (s <= 8);
            }
        }

        // Eve node emphasis during attack execution
        if (this.nodes.eve) {
            if (isAttack) {
                this.nodes.eve.group.visible = true;
                if (s === 4 || s === 5) {
                    if (this.nodes.eve.aura) {
                        this.nodes.eve.aura.material.opacity = 0.95;
                        this.nodes.eve.aura.scale.set(1.75, 1.75, 1.75);
                    }
                } else if (s === 9 && this.state.threatStatus !== "SECURE") {
                    if (this.nodes.eve.aura) {
                        this.nodes.eve.aura.material.opacity = 0.9;
                        this.nodes.eve.aura.scale.set(1.65, 1.65, 1.65);
                    }
                } else {
                    if (this.nodes.eve.aura) {
                        this.nodes.eve.aura.material.opacity = 0.45;
                        this.nodes.eve.aura.scale.set(1.0, 1.0, 1.0);
                    }
                }
            } else {
                this.nodes.eve.group.visible = false;
            }
        }

        // Update Stage text overlay if present
        this.updateStageUI(this.state.stage);
    }

    updateStageUI(stageNum) {
        const scenario = this.state.scenario;
        let st4Text = "04 CLASSICAL FEED (c₀, c₁): Transmitting bits over classical channel";
        let st5Text = "05 PAULI CORRECTION: Bob applying conditional unitary correction";

        if (scenario === "Intercept & Resend") {
            st4Text = "04 ATTACK VECTOR ACTIVE: Eve intercepting channel qubit q₂";
            st5Text = "05 INTERCEPTION COLLAPSE: Eve projective measurement collapses state";
        } else if (scenario === "Channel Manipulation") {
            st4Text = "04 ATTACK VECTOR ACTIVE: Injecting depolarizing noise into channel";
            st5Text = "05 CHANNEL DISTURBANCE: Environmental decoherence perturbing channel";
        } else if (scenario === "Signature Forgery") {
            st4Text = "04 ATTACK VECTOR ACTIVE: Transmitting altered forged signature payload";
            st5Text = "05 CHANNEL INSPECTION: Evaluating basis mismatch under forgery";
        } else if (scenario === "Replay Attack") {
            st4Text = "04 ATTACK VECTOR ACTIVE: Re-transmitting captured token (nonce check)";
            st5Text = "05 TOKEN INSPECTION: SQLite nonce ledger evaluating replay";
        } else if (scenario === "Impersonation") {
            st4Text = "04 ATTACK VECTOR ACTIVE: Unauthorized signer attempting communication";
            st5Text = "05 IDENTITY VERIFICATION: Verifying signer key material parity";
        }

        const stageTitles = {
            1: "01 STATE PREPARATION: Alice preparing secret signature state |ψ⟩",
            2: "02 BELL ENTANGLEMENT: Generating Bell Pair |Φ⁺⟩ on (q₁, q₂)",
            3: "03 QUANTUM TRANSMISSION: Transmitting state through channel",
            4: st4Text,
            5: st5Text,
            6: "06 RECEPTION: Bob receiving transmitted quantum state",
            7: "07 VERIFICATION: Bob & Charlie cross-verifying signature parity",
            8: "08 STATISTICAL ANALYSIS: Evaluating QBER against 11.0% cutoff limit",
            9: "09 FINAL SECURITY DECISION: Deterministic verdict calculated"
        };

        const stageTextEl = document.getElementById('overlay-stage-text') || document.getElementById('current-stage-title') || document.getElementById('lab-overlay-stage');
        if (stageTextEl) {
            stageTextEl.textContent = stageTitles[stageNum] || stageTitles[1];
        }

        // Highlight active step item
        document.querySelectorAll('.stage-step-btn').forEach(btn => {
            const stepId = parseInt(btn.getAttribute('data-step') || "0");
            if (stepId === stageNum) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    triggerExperiment(expData) {
        if (!expData) return;
        this.state.qber = expData.qber || 0.0;
        this.state.threatStatus = expData.threat_status || "SECURE";
        this.state.scenario = expData.attack_type || "Legitimate Communication";
        if (typeof expData.noise_level !== 'undefined') {
            this.state.noiseLevel = expData.noise_level;
        }
        this.setScenario(this.state.scenario);
        this.setStage(9);
    }

    /* ============================================================
       9. 2D VECTOR FALLBACK (Graceful Degraded Mode)
    ============================================================ */
    init2DFallback() {
        this.container.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #080c14; color: #94a3b8; font-family: 'JetBrains Mono', monospace; padding: 20px;">
                <svg width="600" height="260" viewBox="0 0 600 260" style="max-width: 100%;">
                    <!-- Background Grid -->
                    <circle cx="300" cy="130" r="100" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="4,4"/>
                    <!-- Quantum Channels -->
                    <path d="M 120 130 Q 300 80 480 130" fill="none" stroke="#00f0ff" stroke-width="3"/>
                    <path d="M 120 130 Q 300 40 480 130" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,4"/>
                    <!-- Alice Node -->
                    <circle cx="120" cy="130" r="18" fill="#0f62fe"/>
                    <text x="120" y="170" fill="#ffffff" font-size="12" text-anchor="middle">ALICE (SIGNER)</text>
                    <!-- Bob Node -->
                    <circle cx="480" cy="130" r="18" fill="#10b981"/>
                    <text x="480" y="170" fill="#ffffff" font-size="12" text-anchor="middle">BOB (VERIFIER)</text>
                    <!-- Eve Node -->
                    <circle cx="300" cy="80" r="14" fill="#ef4444"/>
                    <text x="300" y="60" fill="#f87171" font-size="11" text-anchor="middle">EVE (ADVERSARY)</text>
                </svg>
                <p style="margin-top: 10px; font-size: 13px;">[WebGL 2D Vector Projection Active]</p>
            </div>
        `;
    }
}

window.QuantumNetwork3D = QuantumNetwork3D;
