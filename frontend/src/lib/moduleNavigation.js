export const MODULE_ORDER = ["overview", "dns", "whois", "tls", "ip", "website", "technology", "cdn", "email"];

export function getModuleDirection(previousId, nextId) {
  const previousIndex = MODULE_ORDER.indexOf(previousId);
  const nextIndex = MODULE_ORDER.indexOf(nextId);
  if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) return "same";
  return nextIndex > previousIndex ? "forward" : "backward";
}
