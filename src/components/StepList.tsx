"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Lightbulb from "@solar-icons/react/csr/devices/Lightbulb";
import type { InstructionStep } from "@/lib/types";
import { type NumberFormat, getNumberFormat } from "@/lib/numberFormat";
import { subscribePreferences, getShowStepImages } from "@/lib/preferences";
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
  const showImages = useSyncExternalStore(subscribePreferences, getShowStepImages, () => true);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-3 md:pl-3">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex-shrink-0">
          Directions
        </h3>
      </div>
      {steps.map((step, originalIndex) => (
        <StepRow
          key={originalIndex}
          step={step}
          index={originalIndex}
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
  numberFormat,
  onImageClick,
  showImages,
}: {
  step: InstructionStep;
  index: number;
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
    <div
      id={`step-${index + 1}`}
      className="relative flex flex-col py-3.5 md:px-3 rounded-lg group hover:bg-[var(--color-cream)]"
    >
      <div className="md:flex md:gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {step.title && (
            <h4 className="font-sans text-body-md-sm font-medium text-heading">
              <span className="tabular-nums">{index + 1}.</span> {step.title}
            </h4>
          )}
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-300">
            {displayText(step.detail, numberFormat)}
          </p>
        </div>

        {/* Side-by-side: portrait/square/mild landscape (0.7–1.4) */}
        {hasImage && isSideBySide && (
          <div className="step-image-reveal-x hidden flex-shrink-0 md:grid" data-open={showImages}>
            <div className="overflow-hidden">
              <div
                className="step-image-reveal-inner w-[40vw] max-w-[180px] cursor-zoom-in"
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
            </div>
          </div>
        )}
      </div>

      {/* Mobile: all single images stack full-width below the step copy. */}
      {hasImage && !isMulti && (
        <div className="step-image-reveal grid md:hidden" data-open={showImages}>
          <div className="overflow-hidden">
            <div
              className="step-image-reveal-inner mt-3"
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
                className="w-full h-auto rounded-[10px]"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Inline: tall portrait (<0.7) or landscape (>1.4) — no crop, max-height capped */}
      {hasImage && isInline && (
        <div className="step-image-reveal hidden md:grid" data-open={showImages}>
          <div className="overflow-hidden">
            <div
              className="step-image-reveal-inner mt-2 cursor-zoom-in"
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
                className="w-full h-auto rounded-[10px]"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Multiple images — stacked on mobile, horizontal thumbnails on desktop */}
      {hasImage && isMulti && (
        <div className="step-image-reveal grid" data-open={showImages}>
          <div className="overflow-hidden">
            <div className="step-image-reveal-inner mt-3 md:mt-2 flex flex-col md:flex-row gap-3 md:gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 cursor-zoom-in"
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
                    className="w-full h-auto md:h-[140px] rounded-[10px] md:object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step.tips && (
        <p className="font-sans text-xs italic text-stone-400 dark:text-stone-500 flex items-start gap-1 mt-2.5">
          <Lightbulb width={14} height={14} className="shrink-0 mt-px" />
          {displayText(step.tips, numberFormat)}
        </p>
      )}
    </div>
  );
}
