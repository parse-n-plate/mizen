"use client";

import { useState } from "react";
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field";
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputScrubArea,
} from "@ui-sdk/react/number-input";
import MinusCircle from "@solar-icons/react/csr/ui/MinusCircle";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;
const TICK_SPACING = 12;
const TICKS = Array.from(
  { length: MAX_SERVINGS - MIN_SERVINGS + 1 },
  (_, index) => MIN_SERVINGS + index
);

interface ServingsRulerInputProps {
  originalServings: number;
  onServingsCommit?: (servings: number) => void;
}

export function ServingsRulerInput({
  originalServings,
  onServingsCommit,
}: ServingsRulerInputProps) {
  const [servings, setServings] = useState<number | null>(originalServings);
  const shown = servings ?? originalServings;
  const scale = shown / originalServings;

  return (
    <Field className="flex w-full max-w-sm flex-col gap-3">
      <NumberInput
        value={servings}
        onValueChange={(next) => setServings(next)}
        onValueCommit={(next) => {
          if (next != null) onServingsCommit?.(next);
        }}
        min={MIN_SERVINGS}
        max={MAX_SERVINGS}
        largeStep={5}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-4">
          <FieldLabel className="font-sans text-sm font-medium text-stone-900">Servings</FieldLabel>
          <NumberInputGroup className="flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 focus-within:border-stone-900">
            <NumberInputDecrement
              aria-label="Fewer servings"
              className="flex size-8 items-center justify-center rounded-full text-stone-700 transition-none hover:bg-stone-100 data-disabled:opacity-40 data-disabled:hover:bg-transparent"
            >
              <MinusCircle aria-hidden="true" className="size-5" />
            </NumberInputDecrement>
            <NumberInputControl className="w-10 bg-transparent text-center font-sans text-base tabular-nums text-stone-900 outline-none" />
            <NumberInputIncrement
              aria-label="More servings"
              className="flex size-8 items-center justify-center rounded-full text-stone-700 transition-none hover:bg-stone-100 data-disabled:opacity-40 data-disabled:hover:bg-transparent"
            >
              <AddCircle aria-hidden="true" className="size-5" />
            </NumberInputIncrement>
          </NumberInputGroup>
        </div>

        <NumberInputScrubArea
          pixelsPerStep={TICK_SPACING}
          className="relative h-12 cursor-ew-resize touch-none overflow-hidden rounded-xl bg-stone-100 select-none data-scrubbing:bg-stone-200"
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 flex items-end gap-[12px] pb-2"
            style={{
              transform: `translateX(${-(shown - MIN_SERVINGS) * TICK_SPACING}px)`,
            }}
          >
            {TICKS.map((tick) => (
              <span
                key={tick}
                className={
                  tick === originalServings
                    ? "-mx-px h-5 w-0.5 bg-mizen-blue"
                    : tick % 5 === 0
                      ? "-mr-px h-4 w-px bg-stone-400"
                      : "-mr-px h-2 w-px bg-stone-400"
                }
              />
            ))}
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 left-1/2 h-3 w-0.5 -translate-x-1/2 rounded-full bg-stone-900"
          />
        </NumberInputScrubArea>
      </NumberInput>
      <FieldDescription className="text-sm text-stone-600">
        {scale === 1
          ? `Original recipe makes ${originalServings}.`
          : `Ingredients scale ×${scale.toFixed(2).replace(/\.?0+$/, "")} from ${originalServings}.`}
      </FieldDescription>
    </Field>
  );
}
