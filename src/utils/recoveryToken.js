// Capture once before React and any providers mount. Keep only in module memory.
export function captureRecoveryToken(browser) {
  if (browser.location.pathname !== "/reset-password") return "";
  const fragment = new URLSearchParams(browser.location.hash.slice(1));
  const query = new URLSearchParams(browser.location.search);
  const token = fragment.get("token") || query.get("token") || "";
  browser.history.replaceState(browser.history.state, "", browser.location.pathname);
  return /^[a-f0-9]{64}$/.test(token) ? token : "";
}
let recoveryToken = typeof window === "undefined" ? "" : captureRecoveryToken(window);
export function getRecoveryToken() { return recoveryToken; }
export function clearRecoveryToken() { recoveryToken = ""; }
