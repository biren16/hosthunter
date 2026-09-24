export function filterSubdomainNames(names = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return names;
  return names.filter((item) => String(item?.hostname || "").toLowerCase().includes(normalizedQuery));
}

export function getSubdomainStatusLabel(data = {}) {
  const status = data.status === "complete"
    ? "Complete"
    : data.status === "partial"
      ? "Partial"
      : data.status === "unavailable"
        ? "Unavailable"
        : "Unknown";

  return data.truncated && status === "Partial" ? "Partial · truncated" : status;
}

export function formatSubdomainDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
