import { useRef } from "react";

/** Prevents rapid re-submission by enforcing a minimum interval between calls. */
export function useSubmitGuard(intervalMs = 2000) {
  const lastRef = useRef(0);

  /** Returns `true` if the action should proceed, `false` if throttled. */
  const allow = () => {
    const now = Date.now();
    if (now - lastRef.current < intervalMs) return false;
    lastRef.current = now;
    return true;
  };

  return allow;
}
