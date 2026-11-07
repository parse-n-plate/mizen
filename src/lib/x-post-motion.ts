/**
 * Motion for the animated "Stickers" X post. Every value is a pure function of
 * time in seconds, so the live preview and the frame-by-frame MP4 export draw
 * exactly the same thing.
 *
 * Choreography: the recipe card rises in, the stickers pop in one after
 * another around it, then everything floats gently. Float periods divide the
 * video length so the clip loops without a seam once the entrance is over.
 */

export type StickerMotionConfig = {
  /** Card entrance */
  cardDuration: number; // seconds
  cardDistance: number; // px it rises
  /** Sticker entrance */
  stickerDelay: number; // seconds after the card starts
  stickerStagger: number; // seconds between stickers
  stickerDuration: number; // seconds
  stickerStartScale: number;
  /** Idle float */
  floatAmplitude: number; // px
  floatCycles: number; // float loops per video length
  wobble: number; // degrees
  /** Look */
  stickerScale: number;
  strokeWidth: number; // px
  /** Video */
  videoLength: number; // seconds
  fps: number;
  playEntrance: boolean;
};

export const STICKER_MOTION_DEFAULTS: StickerMotionConfig = {
  cardDuration: 0.9,
  cardDistance: 28,
  stickerDelay: 0.35,
  stickerStagger: 0.05,
  stickerDuration: 0.5,
  stickerStartScale: 0.9,
  floatAmplitude: 1.5,
  floatCycles: 2,
  wobble: 1.5,
  stickerScale: 1.15,
  strokeWidth: 6.5,
  videoLength: 6,
  fps: 60,
  playEntrance: false,
};

/** Strong ease-out for entrances: cubic-bezier(0.23, 1, 0.32, 1). */
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/** Solves a CSS cubic-bezier timing function for x in [0, 1]. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bez = (t: number, a: number, b: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const dBez = (t: number, a: number, b: number) =>
    3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t ** 2;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = bez(t, x1, x2) - x;
      const d = dBez(t, x1, x2);
      if (Math.abs(err) < 1e-5 || d === 0) break;
      t -= err / d;
    }
    t = Math.min(1, Math.max(0, t));
    return bez(t, y1, y2);
  };
}

function progress(time: number, start: number, duration: number) {
  if (duration <= 0) return time >= start ? 1 : 0;
  return EASE_OUT(Math.min(1, Math.max(0, (time - start) / duration)));
}

export type MotionFrame = { opacity: number; x: number; y: number; scale: number; rotate: number };

export function cardFrame(time: number, config: StickerMotionConfig): MotionFrame {
  const p = config.playEntrance ? progress(time, 0, config.cardDuration) : 1;
  return {
    opacity: p,
    x: 0,
    y: (1 - p) * config.cardDistance,
    scale: 0.97 + 0.03 * p,
    rotate: 0,
  };
}

export function stickerFrame(
  time: number,
  index: number,
  baseRotate: number,
  config: StickerMotionConfig
): MotionFrame {
  const start = config.stickerDelay + index * config.stickerStagger;
  const p = config.playEntrance ? progress(time, start, config.stickerDuration) : 1;

  // Each sticker floats on its own phase so they never bob in unison.
  const period = config.videoLength / Math.max(1, Math.round(config.floatCycles));
  const phase = index * 0.618;
  const angle = 2 * Math.PI * (time / period + phase);

  return {
    opacity: p,
    x: Math.cos(angle * 0.5) * config.floatAmplitude * 0.4,
    y: Math.sin(angle) * config.floatAmplitude + (1 - p) * 10,
    scale: config.stickerStartScale + (1 - config.stickerStartScale) * p,
    rotate: baseRotate + Math.sin(angle + 1.3) * config.wobble,
  };
}

export function frameTransform({ x, y, scale, rotate }: MotionFrame) {
  return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
}
