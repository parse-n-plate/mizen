"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/** Detect coarse pointer (touch) to skip hover animations that cause false positives */
const hoverQuery =
  typeof window !== "undefined" ? window.matchMedia("(hover: hover) and (pointer: fine)") : null;

function subscribeToHoverQuery(callback: () => void) {
  hoverQuery?.addEventListener("change", callback);
  return () => hoverQuery?.removeEventListener("change", callback);
}

function getCanHover() {
  return hoverQuery?.matches ?? true;
}

function getCanHoverServer() {
  return true;
}

function useCanHover() {
  return useSyncExternalStore(subscribeToHoverQuery, getCanHover, getCanHoverServer);
}

interface HeartButtonProps {
  isFavorite: boolean;
  saving: boolean;
  unsaving: boolean;
  onSave: () => void;
  onUnsave: () => void;
  /** Pin the drawn heart to the control's trailing edge (recipe title row). */
  iconAlign?: "center" | "end";
}

const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

let particleIdCounter = 0;

function generateParticles(): Particle[] {
  return Array.from({ length: 7 }, () => {
    const angle = Math.random() * Math.PI - Math.PI / 2; // -90° to 90° (upward fan)
    const distance = 20 + Math.random() * 25;
    return {
      id: ++particleIdCounter,
      x: Math.cos(angle) * distance * (0.7 + Math.random() * 0.6),
      y: -Math.abs(Math.sin(angle) * distance) - 8,
      rotation: (Math.random() - 0.5) * 60,
      scale: 0.4 + Math.random() * 0.5,
    };
  });
}

export function HeartButton({
  isFavorite,
  saving,
  unsaving,
  onSave,
  onUnsave,
  iconAlign = "center",
}: HeartButtonProps) {
  const iconAtEnd = iconAlign === "end";
  const shouldReduceMotion = useReducedMotion();
  const canHover = useCanHover();
  const prevSavedRef = useRef(isFavorite);
  const hasMountedRef = useRef(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [breaking, setBreaking] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevSavedRef.current = isFavorite;
      return;
    }

    const wasSaved = prevSavedRef.current;
    prevSavedRef.current = isFavorite;

    if (shouldReduceMotion) return;

    // Save: false → true → particle burst
    if (!wasSaved && isFavorite) {
      setJustSaved(true); // eslint-disable-line react-hooks/set-state-in-effect -- animation reaction to prop change
      setParticles(generateParticles());
      const t = setTimeout(() => {
        setParticles([]);
        setJustSaved(false);
      }, 800);
      return () => clearTimeout(t);
    }

    // Unsave: true → false → heart break
    if (wasSaved && !isFavorite) {
      setBreaking(true);
      const t = setTimeout(() => setBreaking(false), 500);
      return () => clearTimeout(t);
    }
  }, [isFavorite, shouldReduceMotion]);

  const heartGlyphClass = cn("h-5 w-5 shrink-0", iconAtEnd && "translate-x-px");

  const heartSvgProps = {
    xmlns: "http://www.w3.org/2000/svg" as const,
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: heartGlyphClass,
    style: { willChange: "transform" as const },
  };

  const breakingHeartClass = cn(
    "h-5 w-5 absolute text-[var(--color-text-muted)]",
    iconAtEnd ? "right-0 top-1/2 -translate-y-1/2 translate-x-px" : "inset-0 m-auto"
  );

  // Heartbeat hover: only on pointer devices, disabled for reduced motion
  const hoverAnimation =
    canHover && !shouldReduceMotion
      ? {
          scale: [1, 1.18, 1, 1.12, 1],
          transition: { duration: 0.4, ease: "easeOut" as const },
        }
      : undefined;

  const renderHeart = () => {
    // Breaking animation: two halves splitting apart
    if (breaking) {
      return (
        <>
          <motion.svg
            {...heartSvgProps}
            fill="currentColor"
            stroke="currentColor"
            className={breakingHeartClass}
            style={{ clipPath: "inset(0 50% 0 0)" }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: -5, y: 7, rotate: -20, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
          >
            <path d={HEART_PATH} />
          </motion.svg>
          <motion.svg
            {...heartSvgProps}
            fill="currentColor"
            stroke="currentColor"
            className={breakingHeartClass}
            style={{ clipPath: "inset(0 0 0 50%)" }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: 5, y: 7, rotate: 20, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
          >
            <path d={HEART_PATH} />
          </motion.svg>
        </>
      );
    }

    // Saved state: filled heart with pop animation
    if (isFavorite) {
      return (
        <motion.svg
          {...heartSvgProps}
          fill="currentColor"
          stroke="currentColor"
          initial={justSaved ? { scale: 0.5 } : false}
          animate={justSaved ? { scale: [0.5, 1.35, 0.9, 1.08, 1] } : { scale: 1 }}
          transition={justSaved ? { duration: 0.35, ease: EASE_OUT_QUINT } : { duration: 0.15 }}
          whileHover={hoverAnimation}
        >
          <path d={HEART_PATH} />
        </motion.svg>
      );
    }

    // Unsaved state: outline heart
    return (
      <motion.svg {...heartSvgProps} fill="none" stroke="currentColor" whileHover={hoverAnimation}>
        <path d={HEART_PATH} />
      </motion.svg>
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={isFavorite ? onUnsave : onSave}
          disabled={saving || unsaving}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "press-scale flex-shrink-0 inline-flex items-center rounded-full transition disabled:opacity-50 relative h-9",
            iconAtEnd ? "min-w-9 justify-end pl-4 pr-0" : "w-9 justify-center",
            isFavorite
              ? "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]"
          )}
        >
          <span className="relative inline-flex h-5 w-5 shrink-0">
            {renderHeart()}

            {/* Particle burst */}
            <AnimatePresence>
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: iconAtEnd ? "calc(100% - 4px)" : "50%",
                    top: "50%",
                    marginLeft: iconAtEnd ? 0 : -4,
                    marginTop: -4,
                    willChange: "transform, opacity",
                  }}
                  initial={{ transform: "translate(0px, 0px) scale(0) rotate(0deg)", opacity: 1 }}
                  animate={{
                    transform: `translate(${p.x}px, ${p.y}px) scale(${p.scale}) rotate(${p.rotation}deg)`,
                    opacity: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: EASE_OUT_QUINT }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    className="h-2.5 w-2.5 text-red-400 dark:text-red-300"
                  >
                    <path d={HEART_PATH} />
                  </svg>
                </motion.div>
              ))}
            </AnimatePresence>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isFavorite ? "Remove from favorites" : "Add to favorites"}
      </TooltipContent>
    </Tooltip>
  );
}
