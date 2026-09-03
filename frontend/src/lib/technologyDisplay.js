const DEFAULT_SOURCE = "headers / markup";

export function formatTechnologySignal(item) {
  if (typeof item === "string" && item.trim()) {
    return { value: item.trim(), version: null, source: DEFAULT_SOURCE };
  }

  if (item && typeof item === "object") {
    const detectedValue = typeof item.detected === "string" && item.detected.trim() ? item.detected.trim() : null;
    const value = item.name || item.framework || item.value || detectedValue;
    const state = item.detected === true ? "Detected" : item.detected === false ? "Not detected" : "Unknown";
    return {
      value: typeof value === "string" && value.trim() ? value.trim() : state,
      version: item.version || null,
      source: item.source || item.detected_from || item.origin || DEFAULT_SOURCE,
    };
  }

  return { value: "Unknown", version: null, source: "technology signal" };
}
