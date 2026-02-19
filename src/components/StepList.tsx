import type { InstructionStep } from "@/lib/types";

interface StepListProps {
  steps: InstructionStep[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex gap-4 border-b border-stone-100 py-5 last:border-b-0"
        >
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 font-sans text-xs font-medium text-white">
            {i + 1}
          </div>
          <div className="flex-1 space-y-1.5">
            <h4 className="font-sans text-sm font-semibold text-stone-900">
              {step.title}
            </h4>
            <p className="font-sans text-sm leading-relaxed text-stone-600">
              {step.detail}
            </p>
            {step.tips && (
              <p className="font-sans text-xs italic text-stone-400">
                Tip: {step.tips}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
