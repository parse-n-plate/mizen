"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import type { ParsedRecipe } from "@/lib/types";
import { RecipeHeader, formatTime } from "@/components/RecipeHeader";
import { IngredientList } from "@/components/IngredientList";
import { StepList } from "@/components/StepList";
import { scaleIngredients } from "@/utils/ingredientScaler";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type SourceType = "url" | "photo" | "text";

function extractDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function extractDishName(urlStr: string): string | null {
  try {
    const { pathname } = new URL(urlStr);
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments.at(-1);
    if (!slug) return null;
    if (/^\d+$/.test(slug) || /^\d{4}-\d{2}/.test(slug)) return null;
    const name = slug
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    return name.length > 1 ? name : null;
  } catch {
    return null;
  }
}

function UrlAttachment({ url, onClick }: { url: string; onClick: () => void }) {
  const domain = extractDomain(url);
  const dishName = extractDishName(url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

  return (
    <button
      onClick={(e) => {
        (e.currentTarget as HTMLElement).blur();
        onClick();
      }}
      className="group inline-flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrl}
        alt=""
        width={16}
        height={16}
        className="rounded-[3px] shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="flex flex-col min-w-0 gap-0 items-start">
        <span className="text-[13px] font-medium leading-[17px] text-stone-700 dark:text-stone-200 group-hover:text-stone-800 dark:group-hover:text-stone-100 transition-colors truncate max-w-[240px]">
          {dishName ?? domain}
        </span>
        <span className="text-[11px] leading-[14px] text-stone-400 dark:text-stone-500 truncate">
          {domain}
        </span>
      </div>
    </button>
  );
}

function TextAttachment({ onClick, charCount }: { onClick: () => void; charCount: number }) {
  return (
    <button
      onClick={(e) => {
        (e.currentTarget as HTMLElement).blur();
        onClick();
      }}
      className="group inline-flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 12 12"
        fill="none"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          d="M2 3h8M2 6h6M2 9h4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-start">
        <span className="text-[13px] font-medium leading-[17px] text-stone-700 dark:text-stone-200 group-hover:text-stone-800 dark:group-hover:text-stone-100 transition-colors">
          Pasted text
        </span>
        <span className="text-[11px] leading-[14px] text-stone-400 dark:text-stone-500">
          {charCount.toLocaleString()} characters
        </span>
      </div>
    </button>
  );
}

const DEFAULT_PASTED_TEXT = `Chocolate Chip Cookies

2¼ cups all-purpose flour
1 tsp baking soda
1 tsp fine sea salt
1 tsp cornstarch
¾ cup unsalted butter, melted
¾ cup packed light brown sugar
½ cup granulated sugar
2 tsp vanilla extract
1¼ cups chocolate chips

Whisk together flour, baking soda, salt, and cornstarch in a medium bowl. Set aside.

In a large bowl, whisk the melted butter, brown sugar, and granulated sugar until smooth. Beat in the egg and vanilla extract until combined.

Slowly mix the dry ingredients into the wet ingredients until just combined. Fold in the chocolate chips. Cover dough and refrigerate for at least 30 minutes (or up to 2 days).

Preheat oven to 325°F (163°C). Scoop 1.5 tablespoon balls of dough onto lined baking sheets, spaced 2 inches apart. Bake for 12 minutes until edges are set but centers look undone. Cool on the pan for 10 minutes.`;

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;

function ImageLightboxContent({
  recipe,
  zoom,
  pan,
  containerRef,
  handleWheel,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleZoomIn,
  handleZoomOut,
  resetView,
  hasTranscription,
}: {
  recipe: ParsedRecipe;
  zoom: number;
  pan: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleWheel: (e: React.WheelEvent) => void;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  resetView: () => void;
  hasTranscription: boolean;
}) {
  if (!hasTranscription) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={recipe.imageUrl}
        alt={recipe.title}
        className="w-full max-h-[80vh] object-contain rounded-lg"
      />
    );
  }

  return (
    <>
      {/* Image */}
      <div
        ref={containerRef}
        className="relative shrink-0 bg-stone-100 dark:bg-stone-800 flex items-center justify-center overflow-hidden select-none aspect-[4/3] sm:aspect-auto sm:w-2/3"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: zoom > 1 ? "grab" : "default", touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-contain pointer-events-none transition-transform duration-150 ease-out"
          draggable={false}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          }}
        />
        {/* Zoom controls */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-1 z-10">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_MIN}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Zoom out"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            onClick={resetView}
            className="px-2 h-7 flex items-center justify-center rounded-full text-white text-xs font-medium tabular-nums hover:bg-white/20 transition-colors min-w-[3rem]"
            aria-label="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_MAX}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Zoom in"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
      {/* Transcription */}
      <div className="overflow-y-auto p-5 sm:p-6 sm:w-1/3">
        <div className="space-y-4">
          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
              Transcription
            </h3>
            <p className="font-sans text-[14px] leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
              {recipe.imageTranscription}
            </p>
          </div>
          <div className="border-t border-stone-200 dark:border-stone-700 pt-4 space-y-3">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              At a glance
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              {recipe.servings && (
                <div className="flex flex-col gap-0.5 rounded-lg bg-stone-50 dark:bg-stone-800 px-3 py-2">
                  <span className="text-stone-400 dark:text-stone-500">Yield</span>
                  <span className="font-medium text-stone-700 dark:text-stone-200">
                    {recipe.servings} loaves
                  </span>
                </div>
              )}
              {recipe.totalTimeMinutes && (
                <div className="flex flex-col gap-0.5 rounded-lg bg-stone-50 dark:bg-stone-800 px-3 py-2">
                  <span className="text-stone-400 dark:text-stone-500">Total time</span>
                  <span className="font-medium text-stone-700 dark:text-stone-200">
                    {formatTime(recipe.totalTimeMinutes)}
                  </span>
                </div>
              )}
              {recipe.cookTimeMinutes && (
                <div className="flex flex-col gap-0.5 rounded-lg bg-stone-50 dark:bg-stone-800 px-3 py-2">
                  <span className="text-stone-400 dark:text-stone-500">Bake</span>
                  <span className="font-medium text-stone-700 dark:text-stone-200">
                    400°F / {formatTime(recipe.cookTimeMinutes)}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-0.5 rounded-lg bg-stone-50 dark:bg-stone-800 px-3 py-2">
                <span className="text-stone-400 dark:text-stone-500">Ingredients</span>
                <span className="font-medium text-stone-700 dark:text-stone-200">
                  {recipe.ingredients.reduce((sum, g) => sum + g.ingredients.length, 0)} items
                </span>
              </div>
            </div>
          </div>
          {recipe.author && (
            <p className="font-sans text-[12px] text-stone-400 dark:text-stone-500 italic">
              Source: {recipe.author}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function ImageLightbox({
  open,
  onOpenChange,
  recipe,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: ParsedRecipe;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z - ZOOM_STEP, ZOOM_MIN);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => {
      const next = Math.min(Math.max(z + delta, ZOOM_MIN), ZOOM_MAX);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom <= 1) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [zoom, pan]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const hasTranscription = !!recipe.imageTranscription;

  const contentProps = {
    recipe,
    zoom,
    pan,
    containerRef,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleZoomIn,
    handleZoomOut,
    resetView,
    hasTranscription,
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) resetView();
  };

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent
          aria-describedby={undefined}
          className="max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-stone-900"
        >
          <DrawerTitle className="sr-only">{recipe.title}</DrawerTitle>
          <div className="overflow-y-auto">
            <ImageLightboxContent {...contentProps} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`p-0 border-0 overflow-hidden ${
          hasTranscription
            ? "sm:max-w-[min(1400px,94vw)] w-[94vw] max-h-[88vh] bg-white dark:bg-stone-900 rounded-xl"
            : "max-w-2xl w-auto bg-transparent shadow-none"
        } [&>button[data-slot=dialog-close]]:bg-black/50 [&>button[data-slot=dialog-close]]:text-white [&>button[data-slot=dialog-close]]:rounded-full [&>button[data-slot=dialog-close]]:p-1 [&>button[data-slot=dialog-close]]:top-2 [&>button[data-slot=dialog-close]]:right-2 [&>button[data-slot=dialog-close]]:opacity-100 [&>button[data-slot=dialog-close]]:hover:bg-black/70 [&>button[data-slot=dialog-close]]:z-20`}
      >
        <DialogTitle className="sr-only">{recipe.title}</DialogTitle>
        <div className="flex flex-row h-[min(80vh,calc(94vw*2/3))]">
          <ImageLightboxContent {...contentProps} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextDialogBody({ text }: { text: string }) {
  return (
    <>
      <div className="px-5 pb-4 max-h-[50vh] overflow-y-auto">
        <p className="font-sans text-[14px] leading-relaxed text-stone-600 dark:text-stone-300 whitespace-pre-wrap">
          {text}
        </p>
      </div>
      <div className="flex items-center gap-2 px-5 py-3 border-t border-stone-200 dark:border-stone-700">
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy text
        </button>
        <a
          href={`https://chatgpt.com/?q=${encodeURIComponent(`Here's a recipe someone shared with me:\n\n${text}\n\nCan you help me with this recipe? I'd love tips, substitutions, or any improvements you'd suggest.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
          </svg>
          Open in ChatGPT
        </a>
      </div>
    </>
  );
}

function UrlDialogBody({ recipe }: { recipe: ParsedRecipe }) {
  return (
    <>
      <div className="px-5 pb-4 max-h-[60vh] overflow-y-auto space-y-4">
        <div className="space-y-1">
          <p className="font-sans text-[15px] font-medium text-stone-800 dark:text-stone-200">
            {recipe.title}
          </p>
          {recipe.author && (
            <p className="font-sans text-[13px] text-stone-500 dark:text-stone-400">
              by {recipe.author}
            </p>
          )}
        </div>
        <div className="flex gap-3 text-[13px] text-stone-500 dark:text-stone-400">
          {recipe.ingredients.length > 0 && (
            <span>
              {recipe.ingredients.reduce((sum, g) => sum + g.ingredients.length, 0)} ingredients
            </span>
          )}
          {recipe.instructions.length > 0 && <span>{recipe.instructions.length} steps</span>}
          {recipe.totalTimeMinutes && <span>{formatTime(recipe.totalTimeMinutes)}</span>}
        </div>
        {recipe.summary && (
          <p className="font-sans text-[14px] leading-relaxed text-stone-600 dark:text-stone-300">
            {recipe.summary}
          </p>
        )}
        {recipe.sourceSiteDescription && (
          <div className="space-y-1.5">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              About {recipe.author ?? extractDomain(recipe.sourceUrl!)}
            </h4>
            <p className="font-sans text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
              {recipe.sourceSiteDescription}
            </p>
          </div>
        )}
        {recipe.commentConsensus && (
          <div className="space-y-1.5">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              What commenters say
            </h4>
            <p className="font-sans text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
              {recipe.commentConsensus}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-5 py-3 border-t border-stone-200 dark:border-stone-700">
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(extractDomain(recipe.sourceUrl!))}&sz=32`}
            alt=""
            width={14}
            height={14}
            className="rounded-[2px]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          View original
        </a>
      </div>
    </>
  );
}

interface WaitlistRecipePreviewProps {
  recipe: ParsedRecipe;
  sourceType?: SourceType;
  pastedText?: string;
}

export function WaitlistRecipePreview({
  recipe,
  sourceType,
  pastedText,
}: WaitlistRecipePreviewProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const originalServings = recipe.servings ?? 1;
  const [servings, setServings] = useState(originalServings);
  const [activeTab, setActiveTab] = useState<"prep" | "cook">("prep");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const pastedTextContent = pastedText ?? DEFAULT_PASTED_TEXT;

  const scaledIngredients = useMemo(() => {
    return scaleIngredients(recipe.ingredients, originalServings, servings);
  }, [recipe.ingredients, originalServings, servings]);

  const hasInstructions = recipe.instructions.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header area — not scrollable */}
      <div className="px-5 sm:px-8 pt-6 pb-0">
        <div className="mb-5">
          <RecipeHeader
            recipe={recipe}
            servings={servings}
            originalServings={originalServings}
            onServingsChange={setServings}
          />
        </div>

        {/* Source attachment */}
        <div className="mb-4 -mx-1">
          {sourceType === "url" && recipe.sourceUrl && (
            <UrlAttachment url={recipe.sourceUrl} onClick={() => setUrlOpen(true)} />
          )}
          {sourceType === "photo" && recipe.imageUrl && (
            <button
              onClick={(e) => {
                (e.currentTarget as HTMLElement).blur();
                setLightboxOpen(true);
              }}
              className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-stone-700 group-hover:border-stone-300 dark:group-hover:border-stone-600 transition-colors"
                draggable={false}
              />
              <span className="font-sans text-sm text-stone-400 dark:text-stone-500 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors">
                1 photo
              </span>
            </button>
          )}
          {sourceType === "text" && (
            <TextAttachment
              onClick={() => setTextOpen(true)}
              charCount={pastedTextContent.length}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-end w-full relative gap-0 px-5 sm:px-8 border-b border-stone-200 dark:border-stone-700">
        <button
          onClick={() => setActiveTab("prep")}
          className={`folder-tab-trigger press-scale h-12 px-5 sm:px-10 font-sans text-[15px] ${
            activeTab === "prep" ? "font-semibold" : "font-medium"
          }`}
          data-state={activeTab === "prep" ? "active" : "inactive"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/icon-prep.png"
            alt=""
            width={24}
            height={24}
            className="tab-icon-prep h-6 w-6"
          />
          Prep
          {recipe.prepTimeMinutes ? (
            <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
              {formatTime(recipe.prepTimeMinutes)}
            </span>
          ) : null}
        </button>
        {hasInstructions && (
          <button
            onClick={() => setActiveTab("cook")}
            className={`folder-tab-trigger press-scale h-12 px-5 sm:px-10 font-sans text-[15px] ${
              activeTab === "cook" ? "font-semibold" : "font-medium"
            }`}
            data-state={activeTab === "cook" ? "active" : "inactive"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/icon-cook.svg"
              alt=""
              width={24}
              height={24}
              className="tab-icon-cook h-6 w-6"
            />
            Cook
            {recipe.cookTimeMinutes ? (
              <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
                {formatTime(recipe.cookTimeMinutes)}
              </span>
            ) : null}
          </button>
        )}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-stone-900">
        <div className="px-5 sm:px-8 pt-5 pb-6">
          {activeTab === "prep" ? (
            <div key="prep" className="tab-content-animate">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-6 pl-2">
                Ingredients
              </h3>
              <IngredientList groups={scaledIngredients} />
            </div>
          ) : (
            <div key="cook" className="tab-content-animate">
              <StepList steps={recipe.instructions} />
            </div>
          )}
        </div>
      </div>

      {recipe.imageUrl && (
        <ImageLightbox open={lightboxOpen} onOpenChange={setLightboxOpen} recipe={recipe} />
      )}

      {isDesktop ? (
        <Dialog open={textOpen} onOpenChange={setTextOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <DialogTitle className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100 px-5 pt-5 pb-3">
              Pasted text
            </DialogTitle>
            <TextDialogBody text={pastedTextContent} />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={textOpen} onOpenChange={setTextOpen}>
          <DrawerContent aria-describedby={undefined} className="max-h-[85vh] p-0 overflow-hidden">
            <DrawerTitle className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100 px-5 pt-4 pb-3">
              Pasted text
            </DrawerTitle>
            <TextDialogBody text={pastedTextContent} />
          </DrawerContent>
        </Drawer>
      )}

      {recipe.sourceUrl &&
        (isDesktop ? (
          <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
            <DialogContent className="max-w-sm p-0 overflow-hidden">
              <DialogTitle className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100 px-5 pt-5 pb-3">
                Source
              </DialogTitle>
              <UrlDialogBody recipe={recipe} />
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={urlOpen} onOpenChange={setUrlOpen}>
            <DrawerContent
              aria-describedby={undefined}
              className="max-h-[85vh] p-0 overflow-hidden"
            >
              <DrawerTitle className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100 px-5 pt-4 pb-3">
                Source
              </DrawerTitle>
              <UrlDialogBody recipe={recipe} />
            </DrawerContent>
          </Drawer>
        ))}
    </div>
  );
}
