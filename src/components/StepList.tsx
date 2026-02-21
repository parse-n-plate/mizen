"use client";

import { useState } from "react";
import type { InstructionStep, TimeMarker } from "@/lib/types";

interface StepListProps {
  steps: InstructionStep[];
  onStartTimer?: (label: string, seconds: number) => void;
}

export function StepList({ steps, onStartTimer }: StepListProps) {
  return (
    <div>
      {steps.map((step, i) => (
        <StepRow
          key={i}
          step={step}
          index={i}
          isLast={i === steps.length - 1}
          onStartTimer={onStartTimer}
        />
      ))}
    </div>
  );
}

/** Regex fallback: detect time durations in text when the LLM didn't provide timers. */
function detectTimers(detail: string): TimeMarker[] {
  const pattern = /\b(\d+(?:\s*[-–to]+\s*\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/gi;
  const markers: TimeMarker[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(detail)) !== null) {
    const text = match[0];
    const numPart = match[1];
    const unit = match[2].toLowerCase();

    // Parse the number — for ranges like "5-10", use the higher value
    const nums = numPart.split(/\s*[-–to]+\s*/).map(Number).filter(n => !isNaN(n) && n > 0);
    if (nums.length === 0) continue;
    const value = Math.max(...nums);

    let seconds: number;
    if (unit.startsWith("h")) {
      seconds = value * 3600;
    } else if (unit.startsWith("m")) {
      seconds = value * 60;
    } else {
      seconds = value;
    }

    markers.push({ text, seconds });
  }

  return markers;
}

/** Split detail text on timer markers, returning interlaced plain/timer segments. */
function renderDetailWithTimers(
  detail: string,
  timers: TimeMarker[] | undefined,
  onStartTimer: ((label: string, seconds: number) => void) | undefined,
) {
  if (!onStartTimer) return detail;

  // Use LLM-provided timers, or fall back to regex detection
  const resolvedTimers = (timers && timers.length > 0) ? timers : detectTimers(detail);
  if (resolvedTimers.length === 0) return detail;

  // Build segments by finding each timer.text in the detail string
  const segments: { text: string; timer?: TimeMarker }[] = [];
  let remaining = detail;

  // Sort timers by their position in the string (first occurrence)
  const sorted = [...resolvedTimers].sort((a, b) => {
    const posA = detail.indexOf(a.text);
    const posB = detail.indexOf(b.text);
    return posA - posB;
  });

  for (const timer of sorted) {
    const idx = remaining.indexOf(timer.text);
    if (idx === -1) continue;

    if (idx > 0) {
      segments.push({ text: remaining.slice(0, idx) });
    }
    segments.push({ text: timer.text, timer });
    remaining = remaining.slice(idx + timer.text.length);
  }

  if (remaining) {
    segments.push({ text: remaining });
  }

  if (segments.length === 0) return detail;

  return segments.map((seg, i) =>
    seg.timer ? (
      <button
        key={i}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStartTimer(seg.timer!.text, seg.timer!.seconds);
        }}
        className="inline underline decoration-dotted decoration-[var(--color-blue)] underline-offset-2 text-[var(--color-blue)] dark:text-blue-400 hover:decoration-solid transition-colors"
      >
        {seg.text}
      </button>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

function StepRow({
  step,
  index,
  isLast,
  onStartTimer,
}: {
  step: InstructionStep;
  index: number;
  isLast: boolean;
  onStartTimer?: (label: string, seconds: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasImage = step.imageUrl && !imgError;

  return (
    <div
      className={`flex gap-4 py-4 group ${!isLast ? "border-b border-stone-100 dark:border-stone-800" : ""}`}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {step.title && (
          <h4 className="font-sans text-sm font-semibold text-stone-900 dark:text-stone-100">
            {step.title}
          </h4>
        )}
        <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {renderDetailWithTimers(step.detail, step.timers, onStartTimer)}
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
                <img
                  src={step.imageUrl}
                  alt={`Step ${index + 1}`}
                  className="rounded-lg max-w-full max-h-80 object-contain border border-stone-200 dark:border-stone-700 cursor-pointer"
                  onError={() => setExpanded(false)}
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
          <img
            src={step.imageUrl}
            alt=""
            className={`h-10 w-10 rounded-lg object-cover border transition-colors ${
              expanded
                ? "border-stone-400 dark:border-stone-500"
                : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
            }`}
            onError={() => setImgError(true)}
          />
        </button>
      )}
    </div>
  );
}
