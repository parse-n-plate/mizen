import { useState, useRef, useCallback, useEffect } from "react";

type TimerStatus = "idle" | "running" | "paused" | "done";

export function useTimer(durationSeconds: number) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        gain2.gain.value = 0.3;
        osc2.start();
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.3);
      }, 350);
    } catch {
      // Silently fail if Web Audio API is unavailable
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTick();
          setStatus("done");
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTick, playBeep]);

  const start = useCallback(() => {
    setRemaining(durationSeconds);
    setStatus("running");
    startTick();
  }, [durationSeconds, startTick]);

  const pause = useCallback(() => {
    clearTick();
    setStatus("paused");
  }, [clearTick]);

  const resume = useCallback(() => {
    setStatus("running");
    startTick();
  }, [startTick]);

  const reset = useCallback(() => {
    clearTick();
    setRemaining(durationSeconds);
    setStatus("idle");
  }, [durationSeconds, clearTick]);

  useEffect(() => clearTick, [clearTick]);

  return { remaining, status, start, pause, resume, reset };
}
