"use client";

import { useState } from "react";
import type { InstructionStep } from "@/lib/types";

interface StepListProps {
  steps: InstructionStep[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <div>
      {steps.map((step, i) => (
        <StepRow key={i} step={step} index={i} />
      ))}
    </div>
  );
}

function StepRow({ step, index }: { step: InstructionStep; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasImage = step.imageUrl && !imgError;

  return (
    <div className="py-5 border-b border-stone-100 last:border-0 rounded-lg px-2 -mx-2 hover:bg-[#FAFAF9] transition-colors duration-200">
      <div className="flex gap-4 group">
        <div className="flex-shrink-0 pt-0.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-600 text-xs font-bold font-sans">
            {index + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {step.title && (
            <h4 className="font-sans text-sm font-semibold text-stone-900">
              {step.title}
            </h4>
          )}
          <p className="font-sans text-sm leading-relaxed text-stone-600">
            {step.detail}
          </p>
          {step.tips && (
            <p className="font-sans text-xs italic text-stone-400">
              Tip: {step.tips}
            </p>
          )}
        </div>
        {hasImage && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 mt-0.5 cursor-pointer"
            aria-label={expanded ? "Hide step photo" : "Show step photo"}
          >
            <img
              src={step.imageUrl}
              alt=""
              className={`h-10 w-10 rounded-lg object-cover border transition-colors ${
                expanded
                  ? "border-stone-400"
                  : "border-stone-200 hover:border-stone-300"
              }`}
              onError={() => setImgError(true)}
            />
          </button>
        )}
      </div>

      {expanded && hasImage && (
        <div className="mt-3 ml-11">
          <img
            src={step.imageUrl}
            alt={`Step ${index + 1}`}
            className="rounded-lg max-w-full max-h-80 object-contain border border-stone-200"
            onError={() => setExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}
