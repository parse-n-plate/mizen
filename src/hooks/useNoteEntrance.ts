"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { buildNoteEntrance, type NoteEntranceConfig } from "@/lib/sunset-note-motion";

/** null when the preference can't be read; callers then leave the note as-is. */
function readReducedMotion(): boolean | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Plays the note's entrance once, when it first scrolls into view.
 *
 * Progressive enhancement: the server-rendered note is always fully visible.
 * The entrance is only armed if, after hydration, the note is still entirely
 * below the viewport (so nothing already on screen is hidden). If the note is
 * already visible, or the browser lacks what we need, there is no entrance.
 *
 * Everything runs through the Web Animations API on the one wrapper element:
 * cancelling an animation returns the note to its normal visible styles, and
 * replaying never touches the note's content, focus, or DOM structure.
 */
export function useNoteEntrance(
  ref: RefObject<HTMLElement | null>,
  getConfig: () => NoteEntranceConfig
) {
  const animationRef = useRef<Animation | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const getConfigRef = useRef(getConfig);
  useEffect(() => {
    getConfigRef.current = getConfig;
  });

  const create = useCallback((): Animation | null => {
    const el = ref.current;
    const reduced = readReducedMotion();
    if (!el || typeof el.animate !== "function" || reduced === null) return null;
    // Cancel rather than queue: only the latest entrance may run.
    animationRef.current?.cancel();
    const { keyframes, options } = buildNoteEntrance(getConfigRef.current(), reduced);
    const animation = el.animate(keyframes, options);
    animationRef.current = animation;
    animation.addEventListener("finish", () => {
      if (animationRef.current === animation) animationRef.current = null;
    });
    return animation;
  }, [ref]);

  const stopObserving = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  /** Restart the entrance from the beginning (used by the dev replay control). */
  const replay = useCallback(() => {
    stopObserving();
    create();
  }, [create, stopObserving]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // Only arm while the note is completely below the fold, so the user
    // never sees text disappear to set up the animation.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    const hold = create();
    if (!hold) return;
    hold.pause(); // holds the first frame until the note comes into view

    const reveal = () => {
      stopObserving();
      window.removeEventListener("beforeprint", reveal);
      if (animationRef.current === hold) {
        hold.cancel();
        animationRef.current = null;
      }
    };

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      if (entry.isIntersecting) {
        stopObserving();
        window.removeEventListener("beforeprint", reveal);
        if (animationRef.current === hold) create();
      } else if (entry.boundingClientRect.bottom <= 0) {
        // Jumped past it (e.g. End key): just show it, no entrance.
        reveal();
      }
    });
    observerRef.current = observer;
    observer.observe(el);
    window.addEventListener("beforeprint", reveal);

    return () => {
      reveal();
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [ref, create, stopObserving]);

  return { replay };
}
