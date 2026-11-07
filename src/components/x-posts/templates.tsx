"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import CloseIcon from "@solar-icons/react/csr/ui/CloseCircle";
import type { ParsedRecipe } from "@/lib/types";
import { IngredientList } from "@/components/IngredientList";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { SUNSET_PALETTE, sunsetPaletteStyle } from "@/lib/sunset-edge-colors";
import { cn } from "@/lib/utils";
import { BRAND_ICONS_BY_ID, type BrandIconId } from "@/lib/brand-icons";
import {
  cardFrame,
  frameTransform,
  stickerFrame,
  type StickerMotionConfig,
} from "@/lib/x-post-motion";
import {
  peekStickerArt,
  requestStickerArt,
  stickerArtKey,
  stickerArtPadding,
  subscribeStickerArt,
} from "./sticker-art";

/**
 * Social image templates for X posts. Each template renders at a logical size
 * (see X_POST_SIZES) and is exported at 2x, so text and UI read at the same
 * scale as they do in the app.
 */

export type XPostSizeId = "landscape" | "square";

export const X_POST_SIZES: Record<
  XPostSizeId,
  { label: string; shortLabel: string; width: number; height: number; exportScale: number }
> = {
  landscape: {
    label: "16:9 (1600 × 900)",
    shortLabel: "16:9",
    width: 800,
    height: 450,
    exportScale: 2,
  },
  square: {
    label: "1:1 (1200 × 1200)",
    shortLabel: "1:1",
    width: 600,
    height: 600,
    exportScale: 2,
  },
};

export type StageBackgroundId = "sky" | "sunset" | "cream" | "night";

export const STAGE_BACKGROUNDS: Record<StageBackgroundId, { label: string; css: string }> = {
  sky: {
    label: "Sky",
    css: `linear-gradient(to bottom, ${SUNSET_PALETTE.light.skyEnd}, ${SUNSET_PALETTE.light.skyMid})`,
  },
  sunset: {
    label: "Sunset",
    css: `linear-gradient(to bottom, ${SUNSET_PALETTE.light.base}, ${SUNSET_PALETTE.light.skyMid} 45%, ${SUNSET_PALETTE.light.skyEnd})`,
  },
  cream: { label: "Cream", css: "var(--color-background-cream)" },
  night: { label: "Night", css: "linear-gradient(to bottom, #1c1917, #0c0a09)" },
};

/** A lighter take on the landing page sky, for behind the sunset copy. */
const SUBTLE_SKY = `linear-gradient(to bottom, transparent, ${SUNSET_PALETTE.light.skyMid}66 55%, ${SUNSET_PALETTE.light.skyMid}b3)`;

/** Fades a mockup's contents out toward its bottom edge. */
const FADE_BOTTOM =
  "[mask-image:linear-gradient(to_bottom,black_62%,transparent_96%)] [-webkit-mask-image:linear-gradient(to_bottom,black_62%,transparent_96%)]";

function Frame({
  width,
  height,
  background,
  className,
  style,
  children,
}: {
  width: number;
  height: number;
  background?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      data-x-post-frame
      className={cn("relative overflow-hidden", className)}
      style={{ width, height, background, ...style }}
    >
      {children}
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 font-serif text-lg font-semibold text-stone-900 dark:text-stone-50",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apple-touch-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
      Mizen
    </div>
  );
}

function BrowserCard({
  recipe,
  className,
  contentClassName,
}: {
  recipe: ParsedRecipe;
  className?: string;
  /** Extra padding around the page, e.g. to clear an overlapping phone. */
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-950",
        className
      )}
    >
      <div
        aria-hidden
        className="flex h-[41px] shrink-0 items-center gap-1.5 bg-white px-5 dark:bg-stone-900"
      >
        <div className="size-3 rounded-full bg-[#DDDDDD] dark:bg-stone-700" />
        <div className="size-3 rounded-full bg-[#DDDDDD] dark:bg-stone-700" />
        <div className="size-3 rounded-full bg-[#DDDDDD] dark:bg-stone-700" />
      </div>
      <div className={cn("min-h-0 flex-1", FADE_BOTTOM, contentClassName)}>
        <WaitlistRecipePreview
          recipe={recipe}
          sourceType="url"
          showSourceAttachment={false}
          disableScroll
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Sunset: the landing page hero, reframed for an X image
───────────────────────────────────────────────────────────────────────────── */

export type SunsetTemplateProps = {
  size: XPostSizeId;
  recipe: ParsedRecipe;
  headlineTop: string;
  headlineBottom: string;
  subhead: string;
  showFooter: boolean;
  showBrand: boolean;
  showSky: boolean;
};

function SunsetHeadline({ top, bottom }: { top: string; bottom: string }) {
  return (
    <>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span>{top}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/hero-book.svg" alt="" className="h-[1.05em] w-auto shrink-0" />
      </span>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span>{bottom}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/hero-pot.svg" alt="" className="h-[1.2em] w-auto shrink-0" />
      </span>
    </>
  );
}

function SunsetFooter() {
  return (
    <div className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-[#226097] dark:text-[rgb(255_255_255/0.5)]">
      Cooked with love by
      <div className="flex -space-x-1.5">
        {["/assets/avatars/Gage_Avatar.jpg", "/assets/avatars/Michelle_Avatar_2026.jpg"].map(
          (src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="h-6 w-6 rounded-full border-[2.5px] border-[#8fcdfa] object-cover dark:border-stone-950"
            />
          )
        )}
      </div>
    </div>
  );
}

export function SunsetTemplate({
  size,
  recipe,
  headlineTop,
  headlineBottom,
  subhead,
  showFooter,
  showBrand,
  showSky,
}: SunsetTemplateProps) {
  const { width, height } = X_POST_SIZES[size];
  const isSquare = size === "square";

  return (
    <Frame
      width={width}
      height={height}
      style={sunsetPaletteStyle}
      className="bg-[var(--sunset-base-light)] dark:bg-[var(--sunset-base-dark)]"
    >
      {showSky && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 dark:hidden"
          style={{ height: isSquare ? "54%" : "40%", background: SUBTLE_SKY }}
        />
      )}

      {showBrand && <BrandMark className="absolute left-8 top-6 z-10" />}

      {isSquare ? (
        <>
          <div className="absolute inset-x-10 top-[92px] z-10">
            <h1 className="flex flex-col items-start gap-0.5 font-serif text-[46px] font-bold leading-[1.2] tracking-[-0.02em] text-stone-900 dark:text-stone-100">
              <SunsetHeadline top={headlineTop} bottom={headlineBottom} />
            </h1>
            <p className="mt-3 max-w-[30rem] text-balance font-sans text-base leading-relaxed text-stone-500 dark:text-stone-400">
              {subhead}
            </p>
          </div>
          <div className="absolute left-14 right-[-40px] top-[318px] rotate-[1.5deg]">
            <BrowserCard recipe={recipe} className="h-[420px]" />
          </div>
        </>
      ) : (
        <>
          <div className="absolute left-10 top-1/2 z-10 w-[330px] -translate-y-[56%]">
            <h1 className="flex flex-col items-start gap-1 font-serif text-[44px] font-bold leading-[1.22] tracking-[-0.02em] text-stone-900 dark:text-stone-100">
              <SunsetHeadline top={headlineTop} bottom={headlineBottom} />
            </h1>
            <p className="mt-4 text-balance font-sans text-[15px] leading-relaxed text-stone-500 dark:text-stone-400">
              {subhead}
            </p>
          </div>
          <div className="absolute left-[400px] top-[58px] w-[440px] rotate-[1.5deg]">
            <BrowserCard recipe={recipe} className="h-[440px]" />
          </div>
        </>
      )}

      {showFooter && (
        <div className={cn("absolute z-10", isSquare ? "right-8 top-[26px]" : "bottom-5 left-10")}>
          <SunsetFooter />
        </div>
      )}
    </Frame>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stageshow: the recipe page on mobile and desktop, staged and cropped
───────────────────────────────────────────────────────────────────────────── */

export type StageshowTemplateProps = {
  size: XPostSizeId;
  recipe: ParsedRecipe;
  background: StageBackgroundId;
  showBrand: boolean;
};

function PhoneCard({ recipe, className }: { recipe: ParsedRecipe; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] border border-stone-200/80 bg-white shadow-[0_12px_40px_rgb(12_74_120/0.18)] dark:border-stone-700 dark:bg-stone-900",
        className
      )}
    >
      <div aria-hidden className="flex h-11 items-center justify-between px-6 pt-1">
        <span className="font-sans text-[13px] font-semibold text-stone-900 dark:text-stone-100">
          9:41
        </span>
        <span className="h-[22px] w-[76px] rounded-full bg-stone-900 dark:bg-black" />
        <span className="flex items-center gap-1">
          <span className="flex h-3 w-[22px] items-center rounded-[4px] border border-stone-400 p-[1.5px] dark:border-stone-500">
            <span className="h-full w-3/4 rounded-[2px] bg-stone-900 dark:bg-stone-100" />
          </span>
        </span>
      </div>
      <div className={cn("px-6 pt-4", FADE_BOTTOM)}>
        <IngredientList groups={recipe.ingredients} />
      </div>
    </div>
  );
}

export function StageshowTemplate({ size, recipe, background, showBrand }: StageshowTemplateProps) {
  const { width, height } = X_POST_SIZES[size];
  const isSquare = size === "square";

  return (
    <Frame width={width} height={height} background={STAGE_BACKGROUNDS[background].css}>
      {showBrand && <BrandMark className="absolute left-7 top-6 z-20" />}

      {isSquare ? (
        <>
          <BrowserCard
            recipe={recipe}
            className="absolute left-[266px] top-[56px] h-[620px] w-[580px]"
            contentClassName="pl-7"
          />
          <PhoneCard
            recipe={recipe}
            className="absolute left-[28px] top-[120px] z-10 h-[560px] w-[264px]"
          />
        </>
      ) : (
        <>
          <BrowserCard
            recipe={recipe}
            className="absolute left-[306px] top-[48px] h-[480px] w-[600px]"
            contentClassName="pl-7"
          />
          <PhoneCard
            recipe={recipe}
            className="absolute left-[52px] top-[96px] z-10 h-[420px] w-[280px]"
          />
        </>
      )}
    </Frame>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stickers: the recipe page centered, brand icons floating around it like
   die-cut stickers. Animated; `time` drives every frame.
───────────────────────────────────────────────────────────────────────────── */

type StickerPlacement = {
  icon: BrandIconId;
  /** Center point in px within the frame */
  x: number;
  y: number;
  /** Artwork height in px */
  size: number;
  rotate: number;
};

const STICKER_LAYOUTS: Record<
  XPostSizeId,
  {
    card: { left: number; top: number; width: number; height: number };
    stickers: StickerPlacement[];
  }
> = {
  landscape: {
    card: { left: 150, top: 64, width: 500, height: 420 },
    stickers: [
      { icon: "book", x: 82, y: 108, size: 56, rotate: -10 },
      { icon: "pot", x: 718, y: 110, size: 62, rotate: 6 },
      { icon: "knife", x: 84, y: 340, size: 60, rotate: 14 },
      { icon: "skillet-eggs", x: 712, y: 350, size: 60, rotate: -8 },
      { icon: "fish", x: 212, y: 40, size: 40, rotate: -8 },
      { icon: "tomato", x: 592, y: 38, size: 42, rotate: 8 },
      { icon: "whisk", x: 50, y: 226, size: 50, rotate: -18 },
      { icon: "rolling-pin", x: 752, y: 232, size: 50, rotate: 18 },
      { icon: "egg", x: 150, y: 418, size: 44, rotate: -8 },
      { icon: "egg-timer", x: 652, y: 416, size: 46, rotate: 10 },
    ],
  },
  square: {
    card: { left: 80, top: 116, width: 440, height: 520 },
    stickers: [
      { icon: "book", x: 88, y: 84, size: 56, rotate: -10 },
      { icon: "pot", x: 520, y: 90, size: 62, rotate: 6 },
      { icon: "knife", x: 56, y: 392, size: 58, rotate: 14 },
      { icon: "skillet-eggs", x: 546, y: 400, size: 60, rotate: -8 },
      { icon: "fish", x: 220, y: 50, size: 42, rotate: -8 },
      { icon: "tomato", x: 386, y: 50, size: 46, rotate: 8 },
      { icon: "whisk", x: 46, y: 236, size: 50, rotate: -18 },
      { icon: "rolling-pin", x: 556, y: 240, size: 50, rotate: 18 },
      { icon: "egg", x: 110, y: 548, size: 48, rotate: -8 },
      { icon: "egg-timer", x: 492, y: 550, size: 48, rotate: 10 },
    ],
  },
};

/** Per-sticker changes made by dragging or removing in the preview. */
export type StickerEdit = { x?: number; y?: number; removed?: boolean };
export type StickerEdits = Partial<Record<BrandIconId, StickerEdit>>;

function Sticker({
  placement,
  index,
  time,
  motion,
  onEdit,
}: {
  placement: StickerPlacement;
  index: number;
  time: number;
  motion: StickerMotionConfig;
  /** Present only in the interactive preview, never during export. */
  onEdit?: (edit: StickerEdit) => void;
}) {
  const icon = BRAND_ICONS_BY_ID[placement.icon];
  const frame = stickerFrame(time, index, placement.rotate, motion);
  const height = placement.size * motion.stickerScale;
  const width = height * icon.aspect;
  const stroke = Math.max(0, motion.strokeWidth);
  const strokeRatio = stroke / height;
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    scale: number;
    frameWidth: number;
    frameHeight: number;
  } | null>(null);

  const key = stickerArtKey(icon.src, strokeRatio);
  const art = useSyncExternalStore(
    subscribeStickerArt,
    () => peekStickerArt(key),
    () => undefined
  );
  useEffect(() => {
    requestStickerArt(icon.src, strokeRatio);
  }, [icon.src, strokeRatio]);

  // The baked art carries its outline as padding around the artwork.
  const pad = art ? stickerArtPadding(strokeRatio, height) : 0;
  const interactive = !!onEdit;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!onEdit || event.button !== 0) return;
    const frameEl = event.currentTarget.closest<HTMLElement>("[data-x-post-frame]");
    if (!frameEl) return;
    // The preview is scaled down to fit, so convert screen px to frame px.
    const scale = frameEl.getBoundingClientRect().width / frameEl.offsetWidth || 1;
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: placement.x,
      y: placement.y,
      scale,
      frameWidth: frameEl.offsetWidth,
      frameHeight: frameEl.offsetHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!start || !onEdit) return;
    const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));
    onEdit({
      x: clamp(start.x + (event.clientX - start.pointerX) / start.scale, start.frameWidth),
      y: clamp(start.y + (event.clientY - start.pointerY) / start.scale, start.frameHeight),
    });
  }

  function endDrag() {
    dragStart.current = null;
    setDragging(false);
  }

  return (
    <div
      aria-hidden={!interactive}
      className={cn(
        "group/sticker absolute touch-none select-none",
        interactive && (dragging ? "z-20 cursor-grabbing" : "cursor-grab")
      )}
      style={{
        left: placement.x - width / 2 - pad,
        top: placement.y - height / 2 - pad,
        width: width + pad * 2,
        height: height + pad * 2,
        opacity: frame.opacity,
        transform: frameTransform(frame),
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={art ?? icon.src}
        draggable={false}
        className="pointer-events-none h-full w-full max-w-none"
        style={{ filter: "drop-shadow(0 3px 6px rgb(12 74 120 / 0.2))" }}
      />
      {interactive && (
        <button
          type="button"
          aria-label={`Remove ${icon.name.toLowerCase()} sticker`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onEdit({ removed: true })}
          className={cn(
            "absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-white text-stone-900 opacity-0 shadow-sm focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-mizen-blue group-hover/sticker:opacity-100 [@media(hover:none)]:opacity-100 transition-none",
            dragging && "!opacity-0"
          )}
          // Keep the × upright while the sticker wobbles.
          style={{ transform: `rotate(${(-frame.rotate).toFixed(2)}deg)` }}
        >
          <CloseIcon size={20} weight="Bold" />
        </button>
      )}
    </div>
  );
}

export type StickersTemplateProps = {
  size: XPostSizeId;
  recipe: ParsedRecipe;
  showSky: boolean;
  time: number;
  motion: StickerMotionConfig;
  /**
   * A pre-rendered image of the recipe card. Video export swaps it in so each
   * frame doesn't re-serialize the whole recipe page.
   */
  cardSnapshot?: string | null;
  edits?: StickerEdits;
  /** Enables drag and remove; omitted during export. */
  onEditSticker?: (icon: BrandIconId, edit: StickerEdit) => void;
};

export function StickersTemplate({
  size,
  recipe,
  showSky,
  time,
  motion,
  cardSnapshot,
  edits,
  onEditSticker,
}: StickersTemplateProps) {
  const { width, height } = X_POST_SIZES[size];
  const layout = STICKER_LAYOUTS[size];
  const card = cardFrame(time, motion);

  return (
    <Frame width={width} height={height} className="bg-white dark:bg-stone-950">
      {showSky && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[55%] dark:hidden"
          style={{ background: SUBTLE_SKY }}
        />
      )}

      <div
        data-x-post-card
        className="absolute"
        style={{
          ...layout.card,
          opacity: card.opacity,
          transform: frameTransform(card),
        }}
      >
        {cardSnapshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardSnapshot}
            alt=""
            className="h-full w-full max-w-none rounded-xl shadow-lg"
          />
        ) : (
          <BrowserCard recipe={recipe} className="h-full w-full" />
        )}
      </div>

      {layout.stickers.map((placement, index) => {
        const edit = edits?.[placement.icon];
        if (edit?.removed) return null;
        return (
          <Sticker
            key={placement.icon}
            placement={{ ...placement, x: edit?.x ?? placement.x, y: edit?.y ?? placement.y }}
            index={index}
            time={time}
            motion={motion}
            onEdit={onEditSticker && ((next) => onEditSticker(placement.icon, next))}
          />
        );
      })}
    </Frame>
  );
}
