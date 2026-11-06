"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Two thin fixed strips at the top and bottom of the screen, painted with
 * `--edge-top-background` / `--edge-bottom-background`. Mobile Safari samples
 * fixed elements near the screen edges to tint its status bar and toolbar.
 *
 * Portaled to <body> so no transformed ancestor can turn `position: fixed`
 * into something that scrolls with the page.
 */
export function SafariEdgeStrips() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  if (!mounted) return null;

  return createPortal(
    <>
      <div aria-hidden className="edge-top" />
      <div aria-hidden className="edge-bottom" />
    </>,
    document.body
  );
}
