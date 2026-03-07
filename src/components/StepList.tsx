"use client";

import { useState } from "react";
import Image from "next/image";
import type { InstructionStep } from "@/lib/types";

interface StepListProps {
  steps: InstructionStep[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <div>
      {steps.map((step, i) => (
        <StepRow key={i} step={step} index={i} isLast={i === steps.length - 1} />
      ))}
    </div>
  );
}

function StepRow({
  step,
  index,
  isLast,
}: {
  step: InstructionStep;
  index: number;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasImage = step.imageUrl && !imgError;

  return (
    <div className="relative flex gap-4 py-4 px-2 rounded-lg group hover:bg-[var(--color-cream)]">
      {!isLast && (
        <div className="step-list-divider absolute bottom-0 left-2 right-2 h-px bg-stone-100 dark:bg-stone-800 transition-opacity duration-150 group-hover:opacity-0" />
      )}
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {step.title && (
          <h4 className="font-sans text-body-md-sm font-medium text-heading">{step.title}</h4>
        )}
        <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-300">
          {step.detail}
        </p>
        {step.tips && (
          <p className="font-sans text-xs italic text-stone-400 dark:text-stone-500">
            Tip: {step.tips}
          </p>
        )}

        {/* Expanded image */}
        {hasImage && (
          <div
            className="step-image-reveal"
            data-open={expanded ? "true" : "false"}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
          >
            <div>
              <div className="pt-2">
                <Image
                  src={step.imageUrl!}
                  alt={`Step ${index + 1}`}
                  width={400}
                  height={320}
                  className="rounded-lg max-w-full max-h-80 object-contain border border-stone-200 dark:border-stone-700 cursor-pointer"
                  onError={() => setExpanded(false)}
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step image thumbnail */}
      {hasImage && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="flex-shrink-0 pt-0.5 cursor-pointer"
          aria-label={expanded ? "Hide step photo" : "Show step photo"}
        >
          <Image
            src={step.imageUrl!}
            alt=""
            width={40}
            height={40}
            className={`h-10 w-10 rounded-lg object-cover border transition-colors ${
              expanded
                ? "border-stone-400 dark:border-stone-500"
                : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
            }`}
            onError={() => setImgError(true)}
            unoptimized
          />
        </button>
      )}
    </div>
  );
}
