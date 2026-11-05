/**
 * Entrance for the homepage note: the whole card slides up and fades in once,
 * as one unit. Transform and opacity only.
 *
 * These are the shipped values. In local dev and on preview/staging builds
 * they can be tuned with the Dialkit panel ("Mizen note entrance");
 * production always uses these.
 */

export const NOTE_ENTRANCE_CURVES = {
  custom: "cubic-bezier(0.16, 1, 0.3, 1)",
  gentler: "cubic-bezier(0.22, 1, 0.36, 1)",
  linear: "linear",
} as const;

export type NoteEntranceCurve = keyof typeof NOTE_ENTRANCE_CURVES;

export type NoteEntranceConfig = {
  /** Starting Y offset in px; the card ends at 0. */
  distance: number;
  /** Duration in ms. */
  duration: number;
  /** Delay in ms. */
  delay: number;
  /** Starting opacity; the card ends at 1. */
  initialOpacity: number;
  curve: NoteEntranceCurve;
};

export const NOTE_ENTRANCE_DEFAULTS: NoteEntranceConfig = {
  distance: 16,
  duration: 280,
  delay: 80,
  initialOpacity: 0,
  curve: "gentler",
};

/** Reduced motion: no movement, a short opacity-only reveal. */
export const NOTE_ENTRANCE_REDUCED_DURATION = 120;

export function isNoteEntranceCurve(value: unknown): value is NoteEntranceCurve {
  return typeof value === "string" && Object.hasOwn(NOTE_ENTRANCE_CURVES, value);
}

export type NoteEntrance = {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
};

export function buildNoteEntrance(
  config: NoteEntranceConfig,
  reducedMotion: boolean
): NoteEntrance {
  const easing = NOTE_ENTRANCE_CURVES[config.curve];
  const from = Math.min(1, Math.max(0, config.initialOpacity));

  if (reducedMotion) {
    return {
      keyframes: [{ opacity: from }, { opacity: 1 }],
      // fill "backwards" holds the first frame through any delay; once the
      // animation ends or is cancelled the card falls back to its normal,
      // fully visible styles.
      options: { duration: NOTE_ENTRANCE_REDUCED_DURATION, delay: 0, easing, fill: "backwards" },
    };
  }

  return {
    keyframes: [
      { opacity: from, transform: `translateY(${config.distance}px)` },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    options: {
      duration: Math.max(0, config.duration),
      delay: Math.max(0, config.delay),
      easing,
      fill: "backwards",
    },
  };
}
