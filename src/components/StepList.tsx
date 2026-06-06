"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useDialKit } from "dialkit";
import Magnifer from "@solar-icons/react/csr/search/Magnifer";
import { X } from "lucide-react";
import Gallery from "@solar-icons/react/csr/video/Gallery";
import Lightbulb from "@solar-icons/react/csr/devices/Lightbulb";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { IngredientGroup, InstructionStep } from "@/lib/types";
import { type NumberFormat, getNumberFormat } from "@/lib/numberFormat";
import { subscribePreferences, getShowStepImages, setShowStepImages } from "@/lib/preferences";
import {
  matchIngredientReferences,
  type IngredientStepReference,
} from "@/lib/ingredient-step-references";
import { displayAmount, displayText } from "@/utils/ingredientScaler";
import { ImageLightbox } from "@/components/ImageLightbox";

const REVEAL_EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const REVEAL_DURATION = 200;
const REVEAL_TRANSLATE_Y = 8;
const REVEAL_STAGGER = 50;

function photoRevealStyle(show: boolean, index = 0): React.CSSProperties {
  const delay = index * REVEAL_STAGGER;
  if (show) {
    return {
      opacity: 1,
      transform: "translateY(0)",
      transition: `opacity ${REVEAL_DURATION}ms ${REVEAL_EASE} ${delay}ms, transform ${REVEAL_DURATION}ms ${REVEAL_EASE} ${delay}ms`,
      willChange: "opacity, transform",
    };
  }
  return {
    opacity: 0,
    transform: `translateY(${REVEAL_TRANSLATE_Y}px)`,
    transition: "opacity 0ms, transform 0ms",
  };
}

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
  ingredientGroups?: IngredientGroup[];
  enableMobileSearchPortal?: boolean;
}

export function StepList({
  steps,
  ingredientGroups,
  enableMobileSearchPortal = true,
}: StepListProps) {
  const referenceDial = useDialKit("Ingredient References", {
    mode: {
      type: "select",
      options: ["Inline amounts", "Ingredient line", "Hover amounts", "Hidden"],
      default: "Inline amounts",
    },
    inlineAmountColor: {
      type: "color",
      default: "#DDF4FF",
    },
  });
  const numberFormat = useNumberFormat();
  const [lightbox, setLightbox] = useState<{ src: string; rect: DOMRect; el: HTMLElement } | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchContainer, setMobileSearchContainer] = useState<HTMLElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const isSearchExpanded = isSearchOpen || !!searchQuery;
  const showImages = useSyncExternalStore(subscribePreferences, getShowStepImages, () => true);

  useEffect(() => {
    if (!enableMobileSearchPortal) return;

    const frame = requestAnimationFrame(() => {
      setMobileSearchContainer(document.getElementById("mobile-recipe-search-action"));
    });

    return () => cancelAnimationFrame(frame);
  }, [enableMobileSearchPortal]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const input = isMobileViewport ? mobileSearchInputRef.current : desktopSearchInputRef.current;
    input?.focus({ preventScroll: true });
  }, [isSearchOpen]);

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

  const searchControl = (placement: "desktop" | "mobile") => {
    const isMobile = placement === "mobile";

    return (
      <div
        className={`group relative h-9 transition-[width] duration-200 ease-in-out ${
          isSearchExpanded
            ? isMobile
              ? "w-[min(260px,calc(100vw-5.25rem))]"
              : "w-[260px] max-w-full"
            : isMobile
              ? "w-9"
              : "w-7"
        }`}
      >
        <div className={isMobile && isSearchExpanded ? "absolute right-0 top-0 h-9 w-full" : ""}>
          {!searchQuery && (
            <Magnifer
              className={`absolute top-1/2 size-[16px] -translate-y-1/2 text-muted-foreground pointer-events-none z-10 transition-colors ${
                isSearchExpanded
                  ? "right-2"
                  : "left-1/2 -translate-x-1/2 group-hover:text-stone-600 dark:group-hover:text-stone-300"
              }`}
            />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search directions"
                aria-hidden={isSearchExpanded}
                tabIndex={isSearchExpanded ? -1 : 0}
                className={`press-scale absolute inset-0 rounded-xl transition-opacity duration-150 ease-out hover:bg-stone-100 dark:hover:bg-stone-800 ${
                  isSearchExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Search directions</TooltipContent>
          </Tooltip>
          <Input
            ref={isMobile ? mobileSearchInputRef : desktopSearchInputRef}
            type="text"
            placeholder="Search Directions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => {
              if (!searchQuery) setIsSearchOpen(false);
            }}
            aria-label="Search directions"
            tabIndex={isSearchExpanded ? 0 : -1}
            aria-hidden={!isSearchExpanded}
            className={`absolute inset-0 w-full pl-3 pr-9 h-9 rounded-xl border-transparent bg-stone-100 dark:bg-stone-800 font-sans text-[13px] placeholder:text-muted-foreground focus-visible:bg-background focus-visible:border-input transition-opacity duration-200 ease-out ${
              isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors z-10"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {mobileSearchContainer &&
        createPortal(
          <div className="md:hidden">{searchControl("mobile")}</div>,
          mobileSearchContainer
        )}

      <div className="flex items-center justify-between gap-4 mb-3 md:pl-3">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex-shrink-0">
          Directions
        </h3>
        <div className="flex items-center gap-1.5">
          {hasAnyImages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowStepImages(!showImages)}
                  aria-label={showImages ? "Hide photos" : "Show photos"}
                  className={`press-scale inline-flex items-center justify-center h-9 w-7 rounded-xl transition-colors cursor-pointer ${
                    showImages
                      ? "text-stone-700 bg-stone-100 dark:bg-stone-800 dark:text-stone-200"
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
          <div className={mobileSearchContainer ? "hidden md:block" : ""}>
            {searchControl("desktop")}
          </div>
        </div>
      </div>
      {filteredSteps.length === 0 && searchQuery.trim() ? (
        <p className="font-sans text-sm text-muted-foreground text-center py-4 md:px-3">
          No directions match &ldquo;{searchQuery}&rdquo;
        </p>
      ) : null}
      {filteredSteps.map(({ step, originalIndex }) => (
        <StepRow
          key={originalIndex}
          step={step}
          index={originalIndex}
          ingredientGroups={ingredientGroups}
          referenceMode={referenceDial.mode as IngredientReferenceMode}
          inlineAmountColor={referenceDial.inlineAmountColor as string}
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

type IngredientReferenceMode = "Inline amounts" | "Ingredient line" | "Hover amounts" | "Hidden";

function StepRow({
  step,
  index,
  ingredientGroups,
  referenceMode,
  inlineAmountColor,
  numberFormat,
  onImageClick,
  showImages,
}: {
  step: InstructionStep;
  index: number;
  ingredientGroups?: IngredientGroup[];
  referenceMode: IngredientReferenceMode;
  inlineAmountColor: string;
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
  const detailText = displayText(step.detail, numberFormat);
  const ingredientReferences = useMemo(
    () => matchIngredientReferences(step, ingredientGroups, detailText),
    [detailText, ingredientGroups, step]
  );

  return (
    <div
      id={`step-${index + 1}`}
      className="relative flex flex-col py-3.5 md:px-3 rounded-lg group hover:bg-[var(--color-cream)]"
    >
      <div className="md:flex md:gap-6">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {step.title && (
            <h4 className="mb-2.5 font-sans text-body-md-sm font-medium text-heading">
              {step.title}
            </h4>
          )}
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-300">
            {referenceMode === "Inline amounts" ? (
              <StepDetailWithInlineIngredientReferences
                text={detailText}
                references={ingredientReferences}
                inlineAmountColor={inlineAmountColor}
                numberFormat={numberFormat}
              />
            ) : referenceMode === "Hover amounts" ? (
              <StepDetailWithBoldIngredientReferences
                text={detailText}
                references={ingredientReferences}
                numberFormat={numberFormat}
              />
            ) : (
              detailText
            )}
          </p>
          {referenceMode === "Inline amounts" &&
            ingredientReferences.some((reference) => reference.start === undefined) && (
              <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Ingredients in this step">
                {ingredientReferences
                  .filter((reference) => reference.start === undefined)
                  .map((reference) => (
                    <IngredientReferenceHit
                      key={reference.key}
                      reference={reference}
                      numberFormat={numberFormat}
                    />
                  ))}
              </div>
            )}
          {referenceMode === "Ingredient line" && ingredientReferences.length > 0 && (
            <IngredientReferenceTextList
              references={ingredientReferences}
              numberFormat={numberFormat}
            />
          )}
        </div>

        {/* Side-by-side: portrait/square/mild landscape (0.7–1.4) */}
        {hasImage && isSideBySide && (
          <div
            className="hidden md:grid flex-shrink-0"
            style={{
              gridTemplateColumns: showImages ? "1fr" : "0fr",
              transition: `grid-template-columns ${REVEAL_DURATION}ms ${REVEAL_EASE}`,
            }}
          >
            <div className="overflow-hidden">
              <div
                className="w-[40vw] max-w-[180px] cursor-zoom-in"
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
                  style={photoRevealStyle(showImages)}
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: all single images stack full-width below the step copy. */}
      {hasImage && !isMulti && (
        <div
          className="grid md:hidden"
          style={{
            gridTemplateRows: showImages ? "1fr" : "0fr",
            transition: `grid-template-rows ${REVEAL_DURATION}ms ${REVEAL_EASE}`,
          }}
        >
          <div className="overflow-hidden">
            <div
              className="mt-6"
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
                style={photoRevealStyle(showImages)}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Inline: tall portrait (<0.7) or landscape (>1.4) — no crop, max-height capped */}
      {hasImage && isInline && (
        <div
          className="hidden md:grid"
          style={{
            gridTemplateRows: showImages ? "1fr" : "0fr",
            transition: `grid-template-rows ${REVEAL_DURATION}ms ${REVEAL_EASE}`,
          }}
        >
          <div className="overflow-hidden">
            <div
              className="mt-6 flex cursor-zoom-in"
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
                style={photoRevealStyle(showImages)}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Multiple images — stacked on mobile, horizontal thumbnails on desktop */}
      {hasImage && isMulti && (
        <div
          className="grid"
          style={{
            gridTemplateRows: showImages ? "1fr" : "0fr",
            transition: `grid-template-rows ${REVEAL_DURATION}ms ${REVEAL_EASE}`,
          }}
        >
          <div className="overflow-hidden">
            <div className="mt-3 md:mt-2 flex flex-col md:flex-row gap-3 md:gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 cursor-zoom-in"
                  style={photoRevealStyle(showImages, i)}
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

function IngredientReferenceHit({
  reference,
  numberFormat,
}: {
  reference: IngredientStepReference;
  numberFormat: NumberFormat;
}) {
  const { amount, label } = getIngredientReferenceDisplay(reference, numberFormat);

  return (
    <span
      className="inline-flex items-baseline gap-1 rounded-lg bg-stone-100 px-2.5 py-1.5 font-sans text-[14px] leading-none text-stone-500 dark:bg-stone-800 dark:text-stone-400"
      title={
        reference.usage === "partial"
          ? `${reference.ingredient.ingredient}: partial amount`
          : reference.ingredient.ingredient
      }
    >
      {amount && <span className="font-medium text-stone-700 dark:text-stone-100">{amount}</span>}
      <span>{label}</span>
    </span>
  );
}

function IngredientReferenceTextList({
  references,
  numberFormat,
}: {
  references: IngredientStepReference[];
  numberFormat: NumberFormat;
}) {
  return (
    <p
      className="mt-6 font-sans text-sm leading-relaxed text-stone-500 dark:text-stone-400"
      aria-label="Ingredients in this step"
    >
      {references.map((reference, index) => {
        const { amount, label } = getIngredientReferenceDisplay(reference, numberFormat);
        return (
          <Fragment key={reference.key}>
            {index > 0 ? ", " : ""}
            <span className="font-medium text-stone-700 dark:text-stone-200">{amount}</span>{" "}
            <span>{label}</span>
          </Fragment>
        );
      })}
    </p>
  );
}

function getIngredientReferenceDisplay(
  reference: IngredientStepReference,
  numberFormat: NumberFormat
) {
  return {
    amount:
      reference.usage === "partial"
        ? "partial"
        : [displayAmount(reference.ingredient.amount, numberFormat), reference.ingredient.units]
            .filter(Boolean)
            .join(" ")
            .trim(),
    label: reference.matchText ?? reference.ingredient.ingredient,
  };
}

function StepDetailWithBoldIngredientReferences({
  text,
  references,
  numberFormat,
}: {
  text: string;
  references: IngredientStepReference[];
  numberFormat: NumberFormat;
}) {
  const inlineReferences = references.filter(
    (reference) => reference.start !== undefined && reference.end !== undefined
  );

  if (inlineReferences.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  inlineReferences.forEach((reference) => {
    const start = reference.start!;
    const end = reference.end!;
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <IngredientReferenceTooltip
        key={reference.key}
        reference={reference}
        text={text.slice(start, end)}
        numberFormat={numberFormat}
      />
    );
    cursor = end;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

function IngredientReferenceTooltip({
  reference,
  text,
  numberFormat,
}: {
  reference: IngredientStepReference;
  text: string;
  numberFormat: NumberFormat;
}) {
  const amount =
    reference.usage === "partial"
      ? "Partial amount"
      : [displayAmount(reference.ingredient.amount, numberFormat), reference.ingredient.units]
          .filter(Boolean)
          .join(" ")
          .trim() || "Amount not listed";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="cursor-help font-semibold text-stone-700 underline decoration-stone-300 decoration-dotted underline-offset-[3px] outline-none transition-colors hover:text-stone-900 focus-visible:text-stone-900 dark:text-stone-100 dark:decoration-stone-500 dark:hover:text-white dark:focus-visible:text-white"
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        hideArrow
        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:border-stone-600 dark:bg-stone-800 dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      >
        <span className="font-sans text-xs leading-none text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-stone-700 dark:text-stone-100">{amount}</span>{" "}
          {reference.ingredient.ingredient}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function StepDetailWithInlineIngredientReferences({
  text,
  references,
  inlineAmountColor,
  numberFormat,
}: {
  text: string;
  references: IngredientStepReference[];
  inlineAmountColor: string;
  numberFormat: NumberFormat;
}) {
  const inlineReferences = references.filter(
    (reference) => reference.start !== undefined && reference.end !== undefined
  );

  if (inlineReferences.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  inlineReferences.forEach((reference) => {
    const start = reference.start!;
    const end = reference.end!;
    const inlineStart = findInlineReferenceStart(text, reference, numberFormat);
    if (inlineStart < cursor) return;

    if (inlineStart > cursor) parts.push(text.slice(cursor, inlineStart));
    parts.push(
      <InlineIngredientReference
        key={reference.key}
        reference={reference}
        text={text.slice(start, end)}
        inlineAmountColor={inlineAmountColor}
        numberFormat={numberFormat}
      />
    );
    cursor = end;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

function findInlineReferenceStart(
  text: string,
  reference: IngredientStepReference,
  numberFormat: NumberFormat
) {
  const start = reference.start;
  if (start === undefined || reference.usage === "partial") return start ?? 0;

  const amount = [
    displayAmount(reference.ingredient.amount, numberFormat),
    reference.ingredient.units,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!amount) return start;

  const beforeMatch = text.slice(0, start);
  const amountPattern = escapeInlineRegExp(amount).replace(/\s+/g, "\\s+");
  const match = beforeMatch.match(new RegExp(`(?:^|\\s)(${amountPattern})\\s*$`, "i"));
  if (!match || match.index === undefined) return start;

  return match.index + match[0].indexOf(match[1]);
}

function escapeInlineRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function InlineIngredientReference({
  reference,
  text,
  inlineAmountColor,
  numberFormat,
}: {
  reference: IngredientStepReference;
  text: string;
  inlineAmountColor: string;
  numberFormat: NumberFormat;
}) {
  const amount =
    reference.usage === "partial"
      ? "partial"
      : [displayAmount(reference.ingredient.amount, numberFormat), reference.ingredient.units]
          .filter(Boolean)
          .join(" ")
          .trim();

  return (
    <span
      className="mx-0.5 inline-flex translate-y-[-1px] items-baseline gap-1 rounded-lg px-2 py-1 align-middle font-sans leading-none text-stone-500 dark:text-stone-400"
      style={{ backgroundColor: inlineAmountColor }}
      title={
        reference.usage === "partial"
          ? `${reference.ingredient.ingredient}: partial amount`
          : reference.ingredient.ingredient
      }
    >
      {amount && (
        <span className="text-[0.86em] font-semibold text-stone-700 dark:text-stone-100">
          {amount}
        </span>
      )}
      <span className="font-normal text-stone-500 dark:text-stone-400">{text}</span>
    </span>
  );
}
