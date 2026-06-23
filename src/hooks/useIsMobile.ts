import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 640; // matches Tailwind `sm:`
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(callback: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};

  const mediaQuery = window.matchMedia(MOBILE_QUERY);

  mediaQuery.addEventListener("change", callback);

  return () => mediaQuery.removeEventListener("change", callback);
}

function getSnapshot() {
  if (typeof window.matchMedia !== "function") return false;

  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
