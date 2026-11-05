/* @vitest-environment jsdom */

import React, { act, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNoteEntrance } from "@/hooks/useNoteEntrance";
import { NOTE_ENTRANCE_DEFAULTS } from "@/lib/sunset-note-motion";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type FakeAnimation = {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  state: "running" | "paused" | "cancelled";
  pause: () => void;
  cancel: () => void;
  addEventListener: () => void;
};

let animations: FakeAnimation[];
let observerCallback: IntersectionObserverCallback | null;
let noteTop: number;
let reduceMotion: boolean;
let replayNote: () => void;

function Note() {
  const ref = useRef<HTMLDivElement>(null);
  const { replay } = useNoteEntrance(ref, () => NOTE_ENTRANCE_DEFAULTS);
  useEffect(() => {
    replayNote = replay;
  }, [replay]);
  return (
    <div ref={ref} data-testid="note">
      <p>Until then, keep cooking</p>
      <input aria-label="email" />
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;

function render() {
  act(() => root.render(<Note />));
}

function intersect(isIntersecting: boolean, bottom = 100) {
  act(() =>
    observerCallback?.(
      [{ isIntersecting, boundingClientRect: { bottom } } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  );
}

beforeEach(() => {
  animations = [];
  observerCallback = null;
  noteTop = 2000;
  reduceMotion = false;

  HTMLElement.prototype.animate = vi.fn(function (
    this: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ) {
    const animation: FakeAnimation = {
      keyframes,
      options,
      state: "running",
      pause: () => (animation.state = "paused"),
      cancel: () => (animation.state = "cancelled"),
      addEventListener: () => {},
    };
    animations.push(animation);
    return animation as unknown as Animation;
  }) as unknown as HTMLElement["animate"];
  HTMLElement.prototype.getBoundingClientRect = function () {
    return { top: noteTop, bottom: noteTop + 500 } as DOMRect;
  };
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        observerCallback = cb;
      }
      observe() {}
      disconnect() {}
    }
  );
  window.matchMedia = vi.fn(() => ({ matches: reduceMotion }) as MediaQueryList);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("useNoteEntrance", () => {
  it("does nothing when the note is already on screen at hydration", () => {
    noteTop = 100;
    render();
    expect(animations).toHaveLength(0);
  });

  it("leaves the note visible when the motion preference can't be read", () => {
    // @ts-expect-error simulate a browser without matchMedia
    window.matchMedia = undefined;
    render();
    expect(animations).toHaveLength(0);
  });

  it("holds the first frame below the fold, then plays once on reveal", () => {
    render();
    expect(animations).toHaveLength(1);
    expect(animations[0].state).toBe("paused");

    intersect(true);
    expect(animations[0].state).toBe("cancelled");
    expect(animations).toHaveLength(2);
    expect(animations[1].state).toBe("running");
    expect(animations[1].keyframes[0]).toEqual({ opacity: 0, transform: "translateY(16px)" });
  });

  it("just shows the note if the user jumps past it", () => {
    render();
    intersect(false, -50);
    expect(animations).toHaveLength(1);
    expect(animations[0].state).toBe("cancelled");
  });

  it("uses an opacity-only reveal for reduced motion", () => {
    reduceMotion = true;
    render();
    intersect(true);
    expect(animations[1].keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });

  it("replay cancels the running entrance and restarts without remounting or moving focus", () => {
    noteTop = 100;
    render();
    const input = container.querySelector("input")!;
    const paragraph = container.querySelector("p")!;
    act(() => {
      input.focus();
      input.value = "cook@example.com";
    });

    act(() => replayNote());
    act(() => replayNote());
    act(() => replayNote());

    expect(animations).toHaveLength(3);
    expect(animations.slice(0, 2).every((a) => a.state === "cancelled")).toBe(true);
    expect(animations[2].state).toBe("running");
    expect(container.querySelector("input")).toBe(input);
    expect(container.querySelector("p")).toBe(paragraph);
    expect(input.value).toBe("cook@example.com");
    expect(document.activeElement).toBe(input);
  });

  it("cancels any entrance on unmount", () => {
    render();
    act(() => root.unmount());
    expect(animations[0].state).toBe("cancelled");
    root = createRoot(container);
  });
});
