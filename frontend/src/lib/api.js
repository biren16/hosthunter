const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function scanDomain(domain) {
  if (import.meta.env.DEV) performance.mark("hosthunter:T1-request-sent");
  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  const data = await res.json().catch(() => ({}));
  if (import.meta.env.DEV) performance.mark("hosthunter:T2-response-received");
  if (!res.ok) {
    const msg = data?.detail?.[0]?.msg || data?.detail || data?.message || `Scan failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}
