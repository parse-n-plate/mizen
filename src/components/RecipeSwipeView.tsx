"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

const SWIPE_THRESHOLD_RATIO = 0.2;
const SWIPE_VELOCITY_THRESHOLD = 500;

interface RecipeSwipeViewProps {
  activeTab: "prep" | "cook";
  onTabChange: (tab: "prep" | "cook") => void;
  enableSwipe: boolean;
  prep: ReactNode;
  cook: ReactNode;
}

export function RecipeSwipeView({
  activeTab,
  onTabChange,
  enableSwipe,
  prep,
  cook,
}: RecipeSwipeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const width = containerRef.current?.offsetWidth ?? 0;
    if (!width) return;
    const passedThreshold = Math.abs(info.offset.x) > width * SWIPE_THRESHOLD_RATIO;
    const passedVelocity = Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;
    if (!passedThreshold && !passedVelocity) return;

    if (info.offset.x < 0 && activeTab === "prep") onTabChange("cook");
    else if (info.offset.x > 0 && activeTab === "cook") onTabChange("prep");
  };

  if (!enableSwipe) {
    return (
      <>
        {activeTab === "prep" ? (
          <div key="prep" className="tab-content-animate">
            {prep}
          </div>
        ) : (
          <div key="cook" className="tab-content-animate">
            {cook}
          </div>
        )}
      </>
    );
  }

  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div
        className="flex w-[200%]"
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.12}
        dragMomentum={false}
        animate={{ x: activeTab === "prep" ? "0%" : "-50%" }}
        transition={
          prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38 }
        }
        onDragEnd={handleDragEnd}
      >
        <div className="w-1/2 shrink-0">{prep}</div>
        <div className="w-1/2 shrink-0">{cook}</div>
      </motion.div>
    </div>
  );
}
