"use client";

import { useState } from "react";
import type { Timer } from "@/hooks/useTimers";

interface TimerVaultProps {
  timers: Timer[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string, seconds: number) => void;
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimerVault({ timers, onPause, onResume, onRemove, onAdd }: TimerVaultProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newMinutes, setNewMinutes] = useState("");

  const handleAdd = () => {
    const mins = parseFloat(newMinutes);
    if (!mins || mins <= 0) return;
    onAdd(newLabel.trim() || `${mins} min`, Math.round(mins * 60));
    setNewLabel("");
    setNewMinutes("");
    setAddOpen(false);
  };

  return (
    <div className="fixed bottom-[52px] left-0 right-0 z-30 vault-animate pb-[env(safe-area-inset-bottom)]">
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-lg border-t border-stone-200 dark:border-stone-700">
        <div className="max-w-3xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {timers.map((timer) => (
              <TimerChip
                key={timer.id}
                timer={timer}
                onPause={() => onPause(timer.id)}
                onResume={() => onResume(timer.id)}
                onRemove={() => onRemove(timer.id)}
              />
            ))}

            {/* Add timer button */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setAddOpen(!addOpen)}
                className="press-scale flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                aria-label="Add timer"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              {addOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setAddOpen(false)} />
                  <div className="popover-animate absolute bottom-full left-0 z-40 mb-2 w-56 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 shadow-lg shadow-stone-200/50 dark:shadow-black/30"
                    style={{ transformOrigin: "bottom left" }}
                  >
                    <p className="mb-2 font-sans text-xs font-medium text-stone-700 dark:text-stone-200">
                      Add timer
                    </p>
                    <input
                      type="text"
                      placeholder="Label (optional)"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="mb-1.5 w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 font-sans text-xs text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-[var(--color-blue)]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Minutes"
                        min="0.5"
                        step="0.5"
                        value={newMinutes}
                        onChange={(e) => setNewMinutes(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        className="flex-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 font-sans text-xs text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-[var(--color-blue)]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={handleAdd}
                        disabled={!newMinutes || parseFloat(newMinutes) <= 0}
                        className="rounded-lg bg-[var(--color-blue)] px-3 py-1.5 font-sans text-xs font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimerChip({
  timer,
  onPause,
  onResume,
  onRemove,
}: {
  timer: Timer;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
}) {
  const isDone = timer.status === "done";
  const isPaused = timer.status === "paused";

  return (
    <div
      className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs transition-colors ${
        isDone
          ? "timer-done-pulse border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
          : isPaused
            ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
            : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
      }`}
    >
      {/* Label */}
      <span className="max-w-[80px] truncate font-medium">{timer.label}</span>

      {/* Countdown */}
      <span className="font-mono tabular-nums">
        {isDone ? "Done" : formatCountdown(timer.remainingSeconds)}
      </span>

      {/* Pause/Play */}
      {!isDone && (
        <button
          onClick={isPaused ? onResume : onPause}
          className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          aria-label={isPaused ? "Resume timer" : "Pause timer"}
        >
          {isPaused ? (
            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </button>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
        aria-label="Remove timer"
      >
        <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
