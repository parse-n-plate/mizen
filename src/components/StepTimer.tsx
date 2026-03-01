"use client";

import { useTimer } from "@/hooks/useTimer";
import type { TimeMarker } from "@/lib/types";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function StepTimer({ timer }: { timer: TimeMarker }) {
  const { remaining, status, start, pause, resume, reset } = useTimer(
    timer.seconds
  );

  if (status === "idle") {
    return (
      <button
        onClick={start}
        className="vault-animate inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1 text-xs font-sans text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600 hover:text-stone-700 dark:hover:text-stone-300 transition-colors press-scale"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21" />
        </svg>
        {timer.text}
      </button>
    );
  }

  if (status === "running") {
    return (
      <button
        onClick={pause}
        className="vault-animate inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-xs font-sans font-medium text-[var(--color-blue)] dark:text-blue-400 transition-colors press-scale"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        {formatTimer(remaining)}
      </button>
    );
  }

  if (status === "paused") {
    return (
      <span className="vault-animate inline-flex items-center gap-1">
        <button
          onClick={resume}
          className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-2.5 py-1 text-xs font-sans font-medium text-orange-600 dark:text-orange-400 transition-colors press-scale"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          {formatTimer(remaining)}
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center h-6 w-6 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors press-scale"
          title="Reset"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </span>
    );
  }

  // done
  return (
    <span className="vault-animate inline-flex items-center gap-1">
      <span className="timer-done-pulse inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 text-xs font-sans font-medium text-emerald-600 dark:text-emerald-400">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Done!
      </span>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center h-6 w-6 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors press-scale"
        title="Reset"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </span>
  );
}
