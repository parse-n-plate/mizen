"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { toBlob, toPng } from "html-to-image";
import { toast } from "sonner";
import DownloadMinimalistic from "@solar-icons/react/csr/arrows-action/DownloadMinimalistic";
import Copy from "@solar-icons/react/csr/ui/Copy";
import Play from "@solar-icons/react/csr/video/Play";
import Pause from "@solar-icons/react/csr/video/Pause";
import Restart from "@solar-icons/react/csr/arrows/Restart";
import Videocamera from "@solar-icons/react/csr/video/VideocameraRecord";
import Maximize from "@solar-icons/react/csr/arrows-action/Maximize";
import Minimize from "@solar-icons/react/csr/arrows-action/Minimize";
import Pen2 from "@solar-icons/react/csr/messages/Pen2";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUNSET_EXAMPLE_RECIPES } from "@/lib/sunset-example-recipe";
import { SUNSET_SHUTDOWN_DATE } from "@/lib/sunset";
import { cn } from "@/lib/utils";
import { developerFeedbackToolsEnabled } from "@/lib/features";
import { BRAND_ICONS_BY_ID, type BrandIconId } from "@/lib/brand-icons";
import { STICKER_MOTION_DEFAULTS, type StickerMotionConfig } from "@/lib/x-post-motion";
import { canEncodeMp4, exportMp4 } from "./export-video";
import {
  STAGE_BACKGROUNDS,
  StageshowTemplate,
  StickersTemplate,
  SunsetTemplate,
  X_POST_SIZES,
  type StageBackgroundId,
  type StickerEdit,
  type StickerEdits,
  type XPostSizeId,
} from "./templates";

// Tuning panel for local dev and Vercel preview/staging builds; production
// builds drop the import (same gate as the homepage note dial).
const XPostMotionDial =
  (process.env.NODE_ENV === "development" || process.env.MIZEN_MOTION_TUNING === "true") &&
  developerFeedbackToolsEnabled
    ? dynamic(() => import("./XPostMotionDial"), { ssr: false })
    : null;

type TemplateId = "sunset" | "stageshow" | "stickers";

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "stickers", label: "Stickers" },
  { id: "sunset", label: "Sunset" },
  { id: "stageshow", label: "Stageshow" },
];

const noopSubscribe = () => () => {};
const STICKER_COUNT = 10;

/** When every entrance has finished, used for still exports of an animation. */
function settledTime(motion: StickerMotionConfig) {
  return Math.max(
    motion.cardDuration,
    motion.stickerDelay + STICKER_COUNT * motion.stickerStagger + motion.stickerDuration
  );
}

/** Compact pill group used across the toolbar. */
function Pills<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 whitespace-nowrap rounded-md px-2.5 font-sans text-[13px] font-medium transition-none focus-visible:outline-2 focus-visible:outline-mizen-blue",
            value === option.value
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** A small on/off chip, for options that would otherwise need a labelled switch. */
function Chip({
  pressed,
  onPressedChange,
  children,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "h-7 whitespace-nowrap rounded-md px-2.5 font-sans text-[13px] font-medium transition-none focus-visible:outline-2 focus-visible:outline-mizen-blue",
        pressed
          ? "bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100"
          : "text-stone-400 line-through decoration-stone-300 hover:text-stone-700 dark:text-stone-500 dark:decoration-stone-600 dark:hover:text-stone-300"
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-7 items-center justify-center rounded-md text-stone-500 hover:bg-white hover:text-stone-900 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-mizen-blue dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-none"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-stone-200 dark:bg-stone-800" />;
}

/**
 * Scales a fixed-size canvas to fit its container: by width inline, or by
 * width and height when the container has a size of its own (fullscreen).
 */
function ScaledPreview({
  width,
  height,
  fill,
  children,
}: {
  width: number;
  height: number;
  fill: boolean;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width, height });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = fill
    ? Math.min(2, box.width / width, box.height / height)
    : Math.min(1, box.width / width);

  return (
    <div
      ref={containerRef}
      className={cn("flex w-full items-center justify-center", fill && "min-h-0 flex-1")}
    >
      <div
        className="overflow-hidden rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_24px_rgb(0_0_0/0.06)] ring-1 ring-stone-900/5 dark:ring-white/10"
        style={{ width: width * scale, height: height * scale }}
      >
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function XPostStudio() {
  const [template, setTemplate] = useState<TemplateId>("stickers");
  const [size, setSize] = useState<XPostSizeId>("landscape");
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [headlineTop, setHeadlineTop] = useState("Sunsetting");
  const [headlineBottom, setHeadlineBottom] = useState("Mizen.");
  const [subhead, setSubhead] = useState(
    `Thanks for cooking with us. Save your recipes before ${SUNSET_SHUTDOWN_DATE}.`
  );
  const [showFooter, setShowFooter] = useState(false);
  const [showSunsetBrand, setShowSunsetBrand] = useState(false);
  const [showSky, setShowSky] = useState(true);
  const [background, setBackground] = useState<StageBackgroundId>("sky");
  const [showBrand, setShowBrand] = useState(false);
  const [busy, setBusy] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [cardSnapshot, setCardSnapshot] = useState<string | null>(null);
  // Sticker moves and removals, kept per size since layouts differ.
  const [stickerEdits, setStickerEdits] = useState<Record<XPostSizeId, StickerEdits>>({
    landscape: {},
    square: {},
  });
  const editSticker = useCallback(
    (icon: BrandIconId, edit: StickerEdit) =>
      setStickerEdits((prev) => ({
        ...prev,
        [size]: { ...prev[size], [icon]: { ...prev[size][icon], ...edit } },
      })),
    [size]
  );
  const hasStickerEdits = Object.keys(stickerEdits[size]).length > 0;
  const removedStickers = (Object.keys(stickerEdits[size]) as BrandIconId[]).filter(
    (icon) => stickerEdits[size][icon]?.removed
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // Animation clock for the stickers template.
  const reduceMotion = useReducedMotion();
  const mp4Supported = useSyncExternalStore(noopSubscribe, canEncodeMp4, () => false);
  const [motion, setMotionState] = useState<StickerMotionConfig>(STICKER_MOTION_DEFAULTS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const isAnimated = template === "stickers";
  const isPlaying = isAnimated && playing && !busy && !reduceMotion;
  const shownTime = isAnimated && reduceMotion && !busy ? settledTime(motion) : time;

  const setMotion = useCallback((next: StickerMotionConfig) => {
    setMotionState((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);
  const replay = useCallback(() => {
    setTime(0);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setTime((t) => (t + delta) % motion.videoLength);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, motion.videoLength]);

  const dims = X_POST_SIZES[size];
  const recipe = SUNSET_EXAMPLE_RECIPES[recipeIndex];
  const fileName = `mizen-x-${template}-${size}`;

  async function render<T>(fn: typeof toPng | typeof toBlob): Promise<T | null> {
    const node = canvasRef.current;
    if (!node) return null;
    if (isAnimated) flushSync(() => setTime(settledTime(motion)));
    await document.fonts.ready;
    return (await fn(node, {
      pixelRatio: dims.exportScale,
      width: dims.width,
      height: dims.height,
      cacheBust: true,
    })) as T;
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const dataUrl = await render<string>(toPng);
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Couldn’t export the image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    setBusy(true);
    try {
      const blob = await render<Blob>(toBlob);
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Image copied. Paste it into your post.");
    } catch {
      toast.error("Couldn’t copy the image. Try downloading it instead.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVideo() {
    const node = canvasRef.current;
    if (!node) return;
    setBusy(true);
    setVideoProgress(0);
    try {
      // Snapshot the static recipe card once; only its wrapper animates.
      const cardNode = node.querySelector<HTMLElement>("[data-x-post-card] > *");
      if (cardNode) {
        await document.fonts.ready;
        const snapshot = await toPng(cardNode, { pixelRatio: dims.exportScale });
        const img = new Image();
        img.src = snapshot;
        await img.decode();
        flushSync(() => setCardSnapshot(snapshot));
      }
      const blob = await exportMp4({
        node,
        width: dims.width,
        height: dims.height,
        pixelRatio: dims.exportScale,
        fps: motion.fps,
        duration: motion.videoLength,
        renderFrame: (t) => flushSync(() => setTime(t)),
        onProgress: setVideoProgress,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${fileName}.mp4`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn\u2019t export the video.");
    } finally {
      setVideoProgress(null);
      setCardSnapshot(null);
      setBusy(false);
      setTime(0);
    }
  }

  const preview = (
    <div ref={canvasRef} style={{ width: dims.width, height: dims.height }}>
      {template === "sunset" ? (
        <SunsetTemplate
          size={size}
          recipe={recipe}
          headlineTop={headlineTop}
          headlineBottom={headlineBottom}
          subhead={subhead}
          showFooter={showFooter}
          showBrand={showSunsetBrand}
          showSky={showSky}
        />
      ) : template === "stickers" ? (
        <StickersTemplate
          size={size}
          recipe={recipe}
          showSky={showSky}
          time={shownTime}
          motion={motion}
          cardSnapshot={cardSnapshot}
          edits={stickerEdits[size]}
          onEditSticker={busy ? undefined : editSticker}
        />
      ) : (
        <StageshowTemplate
          size={size}
          recipe={recipe}
          background={background}
          showBrand={showBrand}
        />
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col bg-stone-100 dark:bg-stone-900",
        fullscreen ? "fixed inset-0 z-50" : "rounded-2xl",
        // Leave room for the DialKit panel, which sits over the right edge.
        fullscreen && isAnimated && XPostMotionDial && "lg:pr-[300px]"
      )}
    >
      {/* Top bar: what to make */}
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none]">
        <Pills
          label="Template"
          value={template}
          onChange={setTemplate}
          options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
        />
        <div className="ml-auto flex items-center gap-1">
          <Pills
            label="Size"
            value={size}
            onChange={setSize}
            options={(Object.keys(X_POST_SIZES) as XPostSizeId[]).map((id) => ({
              value: id,
              label: X_POST_SIZES[id].shortLabel,
            }))}
          />
          <Divider />
          <IconButton
            label={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            onClick={() => setFullscreen((f) => !f)}
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </IconButton>
        </div>
      </div>

      {/* Stage */}
      <div className={cn("flex px-4", fullscreen ? "min-h-0 flex-1 py-6" : "py-4")}>
        <ScaledPreview width={dims.width} height={dims.height} fill={fullscreen}>
          {preview}
        </ScaledPreview>
      </div>

      {/* Bottom bar: edits on the left, playback and export on the right */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 px-2 py-2",
          // Clear DialKit's collapsed toggle in the bottom-right corner.
          fullscreen && XPostMotionDial && "pr-16"
        )}
      >
        <Pills
          label="Recipe"
          value={String(recipeIndex)}
          onChange={(value) => setRecipeIndex(Number(value))}
          options={SUNSET_EXAMPLE_RECIPES.map((r, i) => ({
            value: String(i),
            label: r.title.split(" ").slice(0, 2).join(" "),
          }))}
        />
        <Divider />
        {template === "sunset" && (
          <>
            <Popover>
              <PopoverTrigger className="flex h-7 items-center gap-1.5 rounded-md px-2.5 font-sans text-[13px] font-medium text-stone-500 hover:bg-white hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-mizen-blue dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-none">
                <Pen2 size={14} />
                Text
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-80 space-y-2 p-3">
                <Input
                  aria-label="Headline line 1"
                  value={headlineTop}
                  onChange={(e) => setHeadlineTop(e.target.value)}
                />
                <Input
                  aria-label="Headline line 2"
                  value={headlineBottom}
                  onChange={(e) => setHeadlineBottom(e.target.value)}
                />
                <Textarea
                  aria-label="Subhead"
                  rows={3}
                  value={subhead}
                  onChange={(e) => setSubhead(e.target.value)}
                />
              </PopoverContent>
            </Popover>
            <Chip pressed={showSky} onPressedChange={setShowSky}>
              Sky
            </Chip>
            <Chip pressed={showSunsetBrand} onPressedChange={setShowSunsetBrand}>
              Logo
            </Chip>
            <Chip pressed={showFooter} onPressedChange={setShowFooter}>
              Credits
            </Chip>
          </>
        )}
        {template === "stickers" && (
          <>
            <Chip pressed={showSky} onPressedChange={setShowSky}>
              Sky
            </Chip>
            {removedStickers.length > 0 && (
              <Popover>
                <PopoverTrigger
                  disabled={busy}
                  className="flex h-7 items-center gap-1.5 rounded-md px-2.5 font-sans text-[13px] font-medium text-stone-500 hover:bg-white hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-mizen-blue dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-none"
                >
                  <AddCircle size={14} />
                  Sticker
                </PopoverTrigger>
                <PopoverContent align="start" side="top" className="w-auto p-1.5">
                  <div className="flex max-w-72 flex-wrap gap-1">
                    {removedStickers.map((id) => {
                      const icon = BRAND_ICONS_BY_ID[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-label={`Add ${icon.name.toLowerCase()} sticker back`}
                          title={icon.name}
                          onClick={() => editSticker(id, { removed: false })}
                          className="flex size-11 items-center justify-center rounded-md hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-mizen-blue dark:hover:bg-stone-800 transition-none"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={icon.src} alt="" className="size-8 object-contain" />
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {hasStickerEdits && (
              <button
                type="button"
                onClick={() => setStickerEdits((prev) => ({ ...prev, [size]: {} }))}
                disabled={busy}
                className="h-7 rounded-md px-2.5 font-sans text-[13px] font-medium text-stone-500 hover:bg-white hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-none"
              >
                Reset stickers
              </button>
            )}
          </>
        )}
        {template === "stageshow" && (
          <>
            <Pills
              label="Background"
              value={background}
              onChange={setBackground}
              options={(Object.keys(STAGE_BACKGROUNDS) as StageBackgroundId[]).map((id) => ({
                value: id,
                label: STAGE_BACKGROUNDS[id].label,
              }))}
            />
            <Chip pressed={showBrand} onPressedChange={setShowBrand}>
              Logo
            </Chip>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          {isAnimated && (
            <>
              <IconButton
                label={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((p) => !p)}
                disabled={busy || !!reduceMotion}
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </IconButton>
              <IconButton label="Replay" onClick={replay} disabled={busy}>
                <Restart size={16} />
              </IconButton>
              <Divider />
            </>
          )}
          <IconButton label="Copy image" onClick={handleCopy} disabled={busy}>
            <Copy size={16} />
          </IconButton>
          <IconButton label="Download PNG" onClick={handleDownload} disabled={busy}>
            <DownloadMinimalistic size={16} />
          </IconButton>
          {isAnimated && (
            <Button
              size="sm"
              className="ml-1 h-7 rounded-md px-2.5 text-[13px]"
              onClick={handleVideo}
              disabled={busy || !mp4Supported}
            >
              <Videocamera size={14} />
              {videoProgress === null ? "MP4" : `${Math.round(videoProgress * 100)}%`}
            </Button>
          )}
        </div>
      </div>

      {isAnimated && XPostMotionDial && (
        <XPostMotionDial onConfigChange={setMotion} onReplay={replay} />
      )}
    </div>
  );
}
