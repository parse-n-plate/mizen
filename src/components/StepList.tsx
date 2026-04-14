"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Magnifer from "@solar-icons/react/csr/search/Magnifer";
import { X } from "lucide-react";
import Gallery from "@solar-icons/react/csr/video/Gallery";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { InstructionStep } from "@/lib/types";
import { type NumberFormat, getNumberFormat } from "@/lib/numberFormat";
import { subscribePreferences, getShowStepImages, setShowStepImages } from "@/lib/preferences";
import { displayText } from "@/utils/ingredientScaler";
import { ImageLightbox } from "@/components/ImageLightbox";

function useImageAspectRatio(src: string | undefined) {
  const [state, setState] = useState<{ ratio: number | null; error: boolean }>({
    ratio: null,
    error: false,
  });

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setState({ ratio: img.naturalWidth / img.naturalHeight, error: false });
    img.onerror = () => setState({ ratio: null, error: true });
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return state;
}

function subscribeToStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function useNumberFormat(): NumberFormat {
  return useSyncExternalStore(
    subscribeToStorage,
    getNumberFormat,
    () => "fractions" as NumberFormat
  );
}

interface StepListProps {
  steps: InstructionStep[];
}

export function StepList({ steps }: StepListProps) {
  const numberFormat = useNumberFormat();
  const [lightbox, setLightbox] = useState<{ src: string; rect: DOMRect; el: HTMLElement } | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const showImages = useSyncExternalStore(subscribePreferences, getShowStepImages, () => true);

  const hasAnyImages = steps.some((s) => (s.imageUrls?.length ?? 0) > 0 || !!s.imageUrl);

  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) return steps.map((step, i) => ({ step, originalIndex: i }));
    const query = searchQuery.toLowerCase().trim();
    return steps
      .map((step, i) => ({ step, originalIndex: i }))
      .filter(
        ({ step }) =>
          step.title?.toLowerCase().includes(query) || step.detail.toLowerCase().includes(query)
      );
  }, [steps, searchQuery]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-3 px-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Directions
          </h3>
          {hasAnyImages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowStepImages(!showImages)}
                  aria-label={showImages ? "Hide photos" : "Show photos"}
                  className={`press-scale inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors cursor-pointer ${
                    showImages
                      ? "text-[var(--color-blue)] bg-blue-50 dark:bg-blue-950 dark:text-blue-400"
                      : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  <Gallery size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showImages ? "Hide photos" : "Show photos"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="relative w-full max-w-[260px]">
          <Magnifer className="absolute left-3 top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search Directions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search directions"
            className="pl-9 pr-8 h-9 rounded-xl border-transparent bg-stone-100 dark:bg-stone-800 font-sans text-[13px] placeholder:text-muted-foreground focus-visible:bg-background focus-visible:border-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      {filteredSteps.length === 0 && searchQuery.trim() ? (
        <p className="font-sans text-sm text-muted-foreground text-center py-4 px-3">
          No directions match &ldquo;{searchQuery}&rdquo;
        </p>
      ) : null}
      {filteredSteps.map(({ step, originalIndex }, i) => (
        <StepRow
          key={originalIndex}
          step={step}
          index={originalIndex}
          isLast={i === filteredSteps.length - 1}
          numberFormat={numberFormat}
          onImageClick={setLightbox}
          showImages={showImages}
        />
      ))}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt="Step image"
          sourceRect={lightbox.rect}
          sourceEl={lightbox.el}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function StepRow({
  step,
  index,
  isLast,
  numberFormat,
  onImageClick,
  showImages,
}: {
  step: InstructionStep;
  index: number;
  isLast: boolean;
  numberFormat: NumberFormat;
  onImageClick: (state: { src: string; rect: DOMRect; el: HTMLElement }) => void;
  showImages: boolean;
}) {
  // Resolve images: prefer imageUrls array, fall back to singular imageUrl
  const images = step.imageUrls?.length ? step.imageUrls : step.imageUrl ? [step.imageUrl] : [];
  const isMulti = images.length > 1;

  const { ratio, error } = useImageAspectRatio(!isMulti ? images[0] : undefined);
  const hasImage = images.length > 0 && !error;
  // Three zones: < 0.7 tall portrait → inline, 0.7–1.4 → side-by-side, > 1.4 → inline
  const isSideBySide = !isMulti && ratio !== null && ratio >= 0.7 && ratio <= 1.4;
  const isInline = !isMulti && ratio !== null && !isSideBySide;

  return (
    <div className="relative flex flex-col py-3.5 px-3 rounded-lg group hover:bg-[var(--color-cream)]">
      {!isLast && (
        <div className="step-list-divider absolute bottom-0 left-3 right-3 h-px bg-stone-100 dark:bg-stone-800 transition-opacity duration-150 group-hover:opacity-0" />
      )}
      <div className="flex gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {step.title && (
            <h4 className="font-sans text-body-md-sm font-medium text-heading">{step.title}</h4>
          )}
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-300">
            {displayText(step.detail, numberFormat)}
          </p>
          {step.tips && (
            <p className="font-sans text-xs italic text-stone-400 dark:text-stone-500">
              Tip: {displayText(step.tips, numberFormat)}
            </p>
          )}
        </div>

        {/* Side-by-side: portrait/square/mild landscape (0.7–1.4) */}
        {hasImage && isSideBySide && showImages && (
          <div
            className="flex-shrink-0 w-[40%] max-w-[180px]"
            onClick={(e) => {
              const img = e.currentTarget.querySelector("img") ?? e.currentTarget;
              onImageClick({
                src: images[0],
                rect: img.getBoundingClientRect(),
                el: img as HTMLElement,
              });
            }}
          >
            <Image
              src={images[0]}
              alt={`Step ${index + 1}`}
              width={180}
              height={Math.round(180 / (ratio ?? 1))}
              className="w-full h-auto rounded-[10px]"
              unoptimized
            />
          </div>
        )}
      </div>

      {/* Inline: tall portrait (<0.7) or landscape (>1.4) — no crop, max-height capped */}
      {hasImage && isInline && (
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${showImages ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div
              className="mt-2 flex"
              onClick={(e) => {
                const img = e.currentTarget.querySelector("img") ?? e.currentTarget;
                onImageClick({
                  src: images[0],
                  rect: img.getBoundingClientRect(),
                  el: img as HTMLElement,
                });
              }}
            >
              <Image
                src={images[0]}
                alt={`Step ${index + 1}`}
                width={496}
                height={Math.round(496 / (ratio ?? 1))}
                className="max-w-full max-h-[280px] w-auto h-auto rounded-[10px]"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Multiple images — horizontal row, fixed height thumbnails */}
      {hasImage && isMulti && (
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${showImages ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="mt-2 flex gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0"
                  onClick={(e) => {
                    const img = e.currentTarget.querySelector("img") ?? e.currentTarget;
                    onImageClick({
                      src,
                      rect: img.getBoundingClientRect(),
                      el: img as HTMLElement,
                    });
                  }}
                >
                  <Image
                    src={src}
                    alt={`Step ${index + 1}, photo ${i + 1}`}
                    width={240}
                    height={140}
                    className="w-full h-[140px] rounded-[10px] object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
