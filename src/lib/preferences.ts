export function getRoundAmounts(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("round-amounts") === "true";
}

export function setRoundAmounts(enabled: boolean) {
  if (enabled) {
    localStorage.setItem("round-amounts", "true");
  } else {
    localStorage.removeItem("round-amounts");
  }
  window.dispatchEvent(new Event("round-amounts-changed"));
}
