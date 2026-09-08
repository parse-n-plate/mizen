"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hashRecipeIdentity } from "@/lib/prep-notes";

type Completion = Record<string, boolean>;

export function usePrepCompletion(identity: string, userId?: string) {
  const [completion, setCompletion] = useState<Completion>({});
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recipeKey = useRef("");
  const busy = useRef(false);
  const revision = useRef(0);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    const current = ++revision.current;
    try {
      const key = await hashRecipeIdentity(identity);
      recipeKey.current = key;
      let next: Completion = {};
      if (userId) {
        const response = await fetch(`/api/prep-notes?recipeKey=${key}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load prep progress. Retry to continue.");
        next = await response.json();
      } else {
        const stored = localStorage.getItem(`mizen-prep-v1:guest:${key}`);
        if (stored) {
          try {
            next = JSON.parse(stored);
          } catch {
            /* discard invalid local state */
          }
        }
      }
      if (!mounted.current || current !== revision.current) return;
      if (!next || typeof next !== "object" || Array.isArray(next)) next = {};
      setCompletion(
        Object.fromEntries(Object.entries(next).filter(([, value]) => typeof value === "boolean"))
      );
      setReady(true);
      setError(null);
    } catch (err) {
      if (mounted.current && current === revision.current) {
        setError(err instanceof Error ? err.message : "Could not load prep progress.");
      }
    }
  }, [identity, userId]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted.current = false;
      // Invalidate asynchronous requests on unmount, rather than capturing a prior revision.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      revision.current++;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  async function toggle(noteKey: string, completed: boolean) {
    if (!ready || busy.current) return;
    busy.current = true;
    revision.current++;
    setSaving(true);
    setError(null);
    const previous = completion;
    const next = { ...completion, [noteKey]: completed };
    setCompletion(next);
    try {
      if (userId) {
        const response = await fetch("/api/prep-notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeKey: recipeKey.current, noteKey, completed }),
        });
        if (!response.ok) throw new Error("Could not save progress. Please try again.");
      } else {
        localStorage.setItem(`mizen-prep-v1:guest:${recipeKey.current}`, JSON.stringify(next));
      }
    } catch {
      if (mounted.current) {
        setCompletion(previous);
        setError("Could not save progress. Please try again.");
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return { completion, ready, saving, error, toggle, refresh };
}
