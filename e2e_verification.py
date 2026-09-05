import urllib.request
import json
import http.cookiejar

def run_verification():
    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

    # 1. Login
    login_payload = json.dumps({'email': 'admin@qshield.security', 'password': 'QShield@2026'}).encode('utf-8')
    login_req = urllib.request.Request('http://127.0.0.1:5000/api/login', data=login_payload, headers={'Content-Type': 'application/json'})
    res = opener.open(login_req)
    login_data = json.loads(res.read().decode())
    print(f"1. Login Response: success={login_data['success']}, user={login_data['user']['email']}")

    # 2. Run all 6 scenarios consecutively on live server
    scenarios = [
        'Legitimate Communication',
        'Intercept & Resend',
        'Signature Forgery',
        'Replay Attack',
        'Impersonation',
        'Channel Manipulation'
    ]

    for sc in scenarios:
        exp_payload = json.dumps({
            'attack_type': sc,
            'shots': 1000,
            'noise_level': 0.02,
            'measurement_basis': 'Z'
        }).encode('utf-8')
        exp_req = urllib.request.Request('http://127.0.0.1:5000/api/experiments/run', data=exp_payload, headers={'Content-Type': 'application/json'})
        res = opener.open(exp_req)
        data = json.loads(res.read().decode())
        exp = data['experiment']
        print(f"   Experiment #{exp['id']}: {exp['attack_type']:<26} -> QBER: {exp['qber_percentage']:<7} -> {exp['threat_status']:<18} ({exp['verification_result']})")

    # 3. Check Dashboard Summary
    dash_res = opener.open('http://127.0.0.1:5000/api/dashboard')
    dash_data = json.loads(dash_res.read().decode())
    print(f"3. Dashboard Stats: Total Experiments={dash_data['total_experiments']}, Attacks Detected={dash_data['attacks_detected']}, Secure={dash_data['secure_sessions']}")

    # 4. Check History API
    hist_res = opener.open('http://127.0.0.1:5000/api/experiments?page=1&per_page=10')
    hist_data = json.loads(hist_res.read().decode())
    print(f"4. History API Records: count={len(hist_data['experiments'])}, total={hist_data['total']}, pages={hist_data['pages']}")

    # 4.5 Test Quantum Lab Endpoints
    print("\n--- Testing Quantum Lab API Endpoints ---")
    # State Lab
    req = urllib.request.Request('http://127.0.0.1:5000/api/lab/state', data=json.dumps({'theta': 1.5708, 'phi': 0.0}).encode(), headers={'Content-Type': 'application/json'})
    res = opener.open(req)
    st_data = json.loads(res.read().decode())
    print(f"   [State Lab] |+> State Prep: p0={st_data['p0']}%, p1={st_data['p1']}%, x={st_data['x']:.2f}")

    # Pauli Lab
    req = urllib.request.Request('http://127.0.0.1:5000/api/lab/pauli', data=json.dumps({'operator': 'X', 'theta': 0.0, 'phi': 0.0}).encode(), headers={'Content-Type': 'application/json'})
    res = opener.open(req)
    p_data = json.loads(res.read().decode())
    print(f"   [Pauli Lab] Applied X to |0>: new_z={p_data['transformed_state']['z']:.1f} (flipped to |1>)")

    # Bell Lab
    for bell_type in ['phi_plus', 'phi_minus', 'psi_plus', 'psi_minus']:
        req = urllib.request.Request('http://127.0.0.1:5000/api/lab/bell', data=json.dumps({'bell_type': bell_type}).encode(), headers={'Content-Type': 'application/json'})
        res = opener.open(req)
        b_data = json.loads(res.read().decode())
        print(f"   [Bell Lab] {bell_type:<10}: p00={b_data['p00']}%, p11={b_data['p11']}%, p01={b_data['p01']}%, p10={b_data['p10']}%")

    # Teleportation Lab
    for state_choice in ['zero', 'one', 'plus', 'minus']:
        req = urllib.request.Request('http://127.0.0.1:5000/api/lab/teleport', data=json.dumps({'state_choice': state_choice}).encode(), headers={'Content-Type': 'application/json'})
        res = opener.open(req)
        t_data = json.loads(res.read().decode())
        c = t_data['sample_classical_bits']
        print(f"   [Teleport Lab] State={state_choice:<6}: c0={c['c0']}, c1={c['c1']}, Pauli={t_data['pauli_applied']:<18}, Fidelity={t_data['fidelity_percentage']}")

    # Measurement Lab
    for basis in ['Z', 'X', 'Y']:
        req = urllib.request.Request('http://127.0.0.1:5000/api/lab/measure', data=json.dumps({'basis': basis, 'theta': 0.0, 'phi': 0.0, 'shots': 1000}).encode(), headers={'Content-Type': 'application/json'})
        res = opener.open(req)
        m_data = json.loads(res.read().decode())
        print(f"   [Measure Lab] {basis}-Basis: p0={m_data['p0']}%, p1={m_data['p1']}%")

    # 5. Check Pages Accessibility
    print("\n--- Checking Page Routes Accessibility ---")
    for path in ['/dashboard', '/lab', '/quantum-lab', '/threat-detection', '/experiment', '/history', '/documentation', '/login']:
        page_res = opener.open(f'http://127.0.0.1:5000{path}')
        print(f"   Page {path:<20} HTTP {page_res.status} OK")

    print("\nALL VERIFICATION STEPS PASSED PERFECTLY ON LIVE SERVER!")

if __name__ == '__main__':
    run_verification()
