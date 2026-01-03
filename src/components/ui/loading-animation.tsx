'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasCuisine, setHasCuisine] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animateProgressTo = (target: number, durationMs = 600) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const from = progress;
    const to = Math.max(0, Math.min(100, target));
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setProgress(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };


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

  // Manage step transitions and progress bar
  useEffect(() => {
    if (!isVisible) {
      // Reset when not visible
      setCurrentStepIdx(0);
      setProgress(0);
      setSteps(initialSteps);
      setHasCuisine(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    // If the parent passes real progress or a phase, reflect that instead of faking it.
    const hasExternal = typeof externalProgress === 'number' || typeof phase === 'string';

    if (hasExternal) {
      // Progress
      const nextProgress = typeof externalProgress === 'number' ? externalProgress : progress;
      animateProgressTo(nextProgress, 450);

      // Phase → step status
      const phaseToIdx = (p?: LoadingAnimationProps['phase']) => {
        if (p === 'gathering') return 0;
        if (p === 'reading') return 1;
        if (p === 'plating') return 2;
        if (p === 'done') return 2;
        return 0;
      };

      const idx = phaseToIdx(phase);
      setCurrentStepIdx(idx);
      setSteps(prev => prev.map((s, i) => {
        if (i < idx) return { ...s, status: 'completed' };
        if (i === idx) return { ...s, status: phase === 'done' ? 'completed' : 'in_progress' };
        return { ...s, status: 'pending' };
      }));

      return;
    }

    // Simulated fallback (only when the parent does not provide real progress/phase)
    setProgress(15);

    timerRef.current = setTimeout(() => {
      setCurrentStepIdx(1);
      animateProgressTo(45, 700);
      setSteps(prev => prev.map((s, i) => {
        if (i === 0) return { ...s, status: 'completed' };
        if (i === 1) return { ...s, status: 'in_progress' };
        return s;
      }));
    }, 2500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, externalProgress, phase]);

  // Reactive logic for when cuisine is detected (Parsing Complete)
  useEffect(() => {
    if (isVisible && cuisine && cuisine.length > 0 && !hasCuisine) {
      setHasCuisine(true);
      if (timerRef.current) clearTimeout(timerRef.current);

      // Fast forward to Step 3 with reveal
      setCurrentStepIdx(2);
      animateProgressTo(100, 700);
      setSteps(prev => prev.map((s, i) => {
        if (i === 0 || i === 1) return { ...s, status: 'completed' };
        if (i === 2) {
          const cuisineIcon = CUISINE_ICON_MAP[cuisine[0]] || s.icon;
          return { ...s, icon: cuisineIcon, status: 'completed' };
        }
        return s;
      }));
    }
  }, [cuisine, isVisible, hasCuisine]);

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
      {/* Dialog card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 pointer-events-auto">
        {/* Cancel Button - positioned in top-right corner */}
        {onCancel && (
          <motion.button
            onClick={handleCancel}
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
            aria-label="Cancel loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
        <div className="p-6 sm:p-8">
          <div className="w-full space-y-12">
            {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="loading-step-card space-y-2"
        >
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: step.status === 'pending' ? 0.3 : 1,
                x: 0 
              }}
              transition={{ delay: 0.6 + (idx * 0.15), duration: 0.5 }}
              className="step-row"
            >
              <div className="step-icon-container">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.icon}
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                    transition={{ duration: 0.4, ease: "backOut" }}
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
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
              transition={{ duration: 1, ease: "circOut" }}
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
