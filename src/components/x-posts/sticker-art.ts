/**
 * Bakes a brand icon into a die-cut sticker: the artwork on a white outline
 * that follows its alpha. Baked once per icon and stroke into a PNG data URL,
 * so each sticker is a single <img> (cheap to animate and to export per frame).
 */

const ART_HEIGHT = 320; // px the artwork is baked at
const OUTLINE_STEPS = 32;

const cache = new Map<string, string>();
const pending = new Set<string>();
const listeners = new Set<() => void>();

/** Outline padding baked around the artwork, in the artwork's own px. */
export function stickerArtPadding(strokeRatio: number, artworkHeight: number) {
  return ((Math.ceil(strokeRatio * ART_HEIGHT) + 1) * artworkHeight) / ART_HEIGHT;
}

export function stickerArtKey(src: string, strokeRatio: number) {
  return `${src}|${strokeRatio.toFixed(3)}`;
}

export function subscribeStickerArt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function peekStickerArt(key: string) {
  return cache.get(key);
}

/** Starts baking if needed. `strokeRatio` is stroke width ÷ artwork height. */
export function requestStickerArt(src: string, strokeRatio: number) {
  const key = stickerArtKey(src, strokeRatio);
  if (cache.has(key) || pending.has(key)) return;
  pending.add(key);
  bake(src, strokeRatio)
    .then((url) => {
      cache.set(key, url);
      listeners.forEach((listener) => listener());
    })
    .catch(() => {})
    .finally(() => pending.delete(key));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function bake(src: string, strokeRatio: number) {
  const img = await loadImage(src);
  const artHeight = ART_HEIGHT;
  const artWidth = Math.round((img.naturalWidth / img.naturalHeight) * artHeight);
  const stroke = strokeRatio * artHeight;
  const pad = Math.ceil(stroke) + 1; // keep in sync with stickerArtPadding

  const silhouette = document.createElement("canvas");
  silhouette.width = artWidth;
  silhouette.height = artHeight;
  const sctx = silhouette.getContext("2d")!;
  sctx.drawImage(img, 0, 0, artWidth, artHeight);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = "#fff";
  sctx.fillRect(0, 0, artWidth, artHeight);

  const canvas = document.createElement("canvas");
  canvas.width = artWidth + pad * 2;
  canvas.height = artHeight + pad * 2;
  const ctx = canvas.getContext("2d")!;
  if (stroke > 0) {
    for (let i = 0; i < OUTLINE_STEPS; i++) {
      const angle = (i / OUTLINE_STEPS) * 2 * Math.PI;
      ctx.drawImage(silhouette, pad + Math.cos(angle) * stroke, pad + Math.sin(angle) * stroke);
    }
    ctx.drawImage(silhouette, pad, pad);
  }
  ctx.drawImage(img, pad, pad, artWidth, artHeight);
  return canvas.toDataURL("image/png");
}
