"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hashRecipeIdentity } from "@/lib/prep-notes";

type Completion = Record<string, boolean>;

export function usePrepCompletion(identity: string, userId?: string, legacyIdentity?: string) {
  const [completion, setCompletion] = useState<Completion>({});
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recipeKey = useRef("");
  const savingRef = useRef(false);
  const refreshPending = useRef(false);
  const latestRefresh = useRef<() => Promise<void>>(async () => {});
  const revision = useRef(0);
  const mounted = useRef(true);

  const readGuestCompletion = (key: string): Completion => {
    const stored = localStorage.getItem(`mizen-prep-v1:guest:${key}`);
    if (!stored) return {};
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => typeof value === "boolean")
      ) as Completion;
    } catch {
      return {};
    }
  };

  const refresh = useCallback(async () => {
    if (savingRef.current) {
      refreshPending.current = true;
      return;
    }
    const current = ++revision.current;
    setError(null);
    try {
      const key = await hashRecipeIdentity(identity);
      const legacyKey =
        legacyIdentity && legacyIdentity !== identity
          ? await hashRecipeIdentity(legacyIdentity)
          : key;
      recipeKey.current = key;
      const readCompletion = async (readKey: string): Promise<Completion> => {
        if (!userId) return readGuestCompletion(readKey);
        const response = await fetch(`/api/prep-notes?recipeKey=${encodeURIComponent(readKey)}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const parsed: unknown = await response.json();
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
          return Object.fromEntries(
            Object.entries(parsed).filter(([, value]) => typeof value === "boolean")
          );
        } else if (response.status === 401) {
          // Session can lag behind client auth; keep progress usable via guest storage.
          return readGuestCompletion(readKey);
        } else {
          throw new Error("Could not load prep progress. Retry to continue.");
        }
      };
      const [previous, currentCompletion] = await Promise.all([
        legacyKey !== key ? readCompletion(legacyKey) : Promise.resolve({}),
        readCompletion(key),
      ]);
      // Explicit false values under the stable key override previously completed tasks.
      const next = { ...previous, ...currentCompletion };
      if (!mounted.current || current !== revision.current) return;
      setCompletion(next);
      setReady(true);
      setError(null);
    } catch (err) {
      if (mounted.current && current === revision.current) {
        setError(err instanceof Error ? err.message : "Could not load prep progress.");
      }
    }
  }, [identity, legacyIdentity, userId]);

  useEffect(() => {
    mounted.current = true;
    latestRefresh.current = refresh;
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
    if (!ready || savingRef.current) return;
    savingRef.current = true;
    revision.current++;
    setSaving(true);
    setError(null);
    const previous = completion;
    const next = { ...completion, [noteKey]: completed };
    setCompletion(next);
    let saved = false;
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
      saved = true;
    } catch {
      if (mounted.current) {
        setCompletion(previous);
        setError("Could not save progress. Please try again.");
      }
    } finally {
      savingRef.current = false;
      if (mounted.current) {
        setSaving(false);
        if (refreshPending.current) {
          refreshPending.current = false;
          // Keep the save error visible if the write failed.
          if (saved) void latestRefresh.current();
        }
      }
    }
  }

  return { completion, ready, saving, error, toggle, refresh };
}
