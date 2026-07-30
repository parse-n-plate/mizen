"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { ReactNode } from "react";

type TransitionDirection = "back" | "forward" | "up" | "down";

const tabOrder = ["/", "/cookbook", "/profile"];

function transitionDirection(from: string, to: string): TransitionDirection {
  if (to === "/search") return "up";
  if (from === "/search") return "down";

  const fromTab = tabOrder.indexOf(from);
  const toTab = tabOrder.indexOf(to);

  // The primary navigation is a row of peers. Its movement follows the tab
  // that was selected, preserving the left-to-right spatial model.
  if (fromTab !== -1 && toTab !== -1) return toTab < fromTab ? "back" : "forward";

  const fromDepth = from.split("/").filter(Boolean).length;
  const toDepth = to.split("/").filter(Boolean).length;
  return toDepth < fromDepth ? "back" : "forward";
}

const variants = {
  initial: (direction: TransitionDirection) => ({
    opacity: 0,
    x: direction === "forward" ? "7%" : direction === "back" ? "-7%" : 0,
    y: direction === "up" ? "6%" : direction === "down" ? "-3%" : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  exit: (direction: TransitionDirection) => ({
    opacity: 0,
    x: direction === "forward" ? "-3%" : direction === "back" ? "3%" : 0,
    y: direction === "up" ? "-3%" : direction === "down" ? "6%" : 0,
  }),
};

/**
 * Keeps mobile route changes legible as movement through one continuous space.
 * Desktop retains its immediate, document-like navigation behavior.
 */
export function MobileScreenTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [previousPathname, setPreviousPathname] = useState(pathname);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const prefersReducedMotion = useReducedMotion();
  const direction = transitionDirection(previousPathname, pathname);

  useEffect(() => {
    setPreviousPathname(pathname);
  }, [pathname]);

  if (!isMobile || prefersReducedMotion) return <>{children}</>;

  return (
    <AnimatePresence initial={false} mode="popLayout" custom={direction}>
      <motion.div
        key={pathname}
        className="mobile-screen-transition min-h-full"
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
