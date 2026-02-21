"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: "running" | "paused" | "done";
}

function playTimerBeep() {
  try {
    const ctx = new AudioContext();
    [0, 0.2, 0.4].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  } catch {
    // Silent fail — audio not supported
  }
}

export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasTimers = timers.length > 0;

  // Tick: decrement running timers every second
  useEffect(() => {
    const hasRunning = timers.some((t) => t.status === "running");

    if (hasRunning && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimers((prev) =>
          prev.map((t) => {
            if (t.status !== "running") return t;
            const next = t.remainingSeconds - 1;
            if (next <= 0) {
              playTimerBeep();
              return { ...t, remainingSeconds: 0, status: "done" };
            }
            return { ...t, remainingSeconds: next };
          })
        );
      }, 1000);
    } else if (!hasRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timers]);

  const addTimer = useCallback((label: string, seconds: number) => {
    const timer: Timer = {
      id: crypto.randomUUID(),
      label,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      status: "running",
    };
    setTimers((prev) => [...prev, timer]);
  }, []);

  const pauseTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id && t.status === "running" ? { ...t, status: "paused" } : t))
    );
  }, []);

  const resumeTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id && t.status === "paused" ? { ...t, status: "running" } : t))
    );
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { timers, hasTimers, addTimer, pauseTimer, resumeTimer, removeTimer };
}
