"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Lightbulb from "@solar-icons/react/csr/devices/Lightbulb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { IngredientGroup, InstructionStep } from "@/lib/types";
import { type NumberFormat, getNumberFormat } from "@/lib/numberFormat";
import { subscribePreferences, getShowStepImages } from "@/lib/preferences";
import {
  matchIngredientReferences,
  type IngredientStepReference,
} from "@/lib/ingredient-step-references";
import { displayAmount, displayText } from "@/utils/ingredientScaler";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useIsMobile } from "@/hooks/useIsMobile";

const ingredientReferenceDetailsEnabled =
  process.env.NEXT_PUBLIC_INGREDIENT_REFERENCE_DETAILS_ENABLED === "true";

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
}

export function StepList({ steps, ingredientGroups }: StepListProps) {
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
          ingredientGroups={ingredientGroups}
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
  ingredientGroups,
  numberFormat,
  onImageClick,
  showImages,
}: {
  step: InstructionStep;
  index: number;
  ingredientGroups?: IngredientGroup[];
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
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientStepReference | null>(
    null
  );
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
              <span className="tabular-nums">{index + 1}.</span> {step.title}
            </h4>
          )}
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-300">
            <StepDetailWithInlineIngredientReferences
              text={detailText}
              references={ingredientReferences}
              numberFormat={numberFormat}
              onSelectIngredient={
                ingredientReferenceDetailsEnabled ? setSelectedIngredient : undefined
              }
            />
          </p>
          {ingredientReferences.some((reference) => reference.start === undefined) && (
            <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Ingredients in this step">
              {ingredientReferences
                .filter((reference) => reference.start === undefined)
                .map((reference) => (
                  <IngredientReferenceHit
                    key={reference.key}
                    reference={reference}
                    numberFormat={numberFormat}
                    onSelect={ingredientReferenceDetailsEnabled ? setSelectedIngredient : undefined}
                  />
                ))}
            </div>
          )}
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
              className="step-image-reveal-inner mt-6"
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
              className="step-image-reveal-inner mt-6 cursor-zoom-in"
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

      {ingredientReferenceDetailsEnabled && (
        <IngredientReferenceDetails
          reference={selectedIngredient}
          step={step}
          stepNumber={index + 1}
          numberFormat={numberFormat}
          onOpenChange={(open) => {
            if (!open) setSelectedIngredient(null);
          }}
        />
      )}
    </div>
  );
}

function IngredientReferenceHit({
  reference,
  numberFormat,
  onSelect,
}: {
  reference: IngredientStepReference;
  numberFormat: NumberFormat;
  onSelect?: (reference: IngredientStepReference) => void;
}) {
  const { amount, label } = getIngredientReferenceDisplay(reference, numberFormat);

  if (!onSelect) {
    return <IngredientReferencePill leadingText={amount} label={label} />;
  }

  return (
    <IngredientReferencePill
      as="button"
      type="button"
      onClick={() => onSelect(reference)}
      title={
        reference.usage === "partial"
          ? `${reference.ingredient.ingredient}: partial amount`
          : reference.ingredient.ingredient
      }
      leadingText={amount}
      label={label}
    />
  );
}

function IngredientReferencePill({
  as = "span",
  leadingText,
  label,
  className = "",
  ...props
}: {
  as?: "button" | "span";
  leadingText?: string;
  label: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.HTMLAttributes<HTMLSpanElement>) {
  const Component = as;
  const interactiveClasses =
    as === "button"
      ? "press-scale transition-colors hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-stone-700"
      : "";

  return (
    <Component
      className={`inline-flex max-w-full items-baseline gap-1 rounded-lg bg-stone-100 px-2.5 py-1.5 font-sans text-[14px] leading-none text-stone-500 dark:bg-stone-800 dark:text-stone-400 ${interactiveClasses} ${className}`}
      {...props}
    >
      {leadingText && (
        <span className="font-medium text-stone-700 dark:text-stone-100">{leadingText}</span>
      )}
      <span className="truncate">{label}</span>
    </Component>
  );
}

function IngredientReferenceDetails({
  reference,
  step,
  stepNumber,
  numberFormat,
  onOpenChange,
}: {
  reference: IngredientStepReference | null;
  step: InstructionStep;
  stepNumber: number;
  numberFormat: NumberFormat;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const open = Boolean(reference);
  const title = reference?.ingredient.ingredient ?? "Ingredient";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          aria-describedby={undefined}
          className="max-h-[88vh] overflow-hidden rounded-t-[24px] bg-white p-0 dark:bg-stone-950"
        >
          <DrawerTitle className="sr-only capitalize">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Ingredient amount and recipe details
          </DrawerDescription>
          {reference && (
            <IngredientReferenceDetailsBody
              reference={reference}
              step={step}
              stepNumber={stepNumber}
              numberFormat={numberFormat}
            />
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[500px] overflow-hidden rounded-[24px] border-transparent bg-white p-0 shadow-[0_24px_70px_rgba(44,42,37,0.18)] dark:border-stone-800 dark:bg-stone-950">
        <DialogTitle className="sr-only capitalize">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Ingredient amount and recipe details
        </DialogDescription>
        {reference && (
          <IngredientReferenceDetailsBody
            reference={reference}
            step={step}
            stepNumber={stepNumber}
            numberFormat={numberFormat}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function IngredientReferenceDetailsBody({
  reference,
  step,
  stepNumber,
  numberFormat,
}: {
  reference: IngredientStepReference;
  step: InstructionStep;
  stepNumber: number;
  numberFormat: NumberFormat;
}) {
  const recipeAmount = formatIngredientAmount(reference, numberFormat);
  const matchedText = reference.matchText ?? reference.ingredient.ingredient;
  const name = reference.ingredient.ingredient;
  const description = buildIngredientDescription({
    name,
    matchedText,
    recipeAmount,
    usage: reference.usage,
  });
  const note = reference.ingredient.description;
  const substitutes = reference.ingredient.substitutions ?? [];
  const stepAmount = getStepAmountLabel(reference, recipeAmount);

  return (
    <div className="max-h-[calc(100vh-2rem)] overflow-y-auto px-6 pb-8 pt-7 font-sans sm:px-8 sm:pb-9 sm:pt-8">
      <h2 className="font-serif text-[30px] font-bold leading-tight text-stone-800 dark:text-stone-100 sm:text-[34px]">
        {toTitleCase(name)}
      </h2>

      <dl className="mt-6 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-800 dark:bg-stone-900">
          <dt className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Recipe amount
          </dt>
          <dd className="mt-1 font-sans text-[15px] font-semibold leading-5 text-stone-800 dark:text-stone-100">
            {recipeAmount || "Not listed"}
          </dd>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-800 dark:bg-stone-900">
          <dt className="font-sans text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            This step
          </dt>
          <dd className="mt-1 font-sans text-[15px] font-semibold leading-5 text-stone-800 dark:text-stone-100">
            {stepAmount}
          </dd>
        </div>
      </dl>

      <p className="mt-6 max-w-[360px] font-sans text-[15px] leading-6 text-stone-600 dark:text-stone-300">
        {description}
      </p>

      {substitutes.length ? (
        <section className="mt-7">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Substitute
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {substitutes.map((item) => (
              <Card
                key={item}
                className="gap-0 rounded-lg border-stone-200 bg-white py-0 shadow-none dark:border-stone-800 dark:bg-stone-900"
              >
                <CardContent className="px-3 py-3">
                  <p className="font-sans text-[14px] font-semibold leading-5 text-stone-800 dark:text-stone-100">
                    {item}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-7">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Used in
        </h3>
        {note ? (
          <p className="mt-3 max-w-[390px] font-sans text-[15px] leading-6 text-stone-600 dark:text-stone-300">
            {note}
          </p>
        ) : null}
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <IngredientReferencePill
          leadingText={`Step ${stepNumber}:`}
          label={step.title || matchedText}
        />
      </div>

      {reference.ingredient.alerts?.length ? (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {reference.ingredient.alerts.map((alert) => (
            <Badge key={alert} variant="secondary" className="font-sans text-[12px]">
              {alert}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getStepAmountLabel(reference: IngredientStepReference, recipeAmount: string) {
  if (reference.usage === "partial") {
    return recipeAmount ? `Partial of ${recipeAmount}` : "Partial amount";
  }

  return recipeAmount || "Full amount";
}

function buildIngredientDescription({
  name,
  matchedText,
  recipeAmount,
  usage,
}: {
  name: string;
  matchedText: string;
  recipeAmount: string;
  usage: IngredientStepReference["usage"];
}) {
  const amount = recipeAmount || "an unlisted amount";
  const stepUse = usage === "partial" ? "uses part of that amount" : "uses the listed amount";

  return `This recipe lists ${amount} of ${name}. This step references it as ${matchedText.toLowerCase()} and ${stepUse}.`;
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

function formatIngredientAmount(reference: IngredientStepReference, numberFormat: NumberFormat) {
  return [displayAmount(reference.ingredient.amount, numberFormat), reference.ingredient.units]
    .filter(Boolean)
    .join(" ")
    .trim();
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

function StepDetailWithInlineIngredientReferences({
  text,
  references,
  numberFormat,
  onSelectIngredient,
}: {
  text: string;
  references: IngredientStepReference[];
  numberFormat: NumberFormat;
  onSelectIngredient?: (reference: IngredientStepReference) => void;
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
        numberFormat={numberFormat}
        onSelect={onSelectIngredient}
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
  numberFormat,
  onSelect,
}: {
  reference: IngredientStepReference;
  text: string;
  numberFormat: NumberFormat;
  onSelect?: (reference: IngredientStepReference) => void;
}) {
  const amount =
    reference.usage === "partial"
      ? "partial"
      : [displayAmount(reference.ingredient.amount, numberFormat), reference.ingredient.units]
          .filter(Boolean)
          .join(" ")
          .trim();

  const contents = (
    <>
      {amount && (
        <span className="text-[0.86em] font-semibold text-stone-700 dark:text-stone-100">
          {amount}
        </span>
      )}
      <span className="font-normal text-stone-500 dark:text-stone-400">{text}</span>
    </>
  );

  if (!onSelect) {
    return (
      <span className="mx-px inline-flex translate-y-[-1px] items-baseline gap-1 rounded-lg bg-stone-100 px-2 py-1 align-middle font-sans leading-none text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        {contents}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(reference)}
      className="press-scale mx-px inline-flex translate-y-[-1px] items-baseline gap-1 rounded-lg bg-stone-100 px-2 py-1 align-middle font-sans leading-none text-stone-500 transition-colors hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
      title={
        reference.usage === "partial"
          ? `${reference.ingredient.ingredient}: partial amount`
          : reference.ingredient.ingredient
      }
    >
      {contents}
    </button>
  );
}
