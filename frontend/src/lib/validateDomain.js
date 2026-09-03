export function validateDomain(raw) {
  const input = raw.trim();
  if (!input) return { valid: false, message: "Domain cannot be empty.", normalized: "" };

  let value = input.toLowerCase();
  // strip protocol + path
  if (!value.includes("://")) value = "https://" + value;
  let hostname;
  try {
    const u = new URL(value);
    if (u.username || u.password) return { valid: false, message: "User info is not allowed in domain input.", normalized: "" };
    hostname = u.hostname;
    if (!hostname) return { valid: false, message: "Invalid domain structure.", normalized: "" };
  } catch {
    return { valid: false, message: "Invalid domain structure. Try format: example.com", normalized: "" };
  }

  // reject IP
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")) {
    return { valid: false, message: "Enter a domain, not an IP address.", normalized: "" };
  }

  const labels = hostname.split(".");
  if (labels.some((l) => l === "")) return { valid: false, message: "Domain contains empty label (consecutive dots).", normalized: "" };
  if (labels.length < 2) return { valid: false, message: "Domain must include a TLD (e.g. example.com).", normalized: "" };
  for (const label of labels) {
    if (label.length > 63) return { valid: false, message: `Label "${label}" is too long (max 63).`, normalized: "" };
    if (label.startsWith("-") || label.endsWith("-")) return { valid: false, message: `Label "${label}" cannot start or end with hyphen.`, normalized: "" };
    if (!/^[a-z0-9-]+$/.test(label)) return { valid: false, message: "Domain contains invalid characters (only a-z, 0-9, hyphen allowed).", normalized: "" };
  }
  if (hostname.length > 253) return { valid: false, message: "Domain is too long (max 253 chars).", normalized: "" };

  return { valid: true, message: "", normalized: hostname };
}
