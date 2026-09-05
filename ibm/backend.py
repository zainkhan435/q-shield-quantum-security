import os
from typing import Dict, Any, Optional

def is_ibm_quantum_configured() -> bool:
    """Checks if valid IBM Quantum runtime credentials are configured in the environment."""
    token = os.getenv("IBM_QUANTUM_TOKEN")
    return bool(token and len(token.strip()) > 10)

def execute_on_ibm_quantum(
    circuit,
    shots: int = 1000,
    backend_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes circuit on real IBM Quantum hardware if credentials are provided.
    
    SCIENTIFIC HONESTY:
    Never fakes hardware results. If credentials or service are not present,
    returns explicit status explaining that real hardware execution requires an API token.
    """
    token = os.getenv("IBM_QUANTUM_TOKEN")
    if not token:
        return {
            "success": False,
            "error": "IBM Quantum API token not configured. Real hardware execution requires a valid IBM Quantum account token.",
            "backend": "IBM Quantum (Not Configured)"
        }
        
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
        
        service = QiskitRuntimeService(channel="ibm_quantum", token=token)
        target_backend = backend_name or os.getenv("IBM_QUANTUM_BACKEND", "ibm_brisbane")
        backend = service.backend(target_backend)
        
        sampler = SamplerV2(backend)
        job = sampler.run([circuit], shots=shots)
        result = job.result()
        
        return {
            "success": True,
            "backend": f"IBM Quantum ({target_backend})",
            "job_id": job.job_id(),
            "raw_result": result
        }
    except Exception as exc:
        return {
            "success": False,
            "error": f"IBM Quantum execution failed: {str(exc)}",
            "backend": "IBM Quantum (Error)"
        }
