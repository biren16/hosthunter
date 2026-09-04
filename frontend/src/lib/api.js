const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const SCAN_TIMEOUT_MS = 30_000;

export async function scanDomain(domain) {
  if (import.meta.env.DEV) performance.mark("hosthunter:T1-request-sent");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (import.meta.env.DEV) performance.mark("hosthunter:T2-response-received");
    if (!res.ok) {
      const msg = data?.detail?.[0]?.msg || data?.detail || data?.message || `Scan failed (${res.status})`;
      const requestError = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      requestError.status = res.status;
      throw requestError;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("The scan timed out. Please try again.");
      timeoutError.code = "SCAN_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
