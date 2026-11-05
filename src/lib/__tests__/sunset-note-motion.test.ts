import { describe, expect, it } from "vitest";
import {
  NOTE_ENTRANCE_DEFAULTS,
  NOTE_ENTRANCE_REDUCED_DURATION,
  buildNoteEntrance,
  isNoteEntranceCurve,
} from "@/lib/sunset-note-motion";

describe("note entrance", () => {
  it("ships the tuned defaults (16px, 280ms, 80ms delay, from opacity 0, gentler curve)", () => {
    expect(NOTE_ENTRANCE_DEFAULTS).toEqual({
      distance: 16,
      duration: 280,
      delay: 80,
      initialOpacity: 0,
      curve: "gentler",
    });
    const { keyframes, options } = buildNoteEntrance(NOTE_ENTRANCE_DEFAULTS, false);
    expect(keyframes).toEqual([
      { opacity: 0, transform: "translateY(16px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ]);
    expect(options).toMatchObject({
      duration: 280,
      delay: 80,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "backwards",
    });
  });

  it("only animates transform and opacity", () => {
    for (const reduced of [false, true]) {
      for (const frame of buildNoteEntrance(NOTE_ENTRANCE_DEFAULTS, reduced).keyframes) {
        expect(Object.keys(frame).every((k) => k === "opacity" || k === "transform")).toBe(true);
      }
    }
  });

  it("drops movement for reduced motion and uses a short opacity reveal", () => {
    const { keyframes, options } = buildNoteEntrance(
      { ...NOTE_ENTRANCE_DEFAULTS, delay: 200 },
      true
    );
    expect(keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(options.duration).toBe(NOTE_ENTRANCE_REDUCED_DURATION);
    expect(options.delay).toBe(0);
  });

  it("maps the comparison curves", () => {
    expect(
      buildNoteEntrance({ ...NOTE_ENTRANCE_DEFAULTS, curve: "gentler" }, false).options.easing
    ).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(
      buildNoteEntrance({ ...NOTE_ENTRANCE_DEFAULTS, curve: "linear" }, false).options.easing
    ).toBe("linear");
    expect(isNoteEntranceCurve("spring")).toBe(false);
  });
});
