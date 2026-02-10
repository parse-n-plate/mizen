'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';

interface LoadingAnimationProps {
  isVisible: boolean;
  cuisine?: string[];
  /** 0–100. When provided, the component will reflect real progress instead of the simulated timer. */
  progress?: number;
  /** Optional coarse phase signal for step highlighting. */
  phase?: 'gathering' | 'reading' | 'plating' | 'done';
  /** Optional callback function called when user clicks the cancel button */
  onCancel?: () => void;
}

type StepStatus = 'pending' | 'in_progress' | 'completed';

interface LoadingStep {
  title: string;
  subtitle: string;
  icon: string;
  status: StepStatus;
}

export default function LoadingAnimation({ isVisible, cuisine, progress: externalProgress, phase, onCancel }: LoadingAnimationProps) {
  const [_currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasCuisine, setHasCuisine] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  const rafRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0); // Track current progress for animation

  // Accessibility: respect user's reduced motion preference
  const shouldReduceMotion = useReducedMotion();

  const animateProgressTo = useCallback((target: number, durationMs = 600) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Use ref to get current progress value (avoids stale closure issues)
    const from = progressRef.current;
    const to = Math.max(0, Math.min(100, target));
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      progressRef.current = next; // Update ref
      setProgress(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);


  // Define the 3 steps
  const initialSteps: LoadingStep[] = [
    {
      title: 'Gathering Resources',
      subtitle: 'Collecting ingredients and preparing workspace',
      icon: '/assets/Illustration Icons/Tomato_Icon.png',
      status: 'in_progress',
    },
    {
      title: 'Reading the Recipe',
      subtitle: 'Analyzing instructions and cooking times',
      icon: '/assets/Illustration Icons/Pan_Icon.png',
      status: 'pending',
    },
    {
      title: 'Plating',
      subtitle: 'Final touches and presentation',
      icon: '/assets/cusineIcons/Mexican_Icon.png', // Placeholder (Taco)
      status: 'pending',
    },
  ];

  const [steps, setSteps] = useState<LoadingStep[]>(initialSteps);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync progressRef and cleanup timers/animations via effects
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!isVisible) {
      progressRef.current = 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [isVisible]);

  // Manage step transitions and progress bar
  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIdx(0);
      setProgress(0);
      progressRef.current = 0;
      setSteps(initialSteps);
      setHasCuisine(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const hasExternal = typeof externalProgress === 'number' || typeof phase === 'string';
    if (hasExternal) {
      const nextProgress =
        typeof externalProgress === 'number' ? externalProgress : progressRef.current;
      progressRef.current = nextProgress;
      animateProgressTo(nextProgress, 450);

      const phaseToIdx = (p?: LoadingAnimationProps['phase']) => {
        if (p === 'gathering') return 0;
        if (p === 'reading') return 1;
        if (p === 'plating') return 2;
        if (p === 'done') return 2;
        return 0;
      };

      const idx = phaseToIdx(phase);
      setCurrentStepIdx(idx);
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i < idx) return { ...s, status: 'completed' };
          if (i === idx) {
            return {
              ...s,
              status: phase === 'done' ? 'completed' : 'in_progress',
            };
          }
          return { ...s, status: 'pending' };
        }),
      );
      return;
    }

    progressRef.current = 15;
    setProgress(15);

    timerRef.current = setTimeout(() => {
      setCurrentStepIdx(1);
      animateProgressTo(45, 700);
      setSteps(prev => prev.map((s, i) => {
        if (i === 0) return { ...s, status: 'completed' };
        if (i === 1) return { ...s, status: 'in_progress' };
        return s;
      }));
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, externalProgress, phase, animateProgressTo]);

  // Reactive logic for when cuisine is detected (Parsing Complete)
  useEffect(() => {
    if (isVisible && cuisine && cuisine.length > 0 && !hasCuisine) {
      setHasCuisine(true);
      if (timerRef.current) clearTimeout(timerRef.current);

      setCurrentStepIdx(2);
      progressRef.current = progress;
      animateProgressTo(100, 700);
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i === 0 || i === 1) return { ...s, status: 'completed' };
          if (i === 2) {
            const cuisineIcon = CUISINE_ICON_MAP[cuisine[0]] || s.icon;
            return { ...s, icon: cuisineIcon, status: 'completed' };
          }
          return s;
        }),
      );
    }
  }, [cuisine, isVisible, hasCuisine, progress, animateProgressTo]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!isVisible) return null;
  if (!mounted) return null;

  // Handle cancel button click
  const handleCancel = () => {
    // Clean up any running timers or animations
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    // Call the onCancel callback if provided
    if (onCancel) {
      onCancel();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 pointer-events-none">
      {/* Blurred background backdrop */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-0 bg-white/60 backdrop-blur-sm pointer-events-none"
        aria-hidden="true"
      />
      {/* Dialog card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 pointer-events-auto">
        {/* Cancel Button - positioned in top-right corner */}
        {onCancel && (
          <motion.button
            onClick={handleCancel}
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
            aria-label="Cancel loading"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.15, duration: shouldReduceMotion ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
        <div className="p-6 sm:p-8">
          <div className="w-full space-y-12">
            {/* Header Section */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center space-y-3"
        >
          <h1 className="font-domine text-[32px] md:text-[40px] text-[#0C0A09] font-bold tracking-tight">
            Recipe in Progress
          </h1>
          <p className="font-albert text-[16px] md:text-[18px] text-stone-500 font-medium">
            Follow along as we prepare your request
          </p>
        </motion.div>

        {/* Step Card Section */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.1, duration: shouldReduceMotion ? 0 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="loading-step-card space-y-2"
        >
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{
                opacity: step.status === 'pending' ? 0.3 : 1,
                x: 0
              }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.15 + (idx * 0.05), duration: shouldReduceMotion ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="step-row"
            >
              <div className="step-icon-container">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.icon}
                    initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative w-10 h-10"
                  >
                    <Image
                      src={step.icon}
                      alt={step.title}
                      fill
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="step-text">
                <span className={`step-title font-albert ${step.status === 'in_progress' || step.status === 'completed' ? 'text-black font-semibold' : 'text-stone-500'}`}>
                  {step.title}
                </span>
                <span className="step-subtitle font-albert text-stone-400">
                  {step.subtitle}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Bar Section */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: shouldReduceMotion ? 0 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-4"
        >
          <div className="flex justify-between items-end">
            <span className="font-albert text-[14px] text-stone-500 font-semibold tracking-wide uppercase">
              Progress
            </span>
            <span className="font-albert text-[14px] text-stone-500 font-medium tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="loading-progress-container">
            <motion.div
              className="loading-progress-bar"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.075, 0.82, 0.165, 1] }}
            />
          </div>
        </motion.div>
          </div>  
        </div>
      </div>
    </div>,
    document.body
  );
}
