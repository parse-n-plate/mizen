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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SUNSET_EXAMPLE_RECIPES } from "@/lib/sunset-example-recipe";
import { SUNSET_SHUTDOWN_DATE } from "@/lib/sunset";
import { cn } from "@/lib/utils";
import { developerFeedbackToolsEnabled } from "@/lib/features";
import type { BrandIconId } from "@/lib/brand-icons";
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

const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  {
    id: "sunset",
    label: "Sunset announcement",
    description: "The landing page hero, reframed for X with the sunsetting headline.",
  },
  {
    id: "stageshow",
    label: "Recipe stageshow",
    description: "The recipe page on mobile and desktop, staged and cropped at the edges.",
  },
  {
    id: "stickers",
    label: "Floating stickers",
    description:
      "The recipe page centered with Mizen\u2019s brand icons floating around it. Exports as an MP4.",
  },
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

function Segmented<T extends string>({
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
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 font-sans text-sm font-medium transition-none",
            value === option.value
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Scales a fixed-size canvas down to fit its container's width. */
function ScaledPreview({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, containerWidth / width);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="mx-auto overflow-hidden rounded-xl ring-1 ring-stone-200 dark:ring-stone-800"
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
  const canvasRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Template"
          value={template}
          onChange={setTemplate}
          options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
        />
        <Segmented
          label="Size"
          value={size}
          onChange={setSize}
          options={(Object.keys(X_POST_SIZES) as XPostSizeId[]).map((id) => ({
            value: id,
            label: X_POST_SIZES[id].label,
          }))}
        />
      </div>

      <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
        {TEMPLATES.find((t) => t.id === template)?.description} The image follows the site theme, so
        use the moon/sun toggle above for a dark version.
      </p>

      <ScaledPreview width={dims.width} height={dims.height}>
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
      </ScaledPreview>

      <div className="flex flex-wrap gap-2">
        {isAnimated && (
          <>
            <Button onClick={handleVideo} disabled={busy || !mp4Supported}>
              <Videocamera size={16} />
              {videoProgress === null
                ? "Download MP4"
                : `Rendering ${Math.round(videoProgress * 100)}%`}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPlaying((p) => !p)}
              disabled={busy || !!reduceMotion}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button variant="secondary" onClick={replay} disabled={busy} aria-label="Replay">
              <Restart size={16} />
            </Button>
          </>
        )}
        <Button
          variant={isAnimated ? "secondary" : "default"}
          onClick={handleDownload}
          disabled={busy}
        >
          <DownloadMinimalistic size={16} />
          Download PNG
        </Button>
        <Button variant="secondary" onClick={handleCopy} disabled={busy}>
          <Copy size={16} />
          Copy image
        </Button>
      </div>

      <div className="grid gap-5 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:grid-cols-2">
        <Field label="Recipe">
          <Segmented
            label="Recipe"
            value={String(recipeIndex)}
            onChange={(value) => setRecipeIndex(Number(value))}
            options={SUNSET_EXAMPLE_RECIPES.map((r, i) => ({ value: String(i), label: r.title }))}
          />
        </Field>

        {template === "sunset" ? (
          <>
            <Field label="Headline line 1">
              <Input value={headlineTop} onChange={(e) => setHeadlineTop(e.target.value)} />
            </Field>
            <Field label="Headline line 2">
              <Input value={headlineBottom} onChange={(e) => setHeadlineBottom(e.target.value)} />
            </Field>
            <Field label="Subhead">
              <Textarea rows={2} value={subhead} onChange={(e) => setSubhead(e.target.value)} />
            </Field>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showFooter} onCheckedChange={setShowFooter} />
              Show &ldquo;Cooked with love by&rdquo;
            </label>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showSunsetBrand} onCheckedChange={setShowSunsetBrand} />
              Show Mizen logo
            </label>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showSky} onCheckedChange={setShowSky} />
              Show sky gradient
            </label>
          </>
        ) : template === "stickers" ? (
          <>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showSky} onCheckedChange={setShowSky} />
              Show sky gradient
            </label>
            <div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasStickerEdits || busy}
                onClick={() => setStickerEdits((prev) => ({ ...prev, [size]: {} }))}
              >
                Reset stickers
              </Button>
            </div>
            <p className="font-sans text-sm text-stone-500 dark:text-stone-400 sm:col-span-2">
              Drag stickers to move them, or hover one and press × to remove it. Tune the motion,
              sticker size, and outline in the DialKit panel (bottom right, in local dev and preview
              builds). Stills export the settled final frame.
            </p>
          </>
        ) : (
          <>
            <Field label="Background">
              <Segmented
                label="Background"
                value={background}
                onChange={setBackground}
                options={(Object.keys(STAGE_BACKGROUNDS) as StageBackgroundId[]).map((id) => ({
                  value: id,
                  label: STAGE_BACKGROUNDS[id].label,
                }))}
              />
            </Field>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showBrand} onCheckedChange={setShowBrand} />
              Show Mizen logo
            </label>
          </>
        )}
      </div>

      {isAnimated && XPostMotionDial && (
        <XPostMotionDial onConfigChange={setMotion} onReplay={replay} />
      )}
    </div>
  );
}
