function countRecords(records = {}) {
  return ["A", "AAAA", "MX", "NS", "TXT"].reduce(
    (count, key) => count + (Array.isArray(records[key]) ? records[key].length : 0),
    0,
  );
}

export function buildOverviewInsights(data = {}) {
  const dns = data.dns || {};
  const ip = data.ip || {};
  const ssl = data.ssl || {};
  const cdn = data.cdn || {};
  const email = data.email_security || data.emailSecurity || {};
  const errors = data.errors || {};
  const ipCount = ip.ips?.length || (ip.address ? 1 : 0);
  const records = countRecords(dns);
  const insights = [];

  if (data.domainexists === true) {
    insights.push({ title: "Domain is reachable", detail: `DNS returned ${records} record${records === 1 ? "" : "s"}, including ${ipCount} resolved IP${ipCount === 1 ? "" : "s"}.`, focus: "dns" });
  } else if (data.domainexists === false) {
    insights.push({ title: "Domain was not found", detail: "The scan could not confirm an active domain through DNS." });
  } else {
    insights.push({ title: "Domain status is unknown", detail: "The scan could not confirm domain existence from the available response." });
  }

  if (typeof ssl.days_until_expiry === "number") {
    insights.push({
      title: "TLS certificate observed",
      detail: ssl.is_expired ? "The certificate is expired." : `The certificate has ${ssl.days_until_expiry} days until expiry.`,
      focus: "tls",
    });
  } else {
    insights.push({ title: "TLS details unavailable", detail: "No certificate expiry value was returned for this scan.", focus: "tls" });
  }

  if (cdn.detected === true) {
    insights.push({ title: "Traffic appears CDN-fronted", detail: `${cdn.provider || "A CDN provider"} was identified in the returned infrastructure signals.`, focus: "cdn" });
  } else if (cdn.detected === false) {
    insights.push({ title: "No supported CDN match", detail: "The returned IP and header signals did not match a supported CDN provider.", focus: "cdn" });
  } else {
    insights.push({ title: "CDN status is unknown", detail: "The scan did not return enough information to confirm CDN use.", focus: "cdn" });
  }

  const dmarc = email.dmarc || {};
  if (dmarc.enabled === false) {
    insights.push({ title: "Email policy not detected", detail: "No DMARC policy was returned. SPF and DKIM details are available in Email Security.", focus: "email" });
  } else if (dmarc.enabled === true) {
    insights.push({ title: "Email policy published", detail: "A DMARC policy was returned. Review SPF and DKIM alongside it for the full picture.", focus: "email" });
  } else {
    insights.push({ title: "Email posture is incomplete", detail: "DMARC could not be confirmed from this response; Unknown does not mean insecure.", focus: "email" });
  }

  if (Object.keys(errors).length > 0) {
    insights[insights.length - 1] = {
      title: "Investigation is partial",
      detail: `${Object.keys(errors).length} module${Object.keys(errors).length === 1 ? "" : "s"} did not return fully. Available evidence remains visible below.`,
    };
  }

  return insights.slice(0, 4);
}

export function formatScanError(error) {
  if (error?.code === "SCAN_TIMEOUT") {
    return {
      title: "The investigation timed out",
      detail: "The scan did not return a complete response within the available time.",
    };
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return {
      title: "The scan service is unavailable",
      detail: "HostHunter could not connect to the scan service. No results were received.",
    };
  }

  if (error?.status >= 500) {
    return {
      title: "The scan service returned an error",
      detail: "The service could not complete this investigation. No results were received.",
    };
  }

  if (error?.status >= 400) {
    return {
      title: "The investigation request was rejected",
      detail: error.message || "The scan service rejected this request.",
    };
  }

  return {
    title: "The investigation failed",
    detail: "The scan service returned an unexpected response. No results were received.",
  };
}
